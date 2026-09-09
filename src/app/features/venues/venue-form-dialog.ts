import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Venue,
  VenueWritePayload,
  VENUE_SETUP_CATALOG,
} from '../../core/models/event.models';
import { VenueService } from '../../core/services/venue.service';

function uniqueSetupNamesValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof FormArray)) return null;
  const names = control.controls
    .map((c) => String(c.get('name')?.value ?? '').trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) return { duplicateSetups: true };
    seen.add(name);
  }
  return null;
}

@Component({
  selector: 'app-venue-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './venue-form-dialog.html',
  styleUrl: './venue-form-dialog.scss',
})
export class VenueFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly venuesApi = inject(VenueService);

  @Input() open = false;
  @Input() venue: Venue | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Venue>();

  readonly catalog = VENUE_SETUP_CATALOG;
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [''],
    description: [''],
    floor: [''],
    capacity: [100, [Validators.required, Validators.min(1)]],
    active: [true],
    imageUrl: [''],
    setups: this.fb.array([], uniqueSetupNamesValidator),
  });

  get setups(): FormArray {
    return this.form.controls.setups;
  }

  get isEdit(): boolean {
    return !!this.venue;
  }

  get dialogTitle(): string {
    return this.isEdit ? 'تعديل القاعة' : 'إضافة قاعة';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['venue']) && this.open) {
      this.resetForm(this.venue);
    }
  }

  addSetup(name = '', capacity = 50): void {
    this.setups.push(
      this.fb.nonNullable.group({
        name: [name, [Validators.required, Validators.minLength(2)]],
        capacity: [capacity, [Validators.required, Validators.min(1)]],
      })
    );
  }

  addFromCatalog(catalogName: string): void {
    if (!catalogName) return;
    const exists = this.setups.controls.some(
      (c) => String(c.get('name')?.value ?? '').trim() === catalogName
    );
    if (exists) return;
    const venueCap = Number(this.form.controls.capacity.value) || 100;
    this.addSetup(catalogName, venueCap);
  }

  removeSetup(index: number): void {
    this.setups.removeAt(index);
  }

  fieldError(path: string): string {
    const control = this.form.get(path);
    if (!control || (!this.submitted() && !control.touched)) return '';
    if (control.hasError('required')) {
      if (path === 'name') return 'اسم القاعة مطلوب';
      if (path === 'capacity') return 'السعة مطلوبة';
      return 'هذا الحقل مطلوب';
    }
    if (control.hasError('minlength')) return 'القيمة قصيرة جداً';
    if (control.hasError('min')) {
      if (path === 'capacity') return 'سعة القاعة يجب أن تكون أكبر من صفر';
    }
    return '';
  }

  setupFieldError(index: number, field: 'name' | 'capacity'): string {
    const control = this.setups.at(index).get(field);
    if (!control || (!this.submitted() && !control.touched)) return '';
    if (control.hasError('required')) {
      return field === 'name' ? 'اسم التجهيز مطلوب' : 'السعة مطلوبة';
    }
    if (control.hasError('min')) return 'السعة يجب أن تكون أكبر من صفر';
    if (control.hasError('minlength')) return 'الاسم قصير جداً';
    return '';
  }

  duplicateSetupsError(): boolean {
    return this.submitted() && !!this.setups.errors?.['duplicateSetups'];
  }

  close(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  submit(): void {
    this.submitted.set(true);
    this.saveError.set('');
    if (this.setups.length === 0) {
      this.saveError.set('أضف نمط تجهيز واحداً على الأقل');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const setupRows = raw.setups as Array<{ name: string; capacity: number }>;
    const payload: VenueWritePayload = {
      name: raw.name,
      code: raw.code,
      description: raw.description,
      floor: raw.floor,
      capacity: Number(raw.capacity),
      active: raw.active,
      imageUrl: raw.imageUrl,
      setups: setupRows.map((s) => ({
        name: s.name,
        capacity: Number(s.capacity),
      })),
    };

    this.saving.set(true);
    const request$ =
      this.isEdit && this.venue
        ? this.venuesApi.updateVenue(this.venue.id, payload)
        : this.venuesApi.createVenue(payload);

    request$.subscribe({
      next: (venue) => {
        this.saving.set(false);
        this.saved.emit(venue);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const message = err instanceof Error ? err.message : '';
        if (message === 'CODE_TAKEN') {
          this.saveError.set('الرمز مستخدم مسبقاً');
          return;
        }
        this.saveError.set(
          this.isEdit ? 'تعذر تحديث بيانات القاعة. حاول مرة أخرى.' : 'تعذر إنشاء القاعة. حاول مرة أخرى.'
        );
      },
    });
  }

  private resetForm(venue: Venue | null): void {
    this.submitted.set(false);
    this.saving.set(false);
    this.saveError.set('');
    this.setups.clear();

    if (venue) {
      this.form.reset({
        name: venue.name,
        code: venue.code,
        description: venue.description ?? '',
        floor: venue.floor ?? '',
        capacity: venue.capacity,
        active: venue.active,
        imageUrl: venue.imageUrl ?? '',
      });
      if (venue.setups.length) {
        for (const s of venue.setups) {
          this.addSetup(s.name, s.capacity);
        }
      } else {
        this.addSetup('مأدبة', venue.capacity);
      }
    } else {
      this.form.reset({
        name: '',
        code: '',
        description: '',
        floor: '',
        capacity: 100,
        active: true,
        imageUrl: '',
      });
      this.addSetup('مأدبة', 100);
      this.addSetup('مسرحي', 120);
    }
  }
}
