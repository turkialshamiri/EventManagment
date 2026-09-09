import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Venue, VenueWritePayload } from '../models/event.models';
import { EventDataService } from './event-data.service';

/**
 * Dedicated Venue CRUD facade.
 * Backed by EventDataService so venue state stays shared with event flows.
 */
@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly data = inject(EventDataService);

  readonly venues = this.data.venues;

  getVenues(): Observable<Venue[]> {
    return this.data.getVenues();
  }

  getVenue(id: string): Observable<Venue> {
    return this.data.getVenueById(id);
  }

  createVenue(payload: VenueWritePayload): Observable<Venue> {
    return this.data.createVenue(payload);
  }

  updateVenue(id: string, payload: VenueWritePayload): Observable<Venue> {
    return this.data.updateVenue(id, payload);
  }

  deleteVenue(id: string): Observable<void> {
    return this.data.deleteVenue(id);
  }

  deactivateVenue(id: string): Observable<Venue> {
    return this.data.deactivateVenue(id);
  }

  isVenueInUse(venueId: string): boolean {
    return this.data.isVenueInUse(venueId);
  }

  countEventsForVenue(venueId: string): number {
    return this.data.countEventsForVenue(venueId);
  }

  getEventsForVenue(venueId: string) {
    return this.data.getEventsForVenue(venueId);
  }
}
