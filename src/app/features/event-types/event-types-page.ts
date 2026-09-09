import { Component, inject, signal } from '@angular/core';
import { EventType } from '../../core/models/event.models';
import { EventTypeService } from '../../core/services/event-type.service';
import { EventTypeFormDialogComponent } from './event-type-form-dialog';

@Component({
  selector: 'app-event-types-page',
  standalone: true,
  imports: [EventTypeFormDialogComponent],
  template: `
    <div class="em-page">
      <div class="head">
        <div>
          <h1 class="t-display-lg">أنواع الفعاليات</h1>
          <p class="t-body-sm muted">إدارة التصنيفات المستخدمة في الحجوزات والفلاتر</p>
        </div>
        <button type="button" class="em-btn em-btn--primary" (click)="openCreate()">
          <span class="material-symbols-outlined">add_circle</span>
          إضافة نوع فعالية
        </button>
      </div>

      @if (feedback()) {
        <div class="toast" [attr.data-kind]="feedbackKind()" role="status">{{ feedback() }}</div>
      }

      <div class="em-card table-wrap">
        <table>
          <thead>
            <tr>
              <th>الأيقونة</th>
              <th>الرمز</th>
              <th>الاسم</th>
              <th>الوصف</th>
              <th>المناسبات</th>
              <th>الترتيب</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            @for (t of types(); track t.id) {
              <tr>
                <td><span class="material-symbols-outlined ico">{{ t.icon }}</span></td>
                <td class="t-caption code">{{ t.code }}</td>
                <td class="t-label-md">{{ t.name }}</td>
                <td class="muted">{{ t.description || '—' }}</td>
                <td>{{ eventCount(t.id) }}</td>
                <td>{{ t.displayOrder }}</td>
                <td>
                  <span class="badge" [class.off]="!t.active">{{ t.active ? 'فعال' : 'غير فعال' }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="em-btn em-btn--ghost em-btn--sm" (click)="openEdit(t)">
                      <span class="material-symbols-outlined">edit</span>
                      تعديل
                    </button>
                    <button type="button" class="em-btn em-btn--danger em-btn--sm" (click)="openDelete(t)">
                      <span class="material-symbols-outlined">delete</span>
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="muted">لا توجد أنواع فعاليات</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <app-event-type-form-dialog
      [open]="formOpen()"
      [eventType]="editingType()"
      (closed)="closeForm()"
      (saved)="onSaved($event)"
    />

    @if (deleteTarget(); as target) {
      <div class="modal-backdrop" (click)="closeDelete()" role="presentation">
        <div class="modal em-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="modal__accent"></div>
          <h2 class="t-headline-md">تأكيد حذف نوع الفعالية</h2>
          @if (typeInUse()) {
            <p class="t-body-sm muted">لا يمكن حذف نوع الفعالية لأنه مستخدم في مناسبات موجودة.</p>
            <p class="t-body-sm">
              النوع: <strong>{{ target.name }}</strong>
            </p>
            <div class="modal__actions">
              <button type="button" class="em-btn em-btn--ghost" (click)="closeDelete()" [disabled]="busy()">
                إلغاء
              </button>
              <button type="button" class="em-btn em-btn--navy" (click)="deactivateInstead()" [disabled]="busy()">
                {{ busy() ? 'جاري التعطيل...' : 'تعطيل نوع الفعالية' }}
              </button>
            </div>
          } @else {
            <p class="t-body-sm muted">هل أنت متأكد من حذف نوع الفعالية؟</p>
            <p class="t-body-sm">
              النوع: <strong>{{ target.name }}</strong>
            </p>
            @if (deleteError()) {
              <p class="error-text">{{ deleteError() }}</p>
            }
            <div class="modal__actions">
              <button type="button" class="em-btn em-btn--ghost" (click)="closeDelete()" [disabled]="busy()">
                إلغاء
              </button>
              <button type="button" class="em-btn em-btn--danger-solid" (click)="confirmDelete()" [disabled]="busy()">
                {{ busy() ? 'جاري الحذف...' : 'حذف' }}
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .muted {
      color: var(--on-surface-variant);
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--gutter-md);
      flex-wrap: wrap;
    }
    .toast {
      margin-top: var(--gutter-md);
      padding: var(--gutter-sm) var(--gutter-md);
      border-radius: var(--radius-lg);
      font-size: 13px;
    }
    .toast[data-kind='success'] {
      background: var(--status-confirmed-bg);
      color: #065f46;
      border: 1px solid var(--status-confirmed-border);
    }
    .toast[data-kind='error'] {
      background: var(--status-cancelled-bg);
      color: #9f1239;
      border: 1px solid var(--status-cancelled-border);
    }
    .table-wrap {
      margin-top: var(--gutter-md);
      overflow: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 860px;
    }
    th,
    td {
      text-align: start;
      padding: 14px 16px;
      border-bottom: 1px solid var(--outline-variant);
      font-size: 13px;
    }
    th {
      background: var(--surface);
      color: var(--on-surface-variant);
      font-size: 12px;
      font-weight: 500;
    }
    .ico {
      color: var(--secondary);
      font-size: 22px;
    }
    .code {
      font-weight: 600;
    }
    .badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: #ecfdf5;
      color: #065f46;
    }
    .badge.off {
      background: var(--status-draft-bg);
      color: var(--status-draft);
    }
    .row-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      z-index: 100;
      display: grid;
      place-items: center;
      padding: var(--gutter-lg);
    }
    .modal {
      width: min(440px, 100%);
      padding: var(--gutter-xl);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--gutter-md);
    }
    .modal__accent {
      position: absolute;
      inset-inline: 0;
      inset-block-start: 0;
      height: 2px;
      background: var(--secondary);
    }
    .modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
    }
    .error-text {
      color: var(--error);
      font-size: 13px;
      margin: 0;
    }
  `,
})
export class EventTypesPageComponent {
  private readonly typesApi = inject(EventTypeService);

