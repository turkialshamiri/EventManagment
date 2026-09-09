import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EventPackage, PackageWritePayload } from '../models/event.models';
import { EventDataService } from './event-data.service';

/**
 * Dedicated package CRUD facade.
 * Backed by EventDataService today so package state stays shared with event flows;
 * swap the implementation to HTTP later without changing page components.
 */
@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly data = inject(EventDataService);

  readonly packages = this.data.packages;

  getPackages(): Observable<EventPackage[]> {
    return this.data.getPackages();
  }

  getPackage(id: string): Observable<EventPackage> {
    return this.data.getPackageById(id);
  }

  createPackage(payload: PackageWritePayload): Observable<EventPackage> {
    return this.data.createPackage(payload);
  }

  updatePackage(id: string, payload: PackageWritePayload): Observable<EventPackage> {
    return this.data.updatePackage(id, payload);
  }

  deletePackage(id: string): Observable<void> {
    return this.data.deletePackage(id);
  }

  deactivatePackage(id: string): Observable<EventPackage> {
    return this.data.deactivatePackage(id);
  }

  isPackageInUse(packageId: string): boolean {
    return this.data.isPackageInUse(packageId);
  }
}
