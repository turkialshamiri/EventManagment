import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EventDataService } from '../../../core/services/event-data.service';
import {
  CUSTOMER_CATEGORY_LABELS,
  EventStatus,
  HotelEvent,
  ListKpis,
} from '../../../core/models/event.models';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { PageStateComponent } from '../../../shared/components/page-state/page-state';
import { ArNumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';

type StatusFilter = EventStatus | 'all';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    KpiCardComponent,
    StatusBadgeComponent,
    PageStateComponent,
    ArNumberPipe,
    SarPipe,
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventListComponent implements OnInit {
  private readonly data = inject(EventDataService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly kpis = signal<ListKpis | null>(null);
  readonly events = signal<HotelEvent[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());

  search = '';
  status: StatusFilter = 'all';
  venueId = 'all';
  eventTypeId = 'all';
  dateRange = 'week';
  capacityBand = 'all';
  readonly pageSize = signal(10);
  readonly page = signal(1);

  readonly categoryLabels = CUSTOMER_CATEGORY_LABELS;
  readonly venues = this.data.venues;
  readonly types = this.data.types;

  readonly filtered = computed(() => this.events());

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );

  readonly statusCounts = computed(() => this.data.statusCounts());

  ngOnInit(): void {
    this.data.getListKpis().subscribe((k) => this.kpis.set(k));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(false);
    this.page.set(1);
    this.data
      .getEvents({
        search: this.search,
        status: this.status,
        venueId: this.venueId,
        eventTypeId: this.eventTypeId,
        dateRange: this.dateRange,
        capacityBand: this.capacityBand,
      })
      .subscribe({
        next: (list) => {
          this.events.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  setStatus(status: StatusFilter): void {
    this.status = status;
    this.reload();
  }

  resetFilters(): void {
    this.search = '';
    this.status = 'all';
    this.venueId = 'all';
    this.eventTypeId = 'all';
    this.dateRange = 'week';
    this.capacityBand = 'all';
    this.reload();
  }

  toggleAll(checked: boolean): void {
    if (!checked) {
      this.selectedIds.set(new Set());
      return;
    }
    this.selectedIds.set(new Set(this.paged().map((e) => e.id)));
  }

  toggleOne(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.selectedIds.set(next);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  statusBarColor(status: EventStatus): string {
    switch (status) {
      case 'in_progress':
        return 'var(--secondary)';
      case 'confirmed':
        return 'var(--status-confirmed)';
      case 'tentative':
        return 'var(--status-tentative)';
      case 'cancelled':
        return 'var(--status-cancelled)';
      case 'completed':
        return 'var(--status-active)';
      default:
        return 'var(--outline)';
    }
  }

  goPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
  }

  rangeLabel(): string {
    const total = this.filtered().length;
    if (total === 0) return 'لا نتائج';
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), total);
    return `عرض ${start} إلى ${end} من ${total} مناسبة`;
  }

  hasCapacityWarnings(): boolean {
    return this.events().some((e) => e.hasCapacityWarning);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
}
