import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface SelectedResourceInfo {
  id: number;
  backgroundColor: string;
  rowHeight: number;
  selected: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  private selectedResources = new BehaviorSubject<Map<number, SelectedResourceInfo>>(new Map());
  selectedResources$ = this.selectedResources.asObservable();

  private addSelectedResource(resourceId: number): void {
    const currentSelection = this.selectedResources.getValue();
    if (!currentSelection.has(resourceId)) {
      currentSelection.set(resourceId, {
        id: resourceId,
        backgroundColor: 'lightblue',
        rowHeight: 50,
        selected: false,
      });
      this.emitSelection(currentSelection);
    }
  }

  private emitSelection(currentSelection: Map<number, SelectedResourceInfo>): void {
    this.selectedResources.next(new Map(currentSelection));
  }

  toggleSelection(resourceId: number): void {
    this.addSelectedResource(resourceId);
    const currentSelection = this.selectedResources.getValue();
    const resource = currentSelection.get(resourceId);

    if (resource) {
      resource.selected = !resource.selected; // Umschalten des ausgewählten Zustands
      currentSelection.set(resourceId, resource); // Aktualisierung der Map
    }

    this.emitSelection(currentSelection);
  }

  isSelected(resourceId: number): boolean {
    return this.selectedResources.getValue().get(resourceId)?.selected ?? false;
  }

  clearSelection(): void {
    this.selectedResources.next(new Map()); // Emit a new empty selection
  }

  selectOnly(resourceId: number): void {
    const currentSelection = this.selectedResources.getValue();

    currentSelection.forEach((resource) => (resource.selected = false));

    const resource = currentSelection.get(resourceId);
    if (resource) {
      resource.selected = true;
    }

    this.emitSelection(currentSelection);
  }

  updateRowHeight(resourceId: number, height: number): void {
    this.addSelectedResource(resourceId);
    const currentSelection = this.selectedResources.getValue();
    const resource = currentSelection.get(resourceId);
    if (resource) {
      resource.rowHeight = height;
      currentSelection.set(resourceId, resource); // Aktualisiere die Map
      this.emitSelection(currentSelection); // Benachrichtige Abonnenten
    }
  }

  getRowHeight(resourceId: number): number {
    const height = this.selectedResources.getValue().get(resourceId)?.rowHeight ?? 30;
    console.log(`RowHeight for resourceId ${resourceId}: ${height}`);
    return height;
  }
  
}