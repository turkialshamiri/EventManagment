import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventDataService } from '../../core/services/event-data.service';
import {
  DashboardKpis,
  HotelEvent,
  OperationalAlert,
  StaffOnDuty,
  VenueOccupancySlot,
} from '../../core/models/event.models';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { CapacityBarComponent } from '../../shared/components/capacity-bar/capacity-bar';
import { PageStateComponent } from '../../shared/components/page-state/page-state';
import { ArNumberPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-event-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    KpiCardComponent,
    StatusBadgeComponent,
    CapacityBarComponent,
    PageStateComponent,
    ArNumberPipe,
  ],
  templateUrl: './event-dashboard.html',
  styleUrl: './event-dashboard.scss',
})
export class EventDashboardComponent implements OnInit {
  private readonly data = inject(EventDataService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly alerts = signal<OperationalAlert[]>([]);
  readonly todayEvents = signal<HotelEvent[]>([]);
  readonly occupancy = signal<VenueOccupancySlot[]>([]);
  readonly staff = signal<StaffOnDuty[]>([]);
  readonly dayFilter = signal<'all' | 'active' | 'remaining'>('all');
  readonly calendarLabel = 'الخميس، 24 أكتوبر 2024';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    let pending = 5;
    const done = () => {
      pending -= 1;
      if (pending <= 0) this.loading.set(false);
    };

    this.data.getDashboardKpis().subscribe({
      next: (k) => {
        this.kpis.set(k);
        done();
      },
      error: () => {
        this.error.set(true);
        done();
      },
    });
    this.data.getAlerts().subscribe({
      next: (a) => {
        this.alerts.set(a);
        done();
      },
      error: () => done(),
    });
    this.data.getTodayEvents().subscribe({
      next: (e) => {
        this.todayEvents.set(e);
        done();
      },
      error: () => done(),
    });
    this.data.getVenueOccupancy().subscribe({
      next: (o) => {
        this.occupancy.set(o);
        done();
      },
      error: () => done(),
    });
    this.data.getStaffOnDuty().subscribe({
      next: (s) => {
        this.staff.set(s);
        done();
      },
      error: () => done(),
    });
  }

  filteredToday(): HotelEvent[] {
    const all = this.todayEvents();
    switch (this.dayFilter()) {
      case 'active':
        return all.filter((e) => e.status === 'in_progress');
      case 'remaining':
        return all.filter((e) => e.status !== 'in_progress');
      default:
        return all;
    }
  }

  activeTodayCount(): number {
    return this.todayEvents().filter((e) => e.status === 'in_progress').length;
  }

  alertIcon(severity: OperationalAlert['severity']): string {
    if (severity === 'critical') return 'groups';
    if (severity === 'warning') return 'payments';
    return 'auto_awesome';
  }

  slotLeft(slot: VenueOccupancySlot): number {
    return (slot.startHour / 24) * 100;
  }

  slotWidth(slot: VenueOccupancySlot): number {
    if (slot.status === 'free') return 0;
    const end = slot.endHour <= slot.startHour ? slot.endHour + 24 : slot.endHour;
    return ((end - slot.startHour) / 24) * 100;
  }
}
