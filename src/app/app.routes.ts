import { Routes } from '@angular/router';
import { EventShellComponent } from './layout/event-shell/event-shell';

export const routes: Routes = [
  {
    path: '',
    component: EventShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'events/dashboard' },
      {
        path: 'events/dashboard',
        loadComponent: () =>
          import('./features/dashboard/event-dashboard').then((m) => m.EventDashboardComponent),
        title: 'لوحة التحكم • إدارة المناسبات',
      },
      {
        path: 'events',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/events/event-list/event-list').then((m) => m.EventListComponent),
        title: 'كافة المناسبات',
      },
      {
        path: 'events/new',
        loadComponent: () =>
          import('./features/events/event-create/event-create').then((m) => m.EventCreateComponent),
        title: 'إنشاء مناسبة جديدة',
      },
      {
        path: 'events/calendar',
        loadComponent: () =>
          import('./features/events/event-calendar/event-calendar').then(
            (m) => m.EventCalendarComponent
          ),
        title: 'تقويم الفعاليات',
      },
      {
        path: 'events/groups',
        loadComponent: () =>
          import('./features/event-groups/event-groups').then((m) => m.EventGroupsComponent),
        title: 'مجموعات المناسبات',
      },
      {
        path: 'events/venues',
        loadComponent: () =>
          import('./features/venues/venues-page').then((m) => m.VenuesPageComponent),
        title: 'إدارة القاعات',
      },
      {
        path: 'events/packages',
        loadComponent: () =>
          import('./features/packages/packages-page').then((m) => m.PackagesPageComponent),
        title: 'حزم المناسبات',
      },
      {
        path: 'events/types',
        loadComponent: () =>
          import('./features/event-types/event-types-page').then((m) => m.EventTypesPageComponent),
        title: 'أنواع الفعاليات',
      },
      {
        path: 'events/reports',
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPageComponent),
        data: { title: 'التقارير التشغيلية', icon: 'analytics' },
        title: 'التقارير التشغيلية',
      },
      {
        path: 'events/rooms',
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPageComponent),
        data: { title: 'الغرف والحجوزات', icon: 'bed' },
        title: 'الغرف والحجوزات',
      },
      {
        path: 'events/billing',
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPageComponent),
        data: { title: 'الفواتير والمالية', icon: 'account_balance_wallet' },
        title: 'الفواتير والمالية',
      },
      {
        path: 'events/settings',
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPageComponent),
        data: { title: 'إعدادات الفندق', icon: 'settings' },
        title: 'إعدادات الفندق',
      },
      {
        path: 'events/:id/edit',
        loadComponent: () =>
          import('./features/events/event-create/event-create').then((m) => m.EventCreateComponent),
        title: 'تعديل المناسبة',
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./features/events/event-details/event-details').then(
            (m) => m.EventDetailsComponent
          ),
        title: 'تفاصيل المناسبة',
      },
    ],
  },
  { path: '**', redirectTo: 'events/dashboard' },
];
