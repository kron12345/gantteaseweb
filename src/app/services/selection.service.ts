import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  private selectedResources = new BehaviorSubject<Set<number>>(new Set<number>());
  selectedResources$ = this.selectedResources.asObservable();

  toggleSelection(resourceId: number): void {
    const currentSelection = this.selectedResources.getValue();
    if (currentSelection.has(resourceId)) {
      currentSelection.delete(resourceId);
    } else {
      currentSelection.add(resourceId);
    }
    this.selectedResources.next(new Set(currentSelection)); // Emit new selection
  }

  isSelected(resourceId: number): boolean {
    return this.selectedResources.getValue().has(resourceId);
  }
}