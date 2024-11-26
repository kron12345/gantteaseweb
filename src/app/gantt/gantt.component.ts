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
  visibleTimes: {start: Date; colspan: number; subtimes: string[];}[] = [];
  maxVisiblePoints = 40; // Maximal 50 Spalten in der Ansicht
  zoomLevel: number = 1;
  currentZoomLevel = 1; // Start-Zoom-Level
  resourceIds: number[] = [];
  totalTime: number = 0;

  groupedTimes: { start: Date; end: Date }[] = [];
  subTimes: { label: string; colspan?: number }[] = [];

  firstVisibleTime: Date = new Date(); // Erster sichtbarer Zeitpunkt
  lastVisibleTime: Date = new Date();  // Letzter sichtbarer Zeitpunkt
  mouseTime: Date = new Date();         // Zeitpunkt unter der Maus

  zoomLevels = [
    { level: 1, unit: 'week', step: 604800000, label: '1 Woche 1', columnWidth: 12 },
    { level: 2, unit: 'week', step: 604800000, label: '1 Woche 2', columnWidth: 24 },
    { level: 3, unit: 'week', step: 604800000, label: '1 Woche 3', columnWidth: 48 },
    { level: 4, unit: 'day', step: 86400000, label: '1 Tag 1', columnWidth: 12 },
    { level: 5, unit: 'day', step: 86400000, label: '1 Tag 2', columnWidth: 24 },
    { level: 6, unit: 'day', step: 86400000, label: '1 Tag 3', columnWidth: 48 },
    { level: 7, unit: '12-hours', step: 43200000, label: '12 Stunden 1', columnWidth: 12 },
    { level: 8, unit: '12-hours', step: 43200000, label: '12 Stunden 2', columnWidth: 24 },
    { level: 9, unit: '12-hours', step: 43200000, label: '12 Stunden 3', columnWidth: 48 },
    { level: 10, unit: '1-hour', step: 3600000, label: '1 Stunde 1', columnWidth: 12 },
    { level: 11, unit: '1-hour', step: 3600000, label: '1 Stunde 2', columnWidth: 24 },
    { level: 12, unit: '1-hour', step: 3600000, label: '1 Stunde 3', columnWidth: 48 },
    { level: 13, unit: '30-minutes', step: 1800000, label: '30 Minuten 1', columnWidth: 12 },
    { level: 14, unit: '30-minutes', step: 1800000, label: '30 Minuten 2', columnWidth: 24 },
    { level: 15, unit: '30-minutes', step: 1800000, label: '30 Minuten 3', columnWidth: 48 }
  ];

  constructor(private resourceService: ResourceService) {}

  ngOnInit() {
    const resources = this.resourceService.getResources(); // Ressourcen laden
    this.resourceIds = resources.map(resource => resource.id); // Nur die IDs extrahieren
    // Initialisiere das Zeitraster
    this.setVisibleTimes();  
  }
  
  private roundToMidnight(date: Date): Date {
    const roundedDate = new Date(date); // Kopiere das Datum
    roundedDate.setHours(0, 0, 0, 0); // Setze Stunden, Minuten, Sekunden und Millisekunden auf 0
    return roundedDate;
  }

  // Berechnet die sichtbaren Zeitpunkte basierend auf dem Zoom-Level
  setVisibleTimes(timeIndex: Date = new Date()) {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);

    if (!zoom) {
      console.error('Ungültige Zoomstufe:', this.currentZoomLevel);
      return;
    }
  
    const step = zoom.step;
    const firstTime = this.startDate.getTime();
    const lastTime = this.endDate.getTime();
    const width = zoom.columnWidth;
    const columns = Math.floor(12 / width * this.maxVisiblePoints);
    const index = timeIndex.getTime() < firstTime ? firstTime : timeIndex.getTime();
    this.totalTime = step * columns;
    let startTime =  index - this.totalTime / 2;

    if (startTime > lastTime - this.totalTime){
      startTime = lastTime - this.totalTime;
    }
    if (startTime < firstTime){
      startTime = firstTime;
    }

    if (zoom.unit === 'day' || zoom.unit.includes('hour') === false) {
      startTime = this.roundToMidnight(new Date(startTime)).getTime();
    }

    this.visibleTimes = [];

    for(let i=0; i < columns; i++){
      const startTimeForGroup = new Date(startTime + i * step);
      const group = {
        start: startTimeForGroup, // Startzeit der Gruppe
        colspan: 1, // Default: 1 Spalte pro Eintrag (anpassen je nach Gruppierung)
        subtimes: [] as string []
      };

      // Subtimes basierend auf Zoom-Level füllen
      if (zoom.unit === 'week') {
        // Wochentage hinzufügen (z. B. Mo, Di, Mi ...)
        for (let j = 0; j < 7; j++) {
          const subTime = new Date((startTime + i * step) + (j * (step / 7)));
          group.subtimes.push(this.getWeekDay(subTime));
        }
        group.colspan = 7; // Jede Woche deckt 7 Spalten ab
        i += 6; // Überspringe die nächsten 6 Spalten, da sie zur Gruppe gehören
      } else if (zoom.unit === 'day') {
      // Stunden eines Tages hinzufügen (z. B. 00:00, 01:00 ...)
        for (let j = 0; j < 24; j++) {
          const subTime = new Date(startTime + (i * step) + j * (step / 24));
          group.subtimes.push(`${subTime.getHours()}:00`);
        }
        group.colspan = 24; // Ein Tag deckt 24 Stunden ab
      } else if (zoom.unit === '12-hours' || zoom.unit === '1-hour') {
      // Minuten oder Stunden hinzufügen
      for (let j = 0; j < (step / 3600000); j++) {
        const subTime = new Date(startTime + i * step + j * (step / 2));
        group.subtimes.push(`${subTime.getHours()}:${subTime.getMinutes().toString().padStart(2, '0')}`);
      }
      group.colspan = Math.floor(step / 3600000); // Je nach Step
      } else {
      // Standard: Keine Unterzeiten, colspan = 1
        group.subtimes = [this.formatTime(startTimeForGroup)];
      }

      // Gruppe zur Liste hinzufügen
      this.visibleTimes.push(group);
    }

    this.updateVisibleRange(); // Aktualisiere sichtbaren Bereich
  }

  getWeekDay(date: Date): string {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()];
  }

  // Berechnet den sichtbaren Bereich basierend auf Scroll-Position
  updateVisibleRange(event?: Event) {
    const wrapper = event 
      ? (event.target as HTMLElement) // Scroll-Event-Target
      : document.querySelector('.planning-table-wrapper'); // Initial
  
    if (!wrapper) {
      console.error('Wrapper nicht gefunden!');
      return;
    }

    const firstTime = this.visibleTimes[0].start.getTime();
    const scrollLeft = wrapper.scrollLeft; // Aktuelle horizontale Scroll-Position
    const wrapperWidth = wrapper.clientWidth; // Breite des sichtbaren Bereichs
    const totalWidth = wrapper.scrollWidth; // Gesamte Breite der Tabelle
    const totalTime = this.totalTime; // Gesamtanzahl der Minuten im Zeitraster
  
    // Minutengenauer Startzeitpunkt im sichtbaren Bereich
    const startTime = Math.floor((scrollLeft / totalWidth) * totalTime);
  
    // Sichtbare Minuten basierend auf der Wrapperbreite
    const visibleTime = Math.floor((wrapperWidth / totalWidth) * totalTime);
  
    this.firstVisibleTime = new Date(firstTime + startTime);
    //this.firstVisibleTime = new Date()
    this.lastVisibleTime = new Date(firstTime + startTime + visibleTime);
  }

  // Aktualisiere die Zeit unter der Maus basierend auf ihrer Position
  updateMouseTime(event: MouseEvent) {
    const wrapper = event.currentTarget as HTMLElement;
    
    const wrapperRect = wrapper.getBoundingClientRect(); // Position des Wrappers im Viewport
    const wrapperWidth = wrapperRect.width; // Breite des Wrappers
    const mouseX = event.clientX - wrapperRect.left;     // Maus-X-Position relativ zum Wrapper
    const mousePercentage = Math.max(0, Math.min(1, mouseX / wrapperWidth));

    const firstTime = this.firstVisibleTime.getTime();
    const lastTime = this.lastVisibleTime.getTime();
    const totalTime = lastTime - firstTime;
      // Berechnung der absoluten Zeitposition basierend auf der Maus
    const timeIndex = firstTime + totalTime * mousePercentage;
    this.mouseTime = new Date(timeIndex);
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

  const wrapper = event.currentTarget as HTMLElement;

  if (!this.mouseTime) return;

  // Mausposition relativ zur Wrapper-Breite
  const wrapperRect = wrapper.getBoundingClientRect();
  const mouseX = event.clientX - wrapperRect.left; // Mausposition relativ zum Wrapper
  const mouseRatio = mouseX / wrapperRect.width; // Verhältnis der Mausposition im Wrapper (0 bis 1)

  // Zoom-Level ändern
  const zoomDelta = Math.sign(event.deltaY); // -1 für rein, 1 für raus
  const newZoomLevel = this.currentZoomLevel - zoomDelta; // Berechne neues Zoom-Level

  if (newZoomLevel >= 1 && newZoomLevel <= this.zoomLevels.length) {
    // Zeit unter der Maus vor dem Zoom
    const mouseTimeBeforeZoom = this.mouseTime.getTime();

    this.currentZoomLevel = newZoomLevel;
    // Sichtbare Zeiten aktualisieren
    this.setVisibleTimes(this.mouseTime);

    // Zeit unter der Maus nach dem Zoom berechnen
    const firstVisibleTime = this.visibleTimes[0].start.getTime();
    const totalVisibleTime = this.totalTime;

    // Neue Scrollposition berechnen, sodass die Zeit unter der Maus gleich bleibt
    const targetScrollLeft = ((mouseTimeBeforeZoom - firstVisibleTime) / totalVisibleTime) * wrapper.scrollWidth;

    // Scrollen, um die Zeit unter der Maus zu erhalten
    wrapper.scrollTo({
      left: targetScrollLeft - mouseRatio * wrapper.clientWidth,
      behavior: 'smooth'
    });
  }
}

