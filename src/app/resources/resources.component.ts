import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../services/resource.service';
import { SelectionService } from '../services/selection.service';
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

  constructor(
    private resourceService: ResourceService, 
    private selectionService: SelectionService) {}

  ngOnInit() {
    this.resources = this.resourceService.getResources(); // Ressourcen laden
  }

  toggleSelection(resourceId: number, event?: MouseEvent): void {
    if (event) event.stopPropagation(); // Verhindert das doppelte Triggern
    this.selectionService.toggleSelection(resourceId);
  }

  isSelected(resourceId: number): boolean {
    return this.selectionService.isSelected(resourceId);
  }

  trackByResourceId(index: number, resource: any): number {
    return resource.id;
  }
  getRowHeight(resourceId: number): number {
    return this.selectionService.getRowHeight(resourceId);
  }

}
