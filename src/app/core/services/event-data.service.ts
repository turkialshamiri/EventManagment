import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  CreateEventFormValue,
  Customer,
  DashboardKpis,
  EventFilters,
  EventGroup,
  EventPackage,
  EventStatus,
  EventType,
  EventTypeWritePayload,
  HotelEvent,
  ListKpis,
  OperationalAlert,
  PackageWritePayload,
  StaffOnDuty,
  Venue,
  VenueOccupancySlot,
  VenueWritePayload,
  calcFinancials,
  calcPackageTotal,
} from '../models/event.models';
import {
  MOCK_ALERTS,
  MOCK_CUSTOMERS,
  MOCK_DASHBOARD_KPIS,
  MOCK_EVENTS,
  MOCK_EVENT_TYPES,
  MOCK_GROUPS,
  MOCK_LIST_KPIS,
  MOCK_PACKAGES,
  MOCK_STAFF,
  MOCK_VENUES,
  MOCK_VENUE_OCCUPANCY,
} from '../data/mock-data';

@Injectable({ providedIn: 'root' })
export class EventDataService {
  private readonly eventsSignal = signal<HotelEvent[]>([...MOCK_EVENTS]);
  private readonly groupsSignal = signal<EventGroup[]>([...MOCK_GROUPS]);
  private readonly venuesSignal = signal<Venue[]>([...MOCK_VENUES]);
  private readonly packagesSignal = signal<EventPackage[]>([...MOCK_PACKAGES]);
  private readonly typesSignal = signal<EventType[]>([...MOCK_EVENT_TYPES]);

  readonly events = this.eventsSignal.asReadonly();
  readonly groups = this.groupsSignal.asReadonly();
  readonly venues = this.venuesSignal.asReadonly();
  readonly packages = this.packagesSignal.asReadonly();
  readonly types = this.typesSignal.asReadonly();

  getDashboardKpis(): Observable<DashboardKpis> {
    return of(MOCK_DASHBOARD_KPIS).pipe(delay(280));
  }

  getListKpis(): Observable<ListKpis> {
    return of(MOCK_LIST_KPIS).pipe(delay(220));
  }

  getAlerts(): Observable<OperationalAlert[]> {
    return of(MOCK_ALERTS).pipe(delay(200));
  }

  getVenueOccupancy(): Observable<VenueOccupancySlot[]> {
    return of(MOCK_VENUE_OCCUPANCY).pipe(delay(200));
  }

  getStaffOnDuty(): Observable<StaffOnDuty[]> {
    return of(MOCK_STAFF).pipe(delay(180));
  }

  getCustomers(): Observable<Customer[]> {
    return of(MOCK_CUSTOMERS).pipe(delay(100));
  }

