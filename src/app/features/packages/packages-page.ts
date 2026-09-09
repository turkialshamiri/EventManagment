import { Component, inject, signal } from '@angular/core';
import {
  EventPackage,
  calcPackageItemTotal,
  calcPackageTotal,
} from '../../core/models/event.models';
import { PackageService } from '../../core/services/package.service';
import { SarPipe } from '../../shared/pipes/format.pipes';
import { PackageFormDialogComponent } from './package-form-dialog';

@Component({
  selector: 'app-packages-page',
  standalone: true,
  imports: [SarPipe, PackageFormDialogComponent],
  template: `
    <div class="em-page">
      <div class="head">
        <div>
          <h1 class="t-display-lg">حزم المناسبات</h1>
          <p class="t-body-sm muted">الباقات، البنود، الأسعار، وحالة التفعيل</p>
        </div>
        <button type="button" class="em-btn em-btn--primary" (click)="openCreate()">
          <span class="material-symbols-outlined">add_circle</span>
          إضافة باقة
        </button>
      </div>

      @if (feedback()) {
        <div class="toast" [attr.data-kind]="feedbackKind()" role="status">{{ feedback() }}</div>
      }

      <div class="grid">
        @for (p of packages(); track p.id) {
          <article
            class="em-card card"
            [class.inactive]="!p.active"
            [class.selected]="selected()?.id === p.id"
            (click)="select(p)"
          >
            <div class="card__top">
              <h2 class="t-headline-md">{{ p.name }}</h2>
              <span class="badge" [class.off]="!p.active">{{ p.active ? 'نشطة' : 'غير نشطة' }}</span>
            </div>
            <div class="t-caption muted code">{{ p.code }}</div>
            <p class="t-body-sm muted">{{ p.description || '—' }}</p>
            <div class="price t-metric">{{ displayPrice(p) | sar: false }} <span class="curr">ر.س</span></div>
            <div class="meta t-caption muted">
              <span>{{ p.items.length }} بند/بنود</span>
              <span>•</span>
              <span>المدة: {{ p.durationHours }} ساعة</span>
            </div>
            <div class="card__actions" (click)="$event.stopPropagation()">
              <button type="button" class="em-btn em-btn--ghost em-btn--sm" (click)="select(p)" title="عرض">
                <span class="material-symbols-outlined">visibility</span>
                عرض
              </button>
              <button type="button" class="em-btn em-btn--ghost em-btn--sm" (click)="openEdit(p)" title="تعديل">
                <span class="material-symbols-outlined">edit</span>
                تعديل
              </button>
              <button
                type="button"
                class="em-btn em-btn--danger em-btn--sm"
                (click)="openDelete(p)"
                title="حذف"
              >
                <span class="material-symbols-outlined">delete</span>
                حذف
              </button>
            </div>
          </article>
        }
      </div>

      @if (selected(); as p) {
        <section class="em-card detail">
          <div class="detail__head">
            <div>
              <div class="t-caption muted">{{ p.code }}</div>
              <h2 class="t-headline-lg">{{ p.name }}</h2>
              <p class="t-body-sm muted">{{ p.description || '—' }}</p>
            </div>
            <div class="detail__actions">
              <span class="badge" [class.off]="!p.active">{{ p.active ? 'نشطة' : 'غير نشطة' }}</span>
              <button type="button" class="em-btn em-btn--ghost em-btn--sm" (click)="openEdit(p)">
                <span class="material-symbols-outlined">edit</span>
                تعديل
              </button>
              <button type="button" class="em-btn em-btn--danger em-btn--sm" (click)="openDelete(p)">
                <span class="material-symbols-outlined">delete</span>
                حذف
              </button>
            </div>
          </div>

          <div class="detail__meta t-body-sm">
            <span>المدة: <strong>{{ p.durationHours }} ساعة</strong></span>
            <span>عدد البنود: <strong>{{ p.items.length }}</strong></span>
            <span>الإجمالي: <strong>{{ displayPrice(p) | sar }}</strong></span>
          </div>

          <table>
            <thead>
              <tr>
                <th>البند</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              @for (i of p.items; track i.id) {
                <tr>
                  <td>{{ i.name }}</td>
                  <td>{{ i.quantity }}</td>
                  <td>{{ i.unitPrice | sar }}</td>
                  <td>{{ itemTotal(i) | sar }}</td>
                  <td>{{ i.gift ? 'هدية' : i.included ? 'مشمول' : '—' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">لا بنود</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    </div>

    <app-package-form-dialog
      [open]="formOpen()"
      [package]="editingPackage()"
      (closed)="closeForm()"
      (saved)="onSaved($event)"
    />

    @if (deleteTarget(); as target) {
      <div class="modal-backdrop" (click)="closeDelete()" role="presentation">
        <div class="modal em-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="modal__accent"></div>
          <h2 class="t-headline-md">تأكيد حذف الباقة</h2>
          @if (packageInUse()) {
            <p class="t-body-sm muted">
              لا يمكن حذف هذه الباقة لأنها مستخدمة في مناسبات موجودة.
            </p>
            <p class="t-body-sm">
              الباقة: <strong>{{ target.name }}</strong>
            </p>
            <div class="modal__actions">
              <button type="button" class="em-btn em-btn--ghost" (click)="closeDelete()" [disabled]="busy()">
                إلغاء
              </button>
              <button type="button" class="em-btn em-btn--navy" (click)="deactivateInstead()" [disabled]="busy()">
                {{ busy() ? 'جاري التعطيل...' : 'تعطيل الباقة' }}
              </button>
            </div>
          } @else {
            <p class="t-body-sm muted">هل أنت متأكد من حذف هذه الباقة؟</p>
            <p class="t-body-sm">
              الباقة: <strong>{{ target.name }}</strong>
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--gutter-md);
      margin-top: var(--gutter-md);
    }
    .card {
      padding: var(--gutter-lg);
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .card:hover,
    .card:focus-within,
    .card.selected {
      border-color: var(--secondary);
    }
    .card.inactive {
      opacity: 0.7;
    }
    .card__top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .code {
      font-weight: 600;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .card__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: #ecfdf5;
      color: #065f46;
      height: fit-content;
    }
    .badge.off {
      background: var(--status-draft-bg);
      color: var(--status-draft);
    }
    .price {
      font-size: 22px;
    }
    .curr {
      font-size: 12px;
      color: var(--secondary);
      font-weight: 600;
    }
    .detail {
      margin-top: var(--gutter-lg);
      padding: var(--gutter-lg);
    }
    .detail__head {
      display: flex;
      justify-content: space-between;
      gap: var(--gutter-md);
      flex-wrap: wrap;
      align-items: flex-start;
    }
    .detail__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .detail__meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gutter-lg);
      margin: var(--gutter-md) 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: var(--gutter-md);
      font-size: 13px;
    }
    th,
    td {
      text-align: start;
      padding: 10px 8px;
      border-bottom: 1px solid var(--outline-variant);
    }
    th {
      color: var(--on-surface-variant);
      font-size: 12px;
      font-weight: 500;
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
export class PackagesPageComponent {
  private readonly packagesApi = inject(PackageService);

  readonly packages = this.packagesApi.packages;
  readonly selected = signal<EventPackage | null>(this.packages().find((p) => p.active) ?? null);

  readonly formOpen = signal(false);
  readonly editingPackage = signal<EventPackage | null>(null);

  readonly deleteTarget = signal<EventPackage | null>(null);
  readonly packageInUse = signal(false);
  readonly busy = signal(false);
  readonly deleteError = signal('');

  readonly feedback = signal('');
  readonly feedbackKind = signal<'success' | 'error'>('success');
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  select(pkg: EventPackage): void {
    this.selected.set(pkg);
  }

  displayPrice(pkg: EventPackage): number {
    const calculated = calcPackageTotal(pkg.items);
    return calculated > 0 ? calculated : pkg.basePrice;
  }

  itemTotal(item: EventPackage['items'][number]): number {
    return calcPackageItemTotal(item);
  }

  openCreate(): void {
    this.editingPackage.set(null);
    this.formOpen.set(true);
  }

  openEdit(pkg: EventPackage): void {
    this.editingPackage.set(pkg);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingPackage.set(null);
  }

  onSaved(pkg: EventPackage): void {
    const wasEdit = !!this.editingPackage();
    this.closeForm();
    this.selected.set(pkg);
    this.showFeedback(wasEdit ? 'تم تحديث الباقة بنجاح' : 'تم إنشاء الباقة بنجاح');
  }

  openDelete(pkg: EventPackage): void {
    this.deleteError.set('');
    this.packageInUse.set(this.packagesApi.isPackageInUse(pkg.id));
    this.deleteTarget.set(pkg);
  }

  closeDelete(): void {
    if (this.busy()) return;
    this.deleteTarget.set(null);
    this.deleteError.set('');
    this.packageInUse.set(false);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.busy.set(true);
    this.deleteError.set('');
    this.packagesApi.deletePackage(target.id).subscribe({
      next: () => {
        this.busy.set(false);
        if (this.selected()?.id === target.id) {
          this.selected.set(this.packages()[0] ?? null);
        }
        this.deleteTarget.set(null);
        this.showFeedback('تم حذف الباقة بنجاح');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const message = err instanceof Error ? err.message : '';
        if (message === 'PACKAGE_IN_USE') {
          this.packageInUse.set(true);
          return;
        }
        this.deleteError.set('تعذر حذف الباقة. حاول مرة أخرى.');
      },
    });
  }

  deactivateInstead(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.busy.set(true);
    this.packagesApi.deactivatePackage(target.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.selected.set(updated);
        this.deleteTarget.set(null);
        this.showFeedback('تم تعطيل الباقة بنجاح');
      },
      error: () => {
        this.busy.set(false);
        this.deleteError.set('تعذر تعطيل الباقة. حاول مرة أخرى.');
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
