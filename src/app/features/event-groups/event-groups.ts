import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventDataService } from '../../core/services/event-data.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { SarPipe, ArNumberPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-event-groups',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, SarPipe, ArNumberPipe],
  template: `
    <div class="em-page">
      <div class="head">
        <div>
          <h1 class="t-display-lg">مجموعات المناسبات</h1>
          <p class="t-body-sm muted">تجميع المناسبات المرتبطة بعميل أو برنامج واحد مع ملخص مالي</p>
        </div>
      </div>
      <div class="grid">
        @for (g of groups(); track g.id) {
          <article class="em-card card">
            <div class="card__top">
              <h2 class="t-headline-md">{{ g.name }}</h2>
              <app-status-badge [status]="g.status" />
            </div>
            <dl class="meta">
              <div><dt>العميل</dt><dd>{{ g.customerName }}</dd></div>
              <div><dt>الفترة</dt><dd>{{ g.startDate }} → {{ g.endDate }}</dd></div>
              <div><dt>المناسبات</dt><dd>{{ g.eventCount }}</dd></div>
              <div><dt>الحضور المتوقع</dt><dd>{{ g.expectedGuests | arNumber }}</dd></div>
              <div><dt>الإجمالي</dt><dd>{{ g.totalAmount | sar }}</dd></div>
              <div><dt>المدفوع</dt><dd>{{ g.paidAmount | sar }}</dd></div>
            </dl>
            <a class="em-btn em-btn--ghost em-btn--sm" [routerLink]="['/events']" [queryParams]="{ group: g.id }"
              >عرض المناسبات</a
            >
          </article>
        } @empty {
          <p class="muted">لا توجد مجموعات.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .muted {
      color: var(--on-surface-variant);
    }
    .head {
      margin-bottom: var(--gutter-md);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--gutter-md);
    }
    .card {
      padding: var(--gutter-lg);
      display: flex;
      flex-direction: column;
      gap: var(--gutter-md);
    }
    .card__top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: flex-start;
    }
    .meta {
      margin: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .meta div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    dt {
      font-size: 11px;
      color: var(--on-surface-variant);
    }
    dd {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
    }
  `,
})
export class EventGroupsComponent {
  private readonly data = inject(EventDataService);
  readonly groups = this.data.groups;
}