private smoothTransition(callback: () => void, duration: number = 300) {
  document.body.style.transition = `all ${duration}ms ease-in-out`; // Optional: Transition für globale Effekte
  callback();
  setTimeout(() => {
    document.body.style.transition = ''; // Transition zurücksetzen
  }, duration);
}

  // Zoom in
  zoomIn() {
    if (this.currentZoomLevel > 1) {
      this.currentZoomLevel--;

      const index = this.firstVisibleTime.getTime() + this.totalTime / 2

      this.smoothTransition(() => this.setVisibleTimes(new Date(index))); // Setze neue sichtbare Zeiten
      this.updateVisibleRange();
    }
  }
  
  // Zoom out
  zoomOut() {
    if (this.currentZoomLevel < 13) {
      this.currentZoomLevel++;

      const index = this.firstVisibleTime.getTime() + this.totalTime / 2

      this.smoothTransition(() => this.setVisibleTimes(new Date(index))); // Setze neue sichtbare Zeiten
      this.updateVisibleRange();
    }
  }

  getColumnWidth(): number {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);
    return zoom ? zoom.columnWidth : 3; // Standardwert: 3rem
  }

  scrollToTime(time: Date, wrapper: HTMLElement) {
    const totalWidth = wrapper.scrollWidth;
  
    // Pixelposition der gespeicherten Zeit berechnen
    const targetX = (time.getTime() / this.totalTime) * totalWidth;
  
    // Neue Scrollposition setzen
    wrapper.scrollTo({
      left: targetX - wrapper.clientWidth / 2,
      behavior: 'smooth'
    });
  }

  getZoomLabel(): string {
    const zoom = this.zoomLevels.find(z => z.level === this.currentZoomLevel);
    return zoom ? zoom.label : 'Unbekannter Zoom-Level';
  }
}