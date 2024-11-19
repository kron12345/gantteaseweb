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
  maxVisiblePoints = 50; // Maximal 50 Spalten in der Ansicht
  zoomLevel: number = 1;
  currentZoomLevel = 1; // Start-Zoom-Level
  resourceIds: number[] = [];
  zoomLevels = [
    { level: 1, unit: 'year', step: 43200, label: '1 Jahr (1 Monat-Schritte)' },
    { level: 2, unit: 'half-year', step: 14400, label: '1 Halbjahr (10 Tage-Schritte)' },
    { level: 3, unit: 'quarter', step: 7200, label: '1 Quartal (5 Tage-Schritte)' },
    { level: 4, unit: 'month', step: 1440, label: '1 Monat (1 Tag-Schritte)' },
    { level: 5, unit: 'week', step: 720, label: '1 Woche (12 Stunden-Schritte)' },
    { level: 6, unit: '3-days', step: 360, label: '3 Tage (6 Stunden-Schritte)' },
    { level: 7, unit: 'day', step: 60, label: '1 Tag (1 Stunde-Schritte)' },
    { level: 8, unit: '12-hours', step: 30, label: '12 Stunden (30 Minuten-Schritte)' },
    { level: 9, unit: '6-hours', step: 15, label: '6 Stunden (15 Minuten-Schritte)' },
    { level: 10, unit: '3-hours', step: 10, label: '3 Stunden (10 Minuten-Schritte)' },
    { level: 11, unit: '1-hour', step: 5, label: '1 Stunde (5 Minuten-Schritte)' },
    { level: 12, unit: '30-minutes', step: 2, label: '30 Minuten (2 Minuten-Schritte)' },
    { level: 13, unit: '15-minutes', step: 1, label: '15 Minuten (1 Minute-Schritte)' }
  ];

  constructor(private resourceService: ResourceService) {}

  ngOnInit() {
    const resources = this.resourceService.getResources(); // Ressourcen laden
    this.resourceIds = resources.map(resource => resource.id); // Nur die IDs extrahieren
    // Initialisiere das Zeitraster
    this.initializeTimes();
    this.setVisibleTimes();  
  }
  
  // Initialisiert die Zeitangaben von 1 Jahr bis zu einer Minute
  initializeTimes() {
    const start = new Date(2024, 0, 1); // Startdatum: 1. Januar 2024
    const end = new Date(2025, 0, 3); // Enddatum: 1. Januar 2025

    const times: string[] = [];
    let current = start;

    // Schritte in Minuten (kleinste Einheit)
    while (current < end) {
      times.push(current.toISOString()); // ISO-Format für Klarheit
      current = new Date(current.getTime() + 60 * 1000); // +1 Minute
    }

    this.times = times;
  }

  // Berechnet die sichtbaren Zeitpunkte basierend auf dem Zoom-Level
  setVisibleTimes() {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);

    if (!zoom) {
      console.error('Ungültige Zoomstufe:', this.currentZoomLevel);
      return;
    }
  
    const step = zoom.step;
    const middleTime = this.getMiddleTime();
  
    const middleIndex = this.times.findIndex(time => time === middleTime);
    const startIndex = Math.max(middleIndex - Math.floor(this.maxVisiblePoints / 2), 0);
  
    // Sichtbare Daten basierend auf Step und Maximalgröße
    this.visibleTimes = this.times
      .filter((_, index) => index % step === 0)
      .slice(startIndex, startIndex + this.maxVisiblePoints);
  }

  getMiddleTime(): string {
    if (this.visibleTimes.length === 0) {
      console.error('Keine sichtbaren Zeiten verfügbar!');
      return '';
    }

    const middleIndex = Math.floor(this.visibleTimes.length / 2);
    return this.visibleTimes[middleIndex];
  }

  // Gibt die Schrittweite basierend auf dem Zoom-Level zurück
  getStepForZoomLevel(): number {
    // Einfaches Beispiel: Schrittweite basierend auf Zoom-Level
    if (this.zoomLevel >= 365) return this.zoomLevel * 24 * 60; // Jahr
    if (this.zoomLevel >= 30) return this.zoomLevel * 24; // Monat
    if (this.zoomLevel >= 1) return this.zoomLevel; // Tag bis Stunde
    return 1; // Minuten
  }

  formatTime(time: string): string {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);
    if (!zoom) return time;
  
    const date = new Date(time);
  
    switch (zoom.unit) {
      case 'year':
        return `${date.getFullYear()}`; // 2024
      case 'half-year':
        return `H${date.getMonth() < 6 ? 1 : 2} ${date.getFullYear()}`; // H1 2024 oder H2 2024
      case 'quarter':
        return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`; // Q1 2024
      case 'month':
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`; // Jan 2024
      case 'week':
        return `KW ${this.getWeekNumber(date)}`; // KW 2
      case '3-days':
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 2); // +2 Tage
        return `${this.formatDate(date)} - ${this.formatDate(endDate)}`; // 03.01 - 05.01
      case 'day':
        return this.formatDate(date); // 03.01.2024
      case 'hour':
        return `${this.formatDate(date)} ${date.getHours()}:00`; // 03.01 12:00
      case 'minute':
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`; // 12:30
      default:
        return time;
    }
  }


// Hilfsfunktion zur Formatierung eines Datums
private formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${date.getFullYear()}`;
}

  // Hilfsfunktion, um die Wochennummer zu berechnen
getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

  // Zoom in
  zoomIn() {
    if (this.currentZoomLevel > 1) {
      const middleTime = this.getMiddleTime(); // Aktuelle Mitte merken
      this.currentZoomLevel--;
  
      this.setVisibleTimes(); // Sichtbare Zeiten basierend auf neuem Zoom-Level
      this.scrollToTime(middleTime); // Behalte die Mitte bei
    }
  }
  
  // Zoom out
  zoomOut() {
    if (this.currentZoomLevel < 13) {
      const middleTime = this.getMiddleTime(); // Aktuelle Mitte merken
      this.currentZoomLevel++;
  
      this.setVisibleTimes(); // Sichtbare Zeiten basierend auf neuem Zoom-Level
      this.scrollToTime(middleTime); // Behalte die Mitte bei
    }
  }

    scrollToTime(targetTime: string) {
      console.log('Aktuelle Zoomstufe:', this.currentZoomLevel);
      console.log('Sichtbare Zeiten:', this.visibleTimes);
      const targetIndex = this.times.findIndex(time => time === targetTime);

      if (targetIndex === -1) {
        console.error('Zeit nicht gefunden:', targetTime);
        return;
      }
    
      // Setze die neue Mitte basierend auf der Zielzeit
      const middleIndex = targetIndex;
      const startIndex = Math.max(middleIndex - Math.floor(this.maxVisiblePoints / 2), 0);
    
      const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);
      if (!zoom) return;
    
      const step = zoom.step;
    
      this.visibleTimes = this.times
        .filter((_, index) => index % step === 0)
        .slice(startIndex, startIndex + this.maxVisiblePoints);
    }
}