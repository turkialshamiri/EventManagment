import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HotelEvent, Venue } from '../../core/models/event.models';
import { VenueService } from '../../core/services/venue.service';
import { ArNumberPipe } from '../../shared/pipes/format.pipes';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { VenueFormDialogComponent } from './venue-form-dialog';

@Component({
  selector: 'app-venues-page',
  standalone: true,
  imports: [RouterLink, ArNumberPipe, StatusBadgeComponent, VenueFormDialogComponent],
  template: `
    <div class="em-page">
      <div class="head">
        <div>
          <h1 class="t-display-lg">إدارة القاعات</h1>
          <p class="t-body-sm muted">السعة، أنماط التجهيز، والتوافر والحجوزات الحالية</p>
        </div>
        <button type="button" class="em-btn em-btn--primary" (click)="openCreate()">
          <span class="material-symbols-outlined">add_circle</span>
          إضافة قاعة
        </button>
      </div>

      @if (feedback()) {
        <div class="toast" [attr.data-kind]="feedbackKind()" role="status">{{ feedback() }}</div>
      }

      <div class="layout">
        <div class="list">
          @for (v of venues(); track v.id) {
            <div class="venue-row em-card" [class.active]="selected()?.id === v.id" [class.inactive]="!v.active">
              <button type="button" class="venue-row__main" (click)="select(v)">
                <div>
                  <div class="t-caption muted code">{{ v.code }}</div>
                  <div class="t-headline-sm">{{ v.name }}</div>
                  <div class="t-caption muted">{{ v.floor }} • سعة {{ v.capacity | arNumber }}</div>
                </div>
                <span class="badge" [class.off]="!v.active">{{ v.active ? 'نشطة' : 'متوقفة' }}</span>
              </button>
              <div class="venue-row__actions">
                <button type="button" class="em-btn em-btn--ghost em-btn--sm" (click)="openEdit(v)">
                  <span class="material-symbols-outlined">edit</span>
                  تعديل
                </button>
                <button type="button" class="em-btn em-btn--danger em-btn--sm" (click)="openDelete(v)">
                  <span class="material-symbols-outlined">delete</span>
                  حذف
                </button>
              </div>
            </div>
          }
        </div>
        @if (selected(); as v) {
          <section class="em-card detail">
            <div class="detail__actions">
              <span class="badge" [class.off]="!v.active">{{ v.active ? 'نشطة' : 'متوقفة' }}</span>
              <button type="button" class="em-btn em-btn--ghost em-btn--sm" (click)="openEdit(v)">
                <span class="material-symbols-outlined">edit</span>
                تعديل
              </button>
              <button type="button" class="em-btn em-btn--danger em-btn--sm" (click)="openDelete(v)">
                <span class="material-symbols-outlined">delete</span>
                حذف
              </button>
            </div>
            @if (v.imageUrl) {
              <img class="hero" [src]="v.imageUrl" [alt]="v.name" />
            }
            <div class="t-caption muted">{{ v.code }}</div>
            <h2 class="t-headline-lg">{{ v.name }}</h2>
            <p class="t-body-sm muted">{{ v.description || '—' }}</p>
            <p class="t-body-sm muted">{{ v.floor }}</p>
            <div class="stats">
              <div><span class="t-caption muted">السعة القصوى</span><strong>{{ v.capacity | arNumber }}</strong></div>
              <div><span class="t-caption muted">أنماط التجهيز</span><strong>{{ v.setups.length }}</strong></div>
              <div><span class="t-caption muted">المناسبات المرتبطة</span><strong>{{ eventCount(v.id) }}</strong></div>
            </div>
            <h3 class="t-headline-sm">أنماط التجهيز</h3>
            <ul class="setups">
              @for (s of v.setups; track s.id) {
                <li>{{ s.name }} — سعة {{ s.capacity | arNumber }}</li>
              }
            </ul>
            <h3 class="t-headline-sm">الحجوزات المرتبطة</h3>
            <div class="bookings">
              @for (e of bookings(); track e.id) {
                <a class="booking" [routerLink]="['/events', e.id]">
                  <div>
                    <div class="t-label-md">{{ e.name }}</div>
                    <div class="t-caption muted">{{ e.startDate }} • {{ e.startTime }}–{{ e.endTime }}</div>
                  </div>
                  <app-status-badge [status]="e.status" />
                </a>
              } @empty {
                <p class="t-body-sm muted">لا توجد حجوزات حالياً.</p>
              }
            </div>
          </section>
        }
      </div>
    </div>

    <app-venue-form-dialog
      [open]="formOpen()"
      [venue]="editingVenue()"
      (closed)="closeForm()"
      (saved)="onSaved($event)"
    />

    @if (deleteTarget(); as target) {
      <div class="modal-backdrop" (click)="closeDelete()" role="presentation">
        <div class="modal em-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="modal__accent"></div>
          <h2 class="t-headline-md">تأكيد حذف القاعة</h2>
          @if (venueInUse()) {
            <p class="t-body-sm muted">لا يمكن حذف القاعة لأنها مرتبطة بمناسبات موجودة.</p>
            <p class="t-body-sm">
              القاعة: <strong>{{ target.name }}</strong>
            </p>
            <div class="modal__actions">
              <button type="button" class="em-btn em-btn--ghost" (click)="closeDelete()" [disabled]="busy()">
                إلغاء
              </button>
              <button type="button" class="em-btn em-btn--navy" (click)="deactivateInstead()" [disabled]="busy()">
                {{ busy() ? 'جاري التعطيل...' : 'تعطيل القاعة' }}
              </button>
            </div>
          } @else {
            <p class="t-body-sm muted">هل أنت متأكد من حذف هذه القاعة؟</p>
            <p class="t-body-sm">
              القاعة: <strong>{{ target.name }}</strong>
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
    .layout {
      display: grid;
      grid-template-columns: 340px minmax(0, 1fr);
      gap: var(--gutter-md);
      align-items: start;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .venue-row {
      padding: var(--gutter-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
      border: 1px solid transparent;
    }
    .venue-row.inactive {
      opacity: 0.75;
    }
    .venue-row.active {
      border-color: var(--secondary);
      box-shadow: inset -3px 0 0 var(--secondary);
    }
    .venue-row__main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      text-align: start;
      width: 100%;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      color: inherit;
    }
    .venue-row__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
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
    .detail {
      padding: var(--gutter-lg);
      display: flex;
      flex-direction: column;
      gap: var(--gutter-md);
    }
    .detail__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;
    }
    .hero {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: var(--radius-lg);
    }
    .stats {
      display: flex;
      gap: var(--gutter-xl);
      flex-wrap: wrap;
    }
    .stats div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .setups {
      margin: 0;
      padding-inline-start: 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }
    .booking {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 10px 0;
      border-bottom: 1px solid var(--outline-variant);
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
    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class VenuesPageComponent {
  private readonly venuesApi = inject(VenueService);

  readonly venues = this.venuesApi.venues;
  readonly selected = signal<Venue | null>(this.venues()[0] ?? null);
  readonly bookings = signal<HotelEvent[]>([]);

  readonly formOpen = signal(false);
  readonly editingVenue = signal<Venue | null>(null);

  readonly deleteTarget = signal<Venue | null>(null);
  readonly venueInUse = signal(false);
  readonly busy = signal(false);
  readonly deleteError = signal('');

  readonly feedback = signal('');
  readonly feedbackKind = signal<'success' | 'error'>('success');
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const first = this.venues()[0];
    if (first) this.select(first);
  }

  select(v: Venue): void {
    this.selected.set(v);
    this.venuesApi.getEventsForVenue(v.id).subscribe((list) => this.bookings.set(list));
  }

  eventCount(venueId: string): number {
    return this.venuesApi.countEventsForVenue(venueId);
  }

  openCreate(): void {
    this.editingVenue.set(null);
    this.formOpen.set(true);
  }

  openEdit(venue: Venue): void {
    this.editingVenue.set(venue);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingVenue.set(null);
  }

  onSaved(venue: Venue): void {
    const wasEdit = !!this.editingVenue();
    this.closeForm();
    this.select(venue);
    this.showFeedback(wasEdit ? 'تم تحديث بيانات القاعة بنجاح' : 'تم إنشاء القاعة بنجاح');
  }

  openDelete(venue: Venue): void {
    this.deleteError.set('');
    this.venueInUse.set(this.venuesApi.isVenueInUse(venue.id));
    this.deleteTarget.set(venue);
  }

  closeDelete(): void {
    if (this.busy()) return;
    this.deleteTarget.set(null);
    this.deleteError.set('');
    this.venueInUse.set(false);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.busy.set(true);
    this.deleteError.set('');
    this.venuesApi.deleteVenue(target.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.deleteTarget.set(null);
        if (this.selected()?.id === target.id) {
          const next = this.venues()[0] ?? null;
          if (next) this.select(next);
          else {
            this.selected.set(null);
            this.bookings.set([]);
          }
        }
        this.showFeedback('تم حذف القاعة بنجاح');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const message = err instanceof Error ? err.message : '';
        if (message === 'VENUE_IN_USE') {
          this.venueInUse.set(true);
          return;
        }
        this.deleteError.set('تعذر حذف القاعة. حاول مرة أخرى.');
      },
    });
  }

  deactivateInstead(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.busy.set(true);
    this.venuesApi.deactivateVenue(target.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.deleteTarget.set(null);
        this.select(updated);
        this.showFeedback('تم تعطيل القاعة بنجاح');
      },
      error: () => {
        this.busy.set(false);
        this.deleteError.set('تعذر تعطيل القاعة. حاول مرة أخرى.');
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
