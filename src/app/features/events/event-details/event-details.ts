import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventDataService } from '../../../core/services/event-data.service';
import { HotelEvent, EventStatus } from '../../../core/models/event.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { PageStateComponent } from '../../../shared/components/page-state/page-state';
import { ArNumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';

type DetailTab =
  | 'overview'
  | 'timeline'
  | 'venue'
  | 'items'
  | 'package'
  | 'rooms'
  | 'billing'
  | 'notes'
  | 'history';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, PageStateComponent, ArNumberPipe, SarPipe],
  templateUrl: './event-details.html',
  styleUrl: './event-details.scss',
})
export class EventDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(EventDataService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly event = signal<HotelEvent | null>(null);
  readonly tab = signal<DetailTab>('overview');
  readonly cancelOpen = signal(false);
  readonly actionMsg = signal('');

  readonly tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'timeline', label: 'الجدول التشغيلي' },
    { id: 'venue', label: 'القاعة والمخطط' },
    { id: 'items', label: 'الخدمات والبنود' },
    { id: 'package', label: 'باقة الضيافة' },
    { id: 'rooms', label: 'حجوزات الغرف' },
    { id: 'billing', label: 'الفوترة' },
    { id: 'notes', label: 'الملاحظات' },
    { id: 'history', label: 'السجل' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      this.load(id);
    });
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(false);
    this.data.getEventById(id).subscribe({
      next: (ev) => {
        this.event.set(ev);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  setTab(id: DetailTab): void {
    this.tab.set(id);
  }

  confirmCancel(): void {
    const ev = this.event();
    if (!ev) return;
    this.data.updateEventStatus(ev.id, 'cancelled').subscribe({
      next: (updated) => {
        this.event.set(updated);
        this.cancelOpen.set(false);
        this.actionMsg.set('تم إلغاء المناسبة بنجاح.');
      },
    });
  }

  timelineClass(status: string): string {
    return status;
  }

  statusLabel(status: EventStatus): string {
    if (status === 'in_progress') return 'مؤكدة وقيد التنفيذ اليوم';
    return status;
  }
}
