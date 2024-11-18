import { Component } from '@angular/core';
import { Resource, StaffResource, VehicleResource } from '../interfaces/resource';

@Component({
  selector: 'app-resources',
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss'
})

export class ResourcesComponent {
  resources: Resource[] = [
    {id: 1, name: 'Rockefeller', firstName: 'Alice'} as StaffResource,
    {id: 2, name: 'Merkel', firstName: 'Angela'} as StaffResource
  ]
}
