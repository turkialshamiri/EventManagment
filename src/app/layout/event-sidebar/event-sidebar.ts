import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-event-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './event-sidebar.html',
  styleUrl: './event-sidebar.scss',
})
export class EventSidebarComponent {
  @Input() open = false;
  @Output() closeNav = new EventEmitter<void>();

  readonly sections: NavSection[] = [
    {
      title: 'الرئيسية',
      items: [{ path: '/events/dashboard', label: 'لوحة التحكم العامة', icon: 'dashboard' }],
    },
    {
      title: 'إدارة الفعاليات والمناسبات',
      items: [
        { path: '/events', label: 'كافة المناسبات', icon: 'celebration' },
        { path: '/events/calendar', label: 'تقويم الفعاليات', icon: 'calendar_month' },
        { path: '/events/groups', label: 'مجموعات المناسبات', icon: 'folder_shared' },
        { path: '/events/venues', label: 'إدارة القاعات', icon: 'meeting_room' },
        { path: '/events/packages', label: 'حزم المناسبات', icon: 'inventory_2' },
        { path: '/events/types', label: 'أنواع الفعاليات', icon: 'category' },
        { path: '/events/reports', label: 'التقارير التشغيلية', icon: 'analytics' },
      ],
    },
    {
      title: 'الخدمات المشتركة للفندق',
      items: [
        { path: '/events/rooms', label: 'الغرف والحجوزات', icon: 'bed' },
        { path: '/events/billing', label: 'الفواتير والمالية', icon: 'account_balance_wallet' },
        { path: '/events/settings', label: 'إعدادات الفندق', icon: 'settings' },
      ],
    },
  ];
}
