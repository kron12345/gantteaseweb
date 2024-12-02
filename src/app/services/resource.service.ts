import { Injectable } from '@angular/core';
import { Resource, StaffResource } from '../interfaces/resource';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  constructor() {}

  private resources: Resource[] = [
    { id: 1, name: 'Rockefeller', firstName: 'Alice' } as StaffResource,
    { id: 2, name: 'Merkel', firstName: 'Angela' } as StaffResource,
  ];

  // Gibt die Ressourcen zurück
  getResources(): Resource[] {
    return this.resources;
  }
}
