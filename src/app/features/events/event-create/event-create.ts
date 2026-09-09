import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventDataService } from '../../../core/services/event-data.service';
import { CapacityBarComponent } from '../../../shared/components/capacity-bar/capacity-bar';
import { ArNumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { calcFinancials, Customer, EventPackage, Venue } from '../../../core/models/event.models';

function guestsOrderValidator(group: AbstractControl): ValidationErrors | null {
  const expected = Number(group.get('expectedGuests')?.value ?? 0);
  const guaranteed = Number(group.get('guaranteedGuests')?.value ?? 0);
  if (guaranteed > expected) {
    return { guestsOrder: true };
  }
  return null;
}

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CapacityBarComponent, ArNumberPipe, SarPipe],
  templateUrl: './event-create.html',
  styleUrl: './event-create.scss',
})
export class EventCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(EventDataService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly customers = signal<Customer[]>([]);
  readonly submitted = signal(false);

  readonly venues = this.data.venues;
  readonly types = this.data.types;
  readonly packages = this.data.packages;
  readonly groups = this.data.groups;

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      eventTypeId: ['', Validators.required],
      groupId: [''],
      customerId: ['', Validators.required],
      status: this.fb.nonNullable.control<'draft' | 'tentative' | 'confirmed'>('tentative'),
      startDate: ['2024-11-15', Validators.required],
      endDate: ['2024-11-15', Validators.required],
      setupTime: ['14:00', Validators.required],
      startTime: ['18:00', Validators.required],
      endTime: ['23:30', Validators.required],
      teardownTime: ['01:00'],
      venueId: ['', Validators.required],
      setupId: [''],
      expectedGuests: [450, [Validators.required, Validators.min(1)]],
      guaranteedGuests: [400, [Validators.required, Validators.min(0)]],
      packageId: [''],
      notesCustomer: [''],
      notesInternal: [''],
      linkRooms: [true],
    },
    { validators: [guestsOrderValidator] }
  );

  readonly selectedVenue = computed(() => {
    const id = this.form.controls.venueId.value;
    return this.venues().find((v) => v.id === id) ?? null;
  });

  readonly selectedPackage = computed(() => {
    const id = this.form.controls.packageId.value;
    return this.packages().find((p) => p.id === id) ?? null;
  });

  readonly selectedCustomer = computed(() => {
    const id = this.form.controls.customerId.value;
    return this.customers().find((c) => c.id === id) ?? null;
  });

  readonly capacityPercent = computed(() => {
    const venue = this.selectedVenue();
    const setup = venue?.setups.find((s) => s.id === this.form.controls.setupId.value);
    const cap = setup?.capacity ?? venue?.capacity ?? 0;
    const guests = this.form.controls.expectedGuests.value || 0;
    if (!cap) return 0;
    return Math.round((guests / cap) * 100);
  });

  readonly overCapacity = computed(() => this.capacityPercent() > 100);

  readonly hasConflict = computed(() => {
    const v = this.form.getRawValue();
    if (!v.venueId || !v.startDate || !v.startTime || !v.endTime) return false;
    return this.data.hasVenueConflict(v.venueId, v.startDate, v.startTime, v.endTime);
  });

  readonly finance = computed(() => {
    const pkg = this.selectedPackage();
    const guests = this.form.controls.guaranteedGuests.value || 1;
    const items =
      pkg?.items.map((pi, idx) => ({
        id: `tmp-${idx}`,
        name: pi.name,
        quantity: typeof pi.quantity === 'number' ? pi.quantity : guests,
        unitPrice: pi.unitPrice,
        discountPercent: 0,
        taxPercent: 15,
      })) ?? [];
    return calcFinancials(items, 10, 15, 0);
  });

  ngOnInit(): void {
    this.data.getCustomers().subscribe((c) => {
      this.customers.set(c);
      if (!this.form.controls.customerId.value && c[0]) {
        this.form.controls.customerId.setValue(c[0].id);
      }
    });

    const firstVenue = this.venues().find((v) => v.active) ?? this.venues()[0];
    if (firstVenue) {
      this.form.controls.venueId.setValue(firstVenue.id);
      this.form.controls.setupId.setValue(firstVenue.setups[0]?.id ?? '');
    }
    const firstType = this.types().find((t) => t.active) ?? this.types()[0];
    if (firstType) this.form.controls.eventTypeId.setValue(firstType.id);
    const firstPkg = this.packages().find((p) => p.active);
    if (firstPkg) this.form.controls.packageId.setValue(firstPkg.id);

    this.form.controls.venueId.valueChanges.subscribe((id) => {
      const venue = this.venues().find((v) => v.id === id);
      this.form.controls.setupId.setValue(venue?.setups[0]?.id ?? '');
    });
  }

  fieldError(name: string): string {
    if (!this.submitted() && !this.form.get(name)?.touched) return '';
    const c = this.form.get(name);
    if (!c || !c.errors) return '';
    if (c.errors['required']) return 'هذا الحقل مطلوب';
    if (c.errors['minlength']) return 'الاسم قصير جداً';
    if (c.errors['min']) return 'القيمة غير صالحة';
    return 'قيمة غير صحيحة';
  }

  guestsOrderError(): boolean {
    return this.submitted() && !!this.form.errors?.['guestsOrder'];
  }

  onVenueChange(venue: Venue | null): void {
    if (!venue) return;
    this.form.controls.setupId.setValue(venue.setups[0]?.id ?? '');
  }

  save(asDraft: boolean): void {
    this.submitted.set(true);
    if (asDraft) {
      this.form.controls.status.setValue('draft');
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.overCapacity() && !asDraft) {
      const ok = confirm(
        'الحضور المتوقع يتجاوز طاقة القاعة. هل تريد المتابعة مع تأكيد صريح؟'
      );
      if (!ok) return;
    }

    this.saving.set(true);
    this.saveError.set('');
    const value = this.form.getRawValue();
    this.data.createEvent({
      ...value,
      status: value.status,
    }).subscribe({
      next: (created) => {
        this.saving.set(false);
        void this.router.navigate(['/events', created.id]);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('تعذر حفظ المناسبة. حاول مرة أخرى.');
      },
    });
  }

  packageLabel(pkg: EventPackage): string {
    return pkg.active ? pkg.name : `${pkg.name} (غير نشطة)`;
  }
}
