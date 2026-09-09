import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventDataService } from '../../../core/services/event-data.service';
import { HotelEvent, EventStatus } from '../../../core/models/event.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { PageStateComponent } from '../../../shared/components/page-state/page-state';

type CalView = 'day' | 'week' | 'month';

@Component({
  selector: 'app-event-calendar',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, PageStateComponent],
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.scss',
})
export class EventCalendarComponent implements OnInit {
  private readonly data = inject(EventDataService);

  readonly loading = signal(true);
  readonly events = signal<HotelEvent[]>([]);
  readonly view = signal<CalView>('week');
  readonly venueFilter = signal('all');

  readonly venues = this.data.venues;

  readonly weekDays = [
    { key: '2024-10-20', label: 'الأحد 20' },
    { key: '2024-10-21', label: 'الإثنين 21' },
    { key: '2024-10-22', label: 'الثلاثاء 22' },
    { key: '2024-10-23', label: 'الأربعاء 23' },
    { key: '2024-10-24', label: 'الخميس 24', today: true },
    { key: '2024-10-25', label: 'الجمعة 25' },
    { key: '2024-10-26', label: 'السبت 26' },
  ];

  readonly hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08-22

  readonly filtered = computed(() => {
    const venue = this.venueFilter();
    return this.events().filter((e) => venue === 'all' || e.venueId === venue);
  });

  ngOnInit(): void {
    this.data.getCalendarEvents().subscribe({
      next: (list) => {
        this.events.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  eventsOn(date: string): HotelEvent[] {
    return this.filtered().filter((e) => e.startDate === date);
  }

  dayEvents(): HotelEvent[] {
    return this.eventsOn('2024-10-24');
  }

  monthCells(): { date: string; label: number; inMonth: boolean }[] {
    const cells: { date: string; label: number; inMonth: boolean }[] = [];
    for (let d = 1; d <= 31; d++) {
      const date = `2024-10-${String(d).padStart(2, '0')}`;
      cells.push({ date, label: d, inMonth: true });
    }
    return cells;
  }

  hasConflict(ev: HotelEvent): boolean {
    return (
      ev.hasConflict ||
      this.filtered().some(
        (other) =>
          other.id !== ev.id &&
          other.venueId === ev.venueId &&
          other.startDate === ev.startDate &&
          other.status !== 'cancelled'
      )
    );
  }

  statusColor(status: EventStatus): string {
    switch (status) {
      case 'in_progress':
        return 'var(--status-active)';
      case 'confirmed':
        return 'var(--status-confirmed)';
      case 'tentative':
        return 'var(--status-tentative)';
      default:
        return 'var(--secondary)';
    }
  }
}