  readonly types = this.typesApi.types;

  readonly formOpen = signal(false);
  readonly editingType = signal<EventType | null>(null);

  readonly deleteTarget = signal<EventType | null>(null);
  readonly typeInUse = signal(false);
  readonly busy = signal(false);
  readonly deleteError = signal('');

  readonly feedback = signal('');
  readonly feedbackKind = signal<'success' | 'error'>('success');
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  eventCount(typeId: string): number {
    return this.typesApi.countEventsForType(typeId);
  }

  openCreate(): void {
    this.editingType.set(null);
    this.formOpen.set(true);
  }

  openEdit(type: EventType): void {
    this.editingType.set(type);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingType.set(null);
  }

  onSaved(_type: EventType): void {
    const wasEdit = !!this.editingType();
    this.closeForm();
    this.showFeedback(wasEdit ? 'تم تحديث نوع الفعالية بنجاح' : 'تم إنشاء نوع الفعالية بنجاح');
  }

  openDelete(type: EventType): void {
    this.deleteError.set('');
    this.typeInUse.set(this.typesApi.isEventTypeInUse(type.id));
    this.deleteTarget.set(type);
  }

  closeDelete(): void {
    if (this.busy()) return;
    this.deleteTarget.set(null);
    this.deleteError.set('');
    this.typeInUse.set(false);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.busy.set(true);
    this.deleteError.set('');
    this.typesApi.deleteEventType(target.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.deleteTarget.set(null);
        this.showFeedback('تم حذف نوع الفعالية بنجاح');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const message = err instanceof Error ? err.message : '';
        if (message === 'EVENT_TYPE_IN_USE') {
          this.typeInUse.set(true);
          return;
        }
        this.deleteError.set('تعذر حذف نوع الفعالية. حاول مرة أخرى.');
      },
    });
  }

  deactivateInstead(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.busy.set(true);
    this.typesApi.deactivateEventType(target.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.deleteTarget.set(null);
        this.showFeedback('تم تعطيل نوع الفعالية بنجاح');
      },
      error: () => {
        this.busy.set(false);
        this.deleteError.set('تعذر تعطيل نوع الفعالية. حاول مرة أخرى.');
      },
    });
  }

  private showFeedback(message: string, kind: 'success' | 'error' = 'success'): void {
    this.feedback.set(message);
    this.feedbackKind.set(kind);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.feedback.set(''), 3200);
  }
}
