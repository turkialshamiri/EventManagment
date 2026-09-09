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
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  EventPackage,
  PackageWritePayload,
  calcPackageItemTotal,
  calcPackageTotal,
} from '../../core/models/event.models';
import { PackageService } from '../../core/services/package.service';
import { SarPipe } from '../../shared/pipes/format.pipes';

function uniqueItemNamesValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof FormArray)) return null;
  const names = control.controls
    .map((c) => String(c.get('name')?.value ?? '').trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) return { duplicateItems: true };
    seen.add(name);
  }
  return null;
}

@Component({
  selector: 'app-package-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, SarPipe],
  templateUrl: './package-form-dialog.html',
  styleUrl: './package-form-dialog.scss',
})
export class PackageFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly packagesApi = inject(PackageService);

  @Input() open = false;
  @Input() package: EventPackage | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventPackage>();

  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [''],
    description: [''],
    durationHours: [0, [Validators.required, Validators.min(0)]],
    active: [true],
    items: this.fb.array([], uniqueItemNamesValidator),
  });

  get items(): FormArray {
    return this.form.controls.items;
  }

  get isEdit(): boolean {
    return !!this.package;
  }

  get dialogTitle(): string {
    return this.isEdit ? 'تعديل الباقة' : 'إضافة باقة جديدة';
  }

  get calculatedTotal(): number {
    return calcPackageTotal(
      this.items.controls.map((c) => ({
        quantity: Number(c.get('quantity')?.value) || 0,
        unitPrice: Number(c.get('unitPrice')?.value) || 0,
      }))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['package']) {
      if (this.open) {
        this.resetForm(this.package);
      }
    }
  }

  itemTotal(index: number): number {
    const row = this.items.at(index);
    return calcPackageItemTotal({
      quantity: Number(row.get('quantity')?.value) || 0,
      unitPrice: Number(row.get('unitPrice')?.value) || 0,
    });
  }

  addItem(name = '', quantity = 1, unitPrice = 0): void {
    this.items.push(
      this.fb.nonNullable.group({
        name: [name, [Validators.required, Validators.minLength(2)]],
        quantity: [quantity, [Validators.required, Validators.min(0.01)]],
        unitPrice: [unitPrice, [Validators.required, Validators.min(0)]],
      })
    );
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  fieldError(path: string): string {
    const control = this.form.get(path);
    if (!control || (!this.submitted() && !control.touched)) return '';
    if (control.hasError('required')) {
      if (path === 'name') return 'اسم الباقة مطلوب';
      return 'هذا الحقل مطلوب';
    }
    if (control.hasError('minlength')) return 'القيمة قصيرة جداً';
    if (control.hasError('min')) {
      if (path === 'durationHours') return 'المدة يجب ألا تكون سالبة';
      return 'قيمة غير صالحة';
    }
    return '';
  }

  itemFieldError(index: number, field: 'name' | 'quantity' | 'unitPrice'): string {
    const control = this.items.at(index).get(field);
    if (!control || (!this.submitted() && !control.touched)) return '';
    if (control.hasError('required')) {
      if (field === 'name') return 'اسم العنصر مطلوب';
      return 'مطلوب';
    }
    if (control.hasError('min')) {
      if (field === 'quantity') return 'الكمية يجب أن تكون أكبر من صفر';
      if (field === 'unitPrice') return 'السعر يجب ألا يكون سالباً';
    }
    if (control.hasError('minlength')) return 'الاسم قصير جداً';
    return '';
  }

  duplicateItemsError(): boolean {
    return this.submitted() && !!this.items.errors?.['duplicateItems'];
  }

  close(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  submit(): void {
    this.submitted.set(true);
    this.saveError.set('');
    if (this.items.length === 0) {
      this.saveError.set('أضف عنصراً واحداً على الأقل للباقة');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const itemRows = raw.items as Array<{ name: string; quantity: number; unitPrice: number }>;
    const payload: PackageWritePayload = {
      name: raw.name,
      code: raw.code,
      description: raw.description,
      durationHours: Number(raw.durationHours) || 0,
      active: raw.active,
      items: itemRows.map((item) => ({
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    this.saving.set(true);
    const request$ = this.isEdit && this.package
      ? this.packagesApi.updatePackage(this.package.id, payload)
      : this.packagesApi.createPackage(payload);

    request$.subscribe({
      next: (pkg) => {
        this.saving.set(false);
        this.saved.emit(pkg);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set(
          this.isEdit ? 'تعذر تحديث الباقة. حاول مرة أخرى.' : 'تعذر إنشاء الباقة. حاول مرة أخرى.'
        );
      },
    });
  }

  private resetForm(pkg: EventPackage | null): void {
    this.submitted.set(false);
    this.saving.set(false);
    this.saveError.set('');
    this.items.clear();

    if (pkg) {
      this.form.patchValue({
        name: pkg.name,
        code: pkg.code,
        description: pkg.description ?? '',
        durationHours: pkg.durationHours ?? 0,
        active: pkg.active,
      });
      if (pkg.items.length) {
        for (const item of pkg.items) {
          const qty = typeof item.quantity === 'number' ? item.quantity : 1;
          this.addItem(item.name, qty, item.unitPrice);
        }
      } else {
        this.addItem();
      }
    } else {
      this.form.reset({
        name: '',
        code: '',
        description: '',
        durationHours: 0,
        active: true,
      });
      this.addItem('قاعة جراند', 1, 5000);
      this.addItem('وجبة عشاء', 200, 20);
    }
  }
}
