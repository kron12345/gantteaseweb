import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../services/resource.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrl: './gantt.component.scss'
})

export class GanttComponent implements OnInit{

  //time data
  times: string[] = [];
  visibleTimes: string[] = [];
  zoomLevel: number = 1;
  resourceIds: number[] = []; 

  constructor(private resourceService: ResourceService) {
    // Initialisiere die Zeitangaben (z. B. Stunden eines Tages)
    this.times = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    this.setVisibleTimes();
  }

  ngOnInit() {
    const resources = this.resourceService.getResources(); // Ressourcen laden
    this.resourceIds = resources.map(resource => resource.id); // Nur die IDs extrahieren
  }
  // Sichtbare Zeiten basierend auf dem Zoom-Level berechnen
  setVisibleTimes() {
    const step = Math.max(1, Math.floor(this.zoomLevel)); // Schrittweite
    this.visibleTimes = this.times.filter((_, index) => index % step === 0);
  }

  // Zoom in
  zoomIn() {
    this.zoomLevel = Math.max(1, this.zoomLevel - 1);
    this.setVisibleTimes();
  }

  // Zoom out
  zoomOut() {
    this.zoomLevel = Math.min(this.times.length, this.zoomLevel + 1);
    this.setVisibleTimes();
  }
}