  getEvents(filters?: Partial<EventFilters>): Observable<HotelEvent[]> {
    let result = [...this.eventsSignal()];
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        result = result.filter((e) => e.status === filters.status);
      }
      if (filters.venueId && filters.venueId !== 'all') {
        result = result.filter((e) => e.venueId === filters.venueId);
      }
      if (filters.eventTypeId && filters.eventTypeId !== 'all') {
        result = result.filter((e) => e.eventTypeId === filters.eventTypeId);
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim().toLowerCase();
        result = result.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.code.toLowerCase().includes(q) ||
            e.customer.name.toLowerCase().includes(q) ||
            e.customer.phone.includes(q) ||
            (e.customer.company?.toLowerCase().includes(q) ?? false)
        );
      }
    }
    return of(result).pipe(delay(320));
  }

  getEventById(id: string): Observable<HotelEvent> {
    const found = this.eventsSignal().find((e) => e.id === id || e.code === id);
    if (!found) {
      return throwError(() => new Error('المناسبة غير موجودة')).pipe(delay(200));
    }
    return of(structuredClone(found)).pipe(delay(250));
  }

  getTodayEvents(): Observable<HotelEvent[]> {
    const today = this.eventsSignal().filter((e) => e.startDate === '2024-10-24');
    return of(today).pipe(delay(250));
  }

  getEventsForVenue(venueId: string): Observable<HotelEvent[]> {
    return of(this.eventsSignal().filter((e) => e.venueId === venueId)).pipe(delay(200));
  }

  getCalendarEvents(): Observable<HotelEvent[]> {
    return of(this.eventsSignal().filter((e) => e.status !== 'cancelled')).pipe(delay(200));
  }

  createEvent(form: CreateEventFormValue): Observable<HotelEvent> {
    const venue = this.venuesSignal().find((v) => v.id === form.venueId);
    const type = this.typesSignal().find((t) => t.id === form.eventTypeId);
    const pkg = this.packagesSignal().find((p) => p.id === form.packageId);
    const customer = MOCK_CUSTOMERS.find((c) => c.id === form.customerId) ?? MOCK_CUSTOMERS[0];
    const group = this.groupsSignal().find((g) => g.id === form.groupId);
    const setup = venue?.setups.find((s) => s.id === form.setupId);

    const items =
      pkg?.items.map((pi, idx) => ({
        id: `new-li-${idx}`,
        name: pi.name,
        quantity: typeof pi.quantity === 'number' ? pi.quantity : form.guaranteedGuests || 1,
        unitPrice: pi.unitPrice,
        discountPercent: 0,
        taxPercent: 15,
        included: pi.included,
        gift: pi.gift,
      })) ?? [];

    const capacity = setup?.capacity ?? venue?.capacity ?? 0;
    const hasCapacityWarning = form.expectedGuests > capacity && capacity > 0;
    const hasConflict = this.hasVenueConflict(form.venueId, form.startDate, form.startTime, form.endTime);

    const nextNum = 910 + this.eventsSignal().length;
    const created: HotelEvent = {
      id: `evt-${nextNum}`,
      code: `EVT-2024-0${nextNum}`,
      name: form.name,
      status: form.status,
      eventTypeId: form.eventTypeId,
      eventTypeName: type?.name ?? '',
      eventTypeIcon: type?.icon ?? 'celebration',
      customer,
      groupId: group?.id,
      groupName: group?.name,
      venueId: form.venueId,
      venueName: venue?.name ?? '',
      setupName: setup?.name,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      setupTime: form.setupTime,
      startTime: form.startTime,
      endTime: form.endTime,
      teardownTime: form.teardownTime,
      expectedGuests: form.expectedGuests,
      guaranteedGuests: form.guaranteedGuests,
      packageId: pkg?.id,
      packageName: pkg?.name,
      items,
      notesCustomer: form.notesCustomer,
      notesInternal: form.notesInternal,
      finance: calcFinancials(items, 10, 15, 0),
      hasCapacityWarning,
      hasConflict,
      readinessPercent: 0,
      checklist: [
        { id: 'nc1', label: 'توقيع العقد', done: false },
        { id: 'nc2', label: 'استلام العربون', done: false },
        { id: 'nc3', label: 'تصاريح البلدية', done: false },
        { id: 'nc4', label: 'بطاقات VIP', done: false },
      ],
    };

    this.eventsSignal.update((list) => [created, ...list]);
    return of(created).pipe(delay(400));
  }

  updateEventStatus(id: string, status: EventStatus): Observable<HotelEvent> {
    let updated: HotelEvent | undefined;
    this.eventsSignal.update((list) =>
      list.map((e) => {
        if (e.id === id) {
          updated = { ...e, status };
          return updated;
        }
        return e;
      })
    );
    if (!updated) {
      return throwError(() => new Error('المناسبة غير موجودة'));
    }
    return of(updated).pipe(delay(250));
  }

  hasVenueConflict(
    venueId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ): boolean {
    return this.eventsSignal().some((e) => {
      if (excludeEventId && e.id === excludeEventId) return false;
      if (e.venueId !== venueId || e.startDate !== date) return false;
      if (e.status === 'cancelled') return false;
      return this.timesOverlap(e.startTime, e.endTime, startTime, endTime);
    });
  }

  private timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const as = toMin(aStart);
    let ae = toMin(aEnd);
    const bs = toMin(bStart);
    let be = toMin(bEnd);
    if (ae < as) ae += 24 * 60;
    if (be < bs) be += 24 * 60;
    return as < be && bs < ae;
  }

  statusCounts(): Record<EventStatus | 'all', number> {
    const list = this.eventsSignal();
    const counts: Record<EventStatus | 'all', number> = {
      all: list.length,
      draft: 0,
      tentative: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const e of list) {
      counts[e.status] += 1;
    }
    return counts;
  }

  getPackages(): Observable<EventPackage[]> {
    return of(structuredClone(this.packagesSignal())).pipe(delay(220));
  }

  getPackageById(id: string): Observable<EventPackage> {
    const found = this.packagesSignal().find((p) => p.id === id);
    if (!found) {
      return throwError(() => new Error('الباقة غير موجودة'));
    }
    return of(structuredClone(found)).pipe(delay(180));
  }

  isPackageInUse(packageId: string): boolean {
    return this.eventsSignal().some((e) => e.packageId === packageId && e.status !== 'cancelled');
  }

  createPackage(payload: PackageWritePayload): Observable<EventPackage> {
    const items = payload.items.map((item, idx) => ({
      id: `pi-new-${Date.now()}-${idx}`,
      name: item.name.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      included: true,
    }));
    const created: EventPackage = {
      id: `pkg-${Date.now()}`,
      code: payload.code.trim() || `PKG-${String(this.packagesSignal().length + 1).padStart(3, '0')}`,
      name: payload.name.trim(),
      description: payload.description.trim(),
      durationHours: payload.durationHours,
      basePrice: calcPackageTotal(items),
      active: payload.active,
      items,
    };
    this.packagesSignal.update((list) => [created, ...list]);
    return of(structuredClone(created)).pipe(delay(350));
  }

  updatePackage(id: string, payload: PackageWritePayload): Observable<EventPackage> {
    let updated: EventPackage | undefined;
    this.packagesSignal.update((list) =>
      list.map((pkg) => {
        if (pkg.id !== id) return pkg;
        const items = payload.items.map((item, idx) => ({
          id: pkg.items[idx]?.id ?? `pi-upd-${Date.now()}-${idx}`,
          name: item.name.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          included: pkg.items[idx]?.included ?? true,
          gift: pkg.items[idx]?.gift,
        }));
        updated = {
          ...pkg,
          code: payload.code.trim() || pkg.code,
          name: payload.name.trim(),
          description: payload.description.trim(),
          durationHours: payload.durationHours,
          active: payload.active,
          items,
          basePrice: calcPackageTotal(items),
        };
        return updated;
      })
    );
    if (!updated) {
      return throwError(() => new Error('الباقة غير موجودة'));
    }
    return of(structuredClone(updated)).pipe(delay(350));
  }

  deletePackage(id: string): Observable<void> {
    if (this.isPackageInUse(id)) {
      return throwError(() => new Error('PACKAGE_IN_USE')).pipe(delay(200));
    }
    const exists = this.packagesSignal().some((p) => p.id === id);
    if (!exists) {
      return throwError(() => new Error('الباقة غير موجودة'));
    }
    this.packagesSignal.update((list) => list.filter((p) => p.id !== id));
    return of(void 0).pipe(delay(300));
  }

  deactivatePackage(id: string): Observable<EventPackage> {
    let updated: EventPackage | undefined;
    this.packagesSignal.update((list) =>
      list.map((pkg) => {
        if (pkg.id !== id) return pkg;
        updated = { ...pkg, active: false };
        return updated;
      })
    );
    if (!updated) {
      return throwError(() => new Error('الباقة غير موجودة'));
    }
    return of(structuredClone(updated)).pipe(delay(250));
  }

  private sortedTypes(list: EventType[]): EventType[] {
    return [...list].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'ar'));
  }

  getEventTypes(): Observable<EventType[]> {
    return of(structuredClone(this.sortedTypes(this.typesSignal()))).pipe(delay(220));
  }

  getEventTypeById(id: string): Observable<EventType> {
    const found = this.typesSignal().find((t) => t.id === id);
    if (!found) {
      return throwError(() => new Error('نوع الفعالية غير موجود'));
    }
    return of(structuredClone(found)).pipe(delay(180));
  }

  countEventsForType(typeId: string): number {
    return this.eventsSignal().filter((e) => e.eventTypeId === typeId).length;
  }

  isEventTypeInUse(typeId: string): boolean {
    return this.eventsSignal().some((e) => e.eventTypeId === typeId && e.status !== 'cancelled');
  }

  private isTypeCodeTaken(code: string, excludeId?: string): boolean {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;
    return this.typesSignal().some(
      (t) => t.code.toUpperCase() === normalized && t.id !== excludeId
    );
  }

  createEventType(payload: EventTypeWritePayload): Observable<EventType> {
    if (this.isTypeCodeTaken(payload.code)) {
      return throwError(() => new Error('CODE_TAKEN'));
    }
    const created: EventType = {
      id: `type-${Date.now()}`,
      code: payload.code.trim().toUpperCase() || `TYPE-${this.typesSignal().length + 1}`,
      name: payload.name.trim(),
      description: payload.description.trim(),
      active: payload.active,
      displayOrder: Number.isFinite(payload.displayOrder) ? payload.displayOrder : this.typesSignal().length + 1,
      icon: payload.icon.trim() || 'category',
    };
    this.typesSignal.update((list) => this.sortedTypes([created, ...list]));
    return of(structuredClone(created)).pipe(delay(350));
  }

  updateEventType(id: string, payload: EventTypeWritePayload): Observable<EventType> {
    if (this.isTypeCodeTaken(payload.code, id)) {
      return throwError(() => new Error('CODE_TAKEN'));
    }
    let updated: EventType | undefined;
    this.typesSignal.update((list) =>
      this.sortedTypes(
        list.map((type) => {
          if (type.id !== id) return type;
          updated = {
            ...type,
            code: payload.code.trim().toUpperCase() || type.code,
            name: payload.name.trim(),
            description: payload.description.trim(),
            active: payload.active,
            displayOrder: Number.isFinite(payload.displayOrder) ? payload.displayOrder : type.displayOrder,
            icon: payload.icon.trim() || type.icon,
          };
          return updated;
        })
      )
    );
    if (!updated) {
      return throwError(() => new Error('نوع الفعالية غير موجود'));
    }
    return of(structuredClone(updated)).pipe(delay(350));
  }

  deleteEventType(id: string): Observable<void> {
    if (this.isEventTypeInUse(id)) {
      return throwError(() => new Error('EVENT_TYPE_IN_USE')).pipe(delay(200));
    }
    const exists = this.typesSignal().some((t) => t.id === id);
    if (!exists) {
      return throwError(() => new Error('نوع الفعالية غير موجود'));
    }
    this.typesSignal.update((list) => list.filter((t) => t.id !== id));
    return of(void 0).pipe(delay(300));
  }

  deactivateEventType(id: string): Observable<EventType> {
    let updated: EventType | undefined;
    this.typesSignal.update((list) =>
      this.sortedTypes(
        list.map((type) => {
          if (type.id !== id) return type;
          updated = { ...type, active: false };
          return updated;
        })
      )
    );
    if (!updated) {
      return throwError(() => new Error('نوع الفعالية غير موجود'));
    }
    return of(structuredClone(updated)).pipe(delay(250));
  }

  getVenues(): Observable<Venue[]> {
    return of(structuredClone(this.venuesSignal())).pipe(delay(220));
  }

  getVenueById(id: string): Observable<Venue> {
    const found = this.venuesSignal().find((v) => v.id === id);
    if (!found) {
      return throwError(() => new Error('القاعة غير موجودة'));
    }
    return of(structuredClone(found)).pipe(delay(180));
  }

  isVenueInUse(venueId: string): boolean {
    return this.eventsSignal().some((e) => e.venueId === venueId && e.status !== 'cancelled');
  }

  countEventsForVenue(venueId: string): number {
    return this.eventsSignal().filter((e) => e.venueId === venueId && e.status !== 'cancelled').length;
  }

  private isVenueCodeTaken(code: string, excludeId?: string): boolean {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;
    return this.venuesSignal().some(
      (v) => v.code.toUpperCase() === normalized && v.id !== excludeId
    );
  }

  createVenue(payload: VenueWritePayload): Observable<Venue> {
    if (this.isVenueCodeTaken(payload.code)) {
      return throwError(() => new Error('CODE_TAKEN'));
    }
    const setups = payload.setups.map((s, idx) => ({
      id: `setup-${Date.now()}-${idx}`,
      name: s.name.trim(),
      capacity: s.capacity,
    }));
    const maxSetupCap = setups.reduce((max, s) => Math.max(max, s.capacity), 0);
    const created: Venue = {
      id: `venue-${Date.now()}`,
      code: payload.code.trim().toUpperCase() || `VEN-${this.venuesSignal().length + 1}`,
      name: payload.name.trim(),
      description: payload.description.trim(),
      floor: payload.floor.trim(),
      capacity: Math.max(payload.capacity, maxSetupCap),
      active: payload.active,
      imageUrl: payload.imageUrl.trim() || undefined,
      setups,
    };
    this.venuesSignal.update((list) => [created, ...list]);
    return of(structuredClone(created)).pipe(delay(350));
  }

  updateVenue(id: string, payload: VenueWritePayload): Observable<Venue> {
    if (this.isVenueCodeTaken(payload.code, id)) {
      return throwError(() => new Error('CODE_TAKEN'));
    }
    let updated: Venue | undefined;
    this.venuesSignal.update((list) =>
      list.map((venue) => {
        if (venue.id !== id) return venue;
        const setups = payload.setups.map((s, idx) => ({
          id: venue.setups[idx]?.id ?? `setup-upd-${Date.now()}-${idx}`,
          name: s.name.trim(),
          capacity: s.capacity,
        }));
        const maxSetupCap = setups.reduce((max, s) => Math.max(max, s.capacity), 0);
        updated = {
          ...venue,
          code: payload.code.trim().toUpperCase() || venue.code,
          name: payload.name.trim(),
          description: payload.description.trim(),
          floor: payload.floor.trim(),
          capacity: Math.max(payload.capacity, maxSetupCap),
          active: payload.active,
          imageUrl: payload.imageUrl.trim() || venue.imageUrl,
          setups,
        };
        return updated;
      })
    );
    if (!updated) {
      return throwError(() => new Error('القاعة غير موجودة'));
    }
    return of(structuredClone(updated)).pipe(delay(350));
  }

  deleteVenue(id: string): Observable<void> {
    if (this.isVenueInUse(id)) {
      return throwError(() => new Error('VENUE_IN_USE')).pipe(delay(200));
    }
    const exists = this.venuesSignal().some((v) => v.id === id);
    if (!exists) {
      return throwError(() => new Error('القاعة غير موجودة'));
    }
    this.venuesSignal.update((list) => list.filter((v) => v.id !== id));
    return of(void 0).pipe(delay(300));
  }

  deactivateVenue(id: string): Observable<Venue> {
    let updated: Venue | undefined;
    this.venuesSignal.update((list) =>
      list.map((venue) => {
        if (venue.id !== id) return venue;
        updated = { ...venue, active: false };
        return updated;
      })
    );
    if (!updated) {
      return throwError(() => new Error('القاعة غير موجودة'));
    }
    return of(structuredClone(updated)).pipe(delay(250));
  }
}
