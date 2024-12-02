import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../services/resource.service';
import {
  Resource,
  StaffResource,
  VehicleResource,
} from '../interfaces/resource';

@Component({
  selector: 'app-resources',
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss',
})
export class ResourcesComponent implements OnInit {
  resources: Resource[] = [];

  constructor(private resourceService: ResourceService) {}

  ngOnInit() {
    this.resources = this.resourceService.getResources(); // Ressourcen laden
  }
}
