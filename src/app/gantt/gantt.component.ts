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
  startDate = new Date(2024, 0, 1); // Startdatum: 1. Januar 2024
  endDate = new Date(2025, 0, 3); // Enddatum: 1. Januar 2025
  times: string[] = [];
  visibleTimes: Date[] = [];
  maxVisiblePoints = 10; // Maximal 50 Spalten in der Ansicht
  zoomLevel: number = 1;
  currentZoomLevel = 1; // Start-Zoom-Level
  resourceIds: number[] = [];

  firstVisibleTime: string = ''; // Erster sichtbarer Zeitpunkt
  lastVisibleTime: string = '';  // Letzter sichtbarer Zeitpunkt
  mouseTime: string = '';        // Zeitpunkt unter der Maus

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
    this.setVisibleTimes();  
  }
  
  // Berechnet die sichtbaren Zeitpunkte basierend auf dem Zoom-Level
  setVisibleTimes(startIndex: number = 0) {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);

    if (!zoom) {
      console.error('Ungültige Zoomstufe:', this.currentZoomLevel);
      return;
    }
  
    const step = zoom.step;
    const firstTime = this.startDate.getTime();
    const lastTime = this.endDate.getTime();
    const maxStartTime = lastTime - step * this.maxVisiblePoints * 60000;
    let startTime =  firstTime + startIndex * 60000;

    if (startTime > maxStartTime){
      startTime = maxStartTime;
    }

    let dates: Date[] = [];

    for (let i = 0; i < this.maxVisiblePoints; i++) {
      let visibleTime = firstTime + (startIndex * 60000) + (i * 60000);
      dates.push(new Date(visibleTime));
    }

    this.visibleTimes = dates;

    this.updateVisibleRange(); // Aktualisiere sichtbaren Bereich
  }

  // Berechnet den sichtbaren Bereich basierend auf Scroll-Position
  updateVisibleRange(event?: Event) {
    const wrapper = event 
      ? (event.target as HTMLElement) // Scroll-Event-Target
      : document.querySelector('.planning-table-wrapper'); // Initial
  
    if (!wrapper) return;
  
    const scrollLeft = wrapper.scrollLeft; // Aktuelle horizontale Scroll-Position
    const wrapperWidth = wrapper.clientWidth; // Breite des sichtbaren Bereichs
    const totalWidth = wrapper.scrollWidth; // Gesamte Breite der Tabelle
    const totalMinutes = this.times.length; // Gesamtanzahl der Minuten im Zeitraster
  
    // Minutengenauer Startzeitpunkt im sichtbaren Bereich
    const startMinute = Math.floor((scrollLeft / totalWidth) * totalMinutes);
  
    // Sichtbare Minuten basierend auf der Wrapperbreite
    const visibleMinutes = Math.floor((wrapperWidth / totalWidth) * totalMinutes);
  
    // Berechne Start- und Endzeit
    const firstVisibleIndex = startMinute;
    const lastVisibleIndex = Math.min(firstVisibleIndex + visibleMinutes, this.times.length - 1);
  
    this.firstVisibleTime = this.times[firstVisibleIndex];
    this.lastVisibleTime = this.times[lastVisibleIndex];
  }

    // Aktualisiere die Zeit unter der Maus basierend auf ihrer Position
    updateMouseTime(event: MouseEvent) {
      const wrapper = event.currentTarget as HTMLElement;
    
      const wrapperRect = wrapper.getBoundingClientRect(); // Position des Wrappers im Viewport
      const wrapperWidth = wrapperRect.width; // Breite des Wrappers
      const mouseX = event.clientX - wrapperRect.left;     // Maus-X-Position relativ zum Wrapper
      const mousePercentage = (mouseX / wrapperWidth);

      const firstTime = new Date(this.firstVisibleTime).getTime();
      const lastTime = new Date(this.lastVisibleTime).getTime();
      const totalTime = lastTime - firstTime
      // Berechnung der absoluten Zeitposition basierend auf der Maus
      const timeIndex = firstTime + totalTime * mousePercentage;
      this.mouseTime = new Date(timeIndex).toISOString();
    }

  formatTime(date: Date): string {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);
    if (!zoom) return date.toISOString();
  
    //const date = new Date(time);
  
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
        return date.toISOString();
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

handleMouseZoom(event: WheelEvent) {
  event.preventDefault(); // Verhindert das Standard-Scroll-Verhalten

  const zoomIn = event.deltaY < 0; // Negativer Wert: Zoom-In, Positiver Wert: Zoom-Out
  const wrapper = event.currentTarget as HTMLElement;

  // Mausposition relativ zum Wrapper
  const wrapperRect = wrapper.getBoundingClientRect();
  const mouseX = event.clientX - wrapperRect.left;

  // Gesamte Breite der Tabelle und Zeitspanne
  const totalWidth = wrapper.scrollWidth;
  const totalMinutes = this.times.length;

  // Zeitpunkt unter der Maus berechnen
  const scrollLeft = wrapper.scrollLeft;
  const absoluteX = scrollLeft + mouseX;
  const mouseTimeIndex = Math.floor((absoluteX / totalWidth) * totalMinutes);
  const mouseTime = this.times[mouseTimeIndex];

  if (!mouseTime) return;

  // Zoom-Level ändern
  if (zoomIn && this.currentZoomLevel > 1) {
    this.currentZoomLevel--;
  } else if (!zoomIn && this.currentZoomLevel < 13) {
    this.currentZoomLevel++;
  }

  // Sichtbare Zeiten aktualisieren
  this.setVisibleTimes();

  // Nach dem Zoom zur gespeicherten Zeit scrollen
  this.scrollToTime(mouseTime, wrapper);
}

  // Zoom in
  zoomIn() {
    if (this.currentZoomLevel > 1) {
      this.currentZoomLevel--;
  
      // Berechne den neuen Startindex
      const startIndex = 0;

      this.setVisibleTimes(startIndex); // Setze neue sichtbare Zeiten
    }
  }
  
  // Zoom out
  zoomOut() {
    if (this.currentZoomLevel < 13) {
      this.currentZoomLevel++;
  
      // Berechne den neuen Startindex
      const startIndex = 0;

      this.setVisibleTimes(startIndex); // Setze neue sichtbare Zeiten
    }
  }
  scrollToTime(time: string, wrapper: HTMLElement) {
    const totalWidth = wrapper.scrollWidth;
    const totalMinutes = this.times.length;
  
    // Index der gespeicherten Zeit
    const timeIndex = this.times.findIndex(t => t === time);
    if (timeIndex === -1) return;
  
    // Pixelposition der gespeicherten Zeit berechnen
    const targetX = (timeIndex / totalMinutes) * totalWidth;
  
    // Neue Scrollposition setzen
    wrapper.scrollLeft = targetX - wrapper.clientWidth / 2; // Zentriert die Zeit im Sichtbereich
  }

  getZoomLabel(): string {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);
    return zoom ? zoom.label : 'Unbekannter Zoom-Level';
  }
}