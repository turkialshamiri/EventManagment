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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventType, EventTypeWritePayload } from '../../core/models/event.models';
import { EventTypeService } from '../../core/services/event-type.service';

@Component({
  selector: 'app-event-type-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './event-type-form-dialog.html',
  styleUrl: './event-type-form-dialog.scss',
})
export class EventTypeFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly typesApi = inject(EventTypeService);

  @Input() open = false;
  @Input() eventType: EventType | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventType>();

  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [''],
    description: [''],
    displayOrder: [1, [Validators.required, Validators.min(0)]],
    active: [true],
    icon: ['category'],
  });

  get isEdit(): boolean {
    return !!this.eventType;
  }

  get dialogTitle(): string {
    return this.isEdit ? 'تعديل نوع الفعالية' : 'إضافة نوع فعالية';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['eventType']) && this.open) {
      this.resetForm(this.eventType);
    }
  }

  fieldError(path: string): string {
    const control = this.form.get(path);
    if (!control || (!this.submitted() && !control.touched)) return '';
    if (control.hasError('required')) {
      if (path === 'name') return 'اسم نوع الفعالية مطلوب';
      return 'هذا الحقل مطلوب';
    }
    if (control.hasError('minlength')) return 'القيمة قصيرة جداً';
    if (control.hasError('min')) {
      if (path === 'displayOrder') return 'ترتيب العرض يجب أن يكون رقماً صحيحاً';
    }
    return '';
  }

  close(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  submit(): void {
    this.submitted.set(true);
    this.saveError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: EventTypeWritePayload = {
      name: raw.name,
      code: raw.code,
      description: raw.description,
      displayOrder: Math.max(0, Math.floor(Number(raw.displayOrder) || 0)),
      active: raw.active,
      icon: raw.icon || 'category',
    };

    this.saving.set(true);
    const request$ =
      this.isEdit && this.eventType
        ? this.typesApi.updateEventType(this.eventType.id, payload)
        : this.typesApi.createEventType(payload);

    request$.subscribe({
      next: (type) => {
        this.saving.set(false);
        this.saved.emit(type);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const message = err instanceof Error ? err.message : '';
        if (message === 'CODE_TAKEN') {
          this.saveError.set('الرمز مستخدم مسبقاً');
          return;
        }
        this.saveError.set(
          this.isEdit
            ? 'تعذر تحديث نوع الفعالية. حاول مرة أخرى.'
            : 'تعذر إنشاء نوع الفعالية. حاول مرة أخرى.'
        );
      },
    });
  }

  private resetForm(type: EventType | null): void {
    this.submitted.set(false);
    this.saving.set(false);
    this.saveError.set('');
    if (type) {
      this.form.reset({
        name: type.name,
        code: type.code,
        description: type.description ?? '',
        displayOrder: type.displayOrder,
        active: type.active,
        icon: type.icon || 'category',
      });
    } else {
      const nextOrder =
        (this.typesApi.types().reduce((max, t) => Math.max(max, t.displayOrder), 0) || 0) + 1;
      this.form.reset({
        name: '',
        code: '',
        description: '',
        displayOrder: nextOrder,
        active: true,
        icon: 'category',
      });
    }
  }
}
