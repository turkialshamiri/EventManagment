import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EventType, EventTypeWritePayload } from '../models/event.models';
import { EventDataService } from './event-data.service';

/**
 * Dedicated Event Type CRUD facade.
 * Backed by EventDataService so classifications stay shared with event flows.
 */
@Injectable({ providedIn: 'root' })
export class EventTypeService {
  private readonly data = inject(EventDataService);

  readonly types = computed(() =>
    [...this.data.types()].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'ar'))
  );

  getEventTypes(): Observable<EventType[]> {
    return this.data.getEventTypes();
  }

  getEventType(id: string): Observable<EventType> {
    return this.data.getEventTypeById(id);
  }

  createEventType(payload: EventTypeWritePayload): Observable<EventType> {
    return this.data.createEventType(payload);
  }

  updateEventType(id: string, payload: EventTypeWritePayload): Observable<EventType> {
    return this.data.updateEventType(id, payload);
  }

  deleteEventType(id: string): Observable<void> {
    return this.data.deleteEventType(id);
  }

  deactivateEventType(id: string): Observable<EventType> {
    return this.data.deactivateEventType(id);
  }

  isEventTypeInUse(typeId: string): boolean {
    return this.data.isEventTypeInUse(typeId);
  }

  countEventsForType(typeId: string): number {
    return this.data.countEventsForType(typeId);
  }
}
