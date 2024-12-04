import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../services/resource.service';
import { SelectionService } from '../services/selection.service';
import { CommonModule } from '@angular/common';
import { getDynamicColumnWidth, remToPx, pxToRem } from '../shared/utils';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrl: './gantt.component.scss',
})
export class GanttComponent implements OnInit {
  rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );

  //time data
  startDate = new Date(2024, 0, 1); // Startdatum: 1. Januar 2024
  endDate = new Date(2025, 0, 3); // Enddatum: 1. Januar 2025
  times: string[] = [];
  visibleTimes: {
    start: Date;
    colspan: number;
    subtimes: Subtime[];
    columnWidth: number;
  }[] = [];
  maxVisiblePoints = 40; // Maximal 50 Spalten in der Ansicht
  zoomLevel: number = 1;
  currentZoomLevel = 1; // Start-Zoom-Level
  resourceIds: number[] = [];
  totalTime: number = 0;

  groupedTimes: { start: Date; end: Date }[] = [];
  subTimes: { label: string; colspan?: number }[] = [];

  firstVisibleTime: Date = new Date(); // Erster sichtbarer Zeitpunkt
  lastVisibleTime: Date = new Date(); // Letzter sichtbarer Zeitpunkt
  mouseTime: Date = new Date(); // Zeitpunkt unter der Maus

  private resizingResourceId: number | null = null;
  private initialMouseY: number = 0;
  private initialHeight: number = 0; 

  zoomLevels = [
    {
      level: 1,
      unit: 'week',
      step: 604800000,
      label: '1 Woche 1',
      columnWidth: 9,
    },
    {
      level: 2,
      unit: 'week',
      step: 604800000,
      label: '1 Woche 2',
      columnWidth: 18,
    },
    {
      level: 3,
      unit: 'week',
      step: 604800000,
      label: '1 Woche 3',
      columnWidth: 35,
    },
    {
      level: 4,
      unit: 'week',
      step: 604800000,
      label: '1 Woche 4',
      columnWidth: 70,
    },
    {
      level: 5,
      unit: 'week',
      step: 604800000,
      label: '1 Woche 5',
      columnWidth: 140,
    },
    {
      level: 6,
      unit: 'day',
      step: 86400000,
      label: '1 Tag 2',
      columnWidth: 40,
    },
    {
      level: 7,
      unit: 'day',
      step: 86400000,
      label: '1 Tag 2',
      columnWidth: 80,
    },
    {
      level: 8,
      unit: 'day',
      step: 86400000,
      label: '1 Tag 3',
      columnWidth: 120,
    },
    {
      level: 9,
      unit: '12-hours',
      step: 43200000,
      label: '12 Stunden 1',
      columnWidth: 120,
    },
    {
      level: 10,
      unit: '6-hours',
      step: 21600000,
      label: '6 Stunden 1',
      columnWidth: 120,
    },
    {
      level: 11,
      unit: '1-hour',
      step: 3600000,
      label: '1 Stunde 1',
      columnWidth: 20,
    },
    {
      level: 12,
      unit: '1-hour',
      step: 3600000,
      label: '1 Stunde 2',
      columnWidth: 40,
    },
    {
      level: 13,
      unit: '1-hour',
      step: 3600000,
      label: '1 Stunde 3',
      columnWidth: 80,
    },
    {
      level: 14,
      unit: '30-minutes',
      step: 1800000,
      label: '30 Minuten 1',
      columnWidth: 40,
    },
    {
      level: 15,
      unit: '30-minutes',
      step: 1800000,
      label: '30 Minuten 2',
      columnWidth: 80,
    },
    {
      level: 16,
      unit: '30-minutes',
      step: 1800000,
      label: '30 Minuten 3',
      columnWidth: 160,
    },
  ];

  constructor(
    private resourceService: ResourceService,
    private selectionService: SelectionService,
    ) {
      this.onResizing = this.onResizing.bind(this);
      this.onResizeEnd = this.onResizeEnd.bind(this);
    }

  ngOnInit() {
    const resources = this.resourceService.getResources(); // Ressourcen laden
    this.resourceIds = resources.map((resource) => resource.id); // Nur die IDs extrahieren
    // Initialisiere das Zeitraster
    this.setVisibleTimes();
  }

  private roundToMidnight(date: Date): Date {
    const roundedDate = new Date(date); // Kopiere das Datum
    roundedDate.setHours(0, 0, 0, 0); // Setze Stunden, Minuten, Sekunden und Millisekunden auf 0
    return roundedDate;
  }

  private get currentZoom() {
    return this.zoomLevels.find((z) => z.level === this.currentZoomLevel);
  }

  private roundToMonday(date: Date): Date {
    const result = new Date(date); // Kopiere das Datum, um das Original nicht zu verändern
    const day = result.getDay(); // Wochentag (0 = Sonntag, 1 = Montag, ..., 6 = Samstag)

    // Wenn der Tag nicht Montag ist, zurück zum letzten Montag
    const difference = day === 0 ? 6 : day - 1; // Sonntag ist der letzte Tag der Vorwoche
    result.setDate(result.getDate() - difference);

    // Stunden, Minuten, Sekunden und Millisekunden auf 0 setzen
    result.setHours(0, 0, 0, 0);

    return result;
  }

  private getIntervalsForUnit(unit: string): number {
    const intervalMap: { [key: string]: number } = {
      week: 7,
      day: 24,
      '12-hours': 12,
      '6-hours': 6,
      '1-hour': 6,
      minute: 60,
    };
    return intervalMap[unit] || 1;
  }

  private generateSubtimes(
    unit: string,
    startTime: number,
    step: number,
  ): Subtime[] {
    const subtimes: Subtime[] = [];
    const intervals = this.getIntervalsForUnit(unit);

    let label: string;

    for (let j = 0; j < intervals; j++) {
      const subTime = new Date(startTime + j * (step / intervals));
      const isSunday = subTime.getDay() === 0; // Sonntag überprüfen sd

      switch (unit) {
        case 'week':
          label = this.formatWeekDay(subTime); // Formatierung für Woche
          break;
        case 'day':
        case '12-hours':
        case '6-hours':
          label = this.formatHour(subTime); // Stunden
          break;
        case '1-hour':
          label = this.formatMinute(subTime); // Minuten
          break;
        default:
          label = this.formatTime(subTime); // Standardformatierung
          break;
      }
      subtimes.push({ label, date: subTime, isSunday });
    }
    return subtimes;
  }

  private calculateStartTime(
    timeIndex: Date,
    firstTime: number,
    lastTime: number,
    step: number,
    totalColumns: number,
    unit: string,
  ): number {
    let startTime = timeIndex.getTime() - (step * totalColumns) / 2;

    if (startTime > lastTime - step * totalColumns)
      startTime = lastTime - step * totalColumns;
    if (startTime < firstTime) startTime = firstTime;

    if (unit === 'day' || !unit.includes('hour'))
      startTime = this.roundToMidnight(new Date(startTime)).getTime();
    if (unit === 'week')
      startTime = this.roundToMonday(new Date(startTime)).getTime();

    return startTime;
  }
  private createGroup(
    start: Date,
    unit: string,
    step: number,
    columnWidth: number,
  ) {
    return {
      start,
      colspan: this.getIntervalsForUnit(unit),
      subtimes: this.generateSubtimes(unit, start.getTime(), step),
      columnWidth: +remToPx(
        columnWidth / this.getIntervalsForUnit(unit),
      ).toFixed(2),
    };
  }

  // Berechnet die sichtbaren Zeitpunkte basierend auf dem Zoom-Level
  setVisibleTimes(timeIndex: Date = new Date()) {
    const zoom = this.currentZoom;

    if (!zoom) {
      console.error('Ungültige Zoomstufe:', this.currentZoomLevel);
      return;
    }

    const { step, columnWidth, unit } = zoom;
    const totalColumns = Math.floor((48 / columnWidth) * this.maxVisiblePoints);
    this.totalTime = step * totalColumns;

    const firstTime = this.startDate.getTime();
    const lastTime = this.endDate.getTime();

    const index =
      timeIndex.getTime() < firstTime ? firstTime : timeIndex.getTime();

    let startTime = this.calculateStartTime(
      timeIndex,
      firstTime,
      lastTime,
      step,
      totalColumns,
      unit,
    );

    this.visibleTimes = Array.from({ length: totalColumns }, (_, i) => {
      const groupStart = new Date(startTime + i * step);
      return this.createGroup(groupStart, unit, step, columnWidth);
    });

    this.updateVisibleRange(); // Aktualisiere sichtbaren Bereich
  }

  private formatWeekDay(date: Date): string {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()];
  }

  private formatHour(date: Date): string {
    return date.getHours().toString().padStart(2, '0');
  }

  private formatMinute(date: Date): string {
    return date.getMinutes().toString().padStart(2, '0');
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
    const mouseX = event.clientX - wrapperRect.left; // Maus-X-Position relativ zum Wrapper
    const mousePercentage = Math.max(0, Math.min(1, mouseX / wrapperWidth));

    const firstTime = this.firstVisibleTime.getTime();
    const lastTime = this.lastVisibleTime.getTime();
    const totalTime = lastTime - firstTime;
    // Berechnung der absoluten Zeitposition basierend auf der Maus
    const timeIndex = firstTime + totalTime * mousePercentage;
    this.mouseTime = new Date(timeIndex);
  }

  formatTime(date: Date): string {
    const zoom = this.currentZoom;
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
        return `KW ${this.getWeekNumber(date) + ' | ' + this.formatDate(date)}`; // KW 2
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
        const endDate2 = new Date(date.getTime() + zoom.step);
        return `${this.formatDate(date)} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} - ${endDate2.getHours()}:${endDate2.getMinutes().toString().padStart(2, '0')}`;
    }
  }

  // Hilfsfunktion zur Formatierung eines Datums
  private formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}.${(
      date.getMonth() + 1
    )
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
      const targetScrollLeft =
        ((mouseTimeBeforeZoom - firstVisibleTime) / totalVisibleTime) *
        wrapper.scrollWidth;

      // Scrollen, um die Zeit unter der Maus zu erhalten
      wrapper.scrollTo({
        left: targetScrollLeft - mouseRatio * wrapper.clientWidth,
        behavior: 'smooth',
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

  zoom(zoomDelta: number) {
    const newZoomLevel = this.currentZoomLevel - zoomDelta;
    if (newZoomLevel < 1 || newZoomLevel > this.zoomLevels.length) return;

    const index = this.firstVisibleTime.getTime() + this.totalTime / 2;
    this.currentZoomLevel = newZoomLevel;

    this.smoothTransition(() => this.setVisibleTimes(new Date(index)));
    this.updateVisibleRange();
  }

  zoomIn() {
    this.zoom(-1);
  }

  zoomOut() {
    this.zoom(1);
  }

  getColumnWidth(): number {
    const zoom = this.currentZoom;
    return zoom ? zoom.columnWidth : 3; // Standardwert: 3rem
  }

  scrollToTime(time: Date, wrapper: HTMLElement) {
    const totalWidth = wrapper.scrollWidth;

    // Pixelposition der gespeicherten Zeit berechnen
    const targetX = (time.getTime() / this.totalTime) * totalWidth;

    // Neue Scrollposition setzen
    wrapper.scrollTo({
      left: targetX - wrapper.clientWidth / 2,
      behavior: 'smooth',
    });
  }

  getZoomLabel(): string {
    const zoom = this.currentZoom;
    return zoom ? zoom.label : 'Unbekannter Zoom-Level';
  }

  isSunday(date: string): boolean {
    const parsedDate = new Date(date);
    return parsedDate.getDay() === 0; // 0 entspricht Sonntag
  }


  toggleSelection(resourceId: number, event?: MouseEvent): void {
    if (event) event.stopPropagation(); // Verhindert das doppelte Triggern
    this.selectionService.toggleSelection(resourceId);
  }

  isSelected(resourceId: number): boolean {
    return this.selectionService.isSelected(resourceId);
  }

  selectOnly(resourceId: number): void {
    this.selectionService.selectOnly(resourceId); // Nur die geklickte Zeile auswählen
  }

  onResizeStart(event: MouseEvent, resourceId: number): void {
    event.preventDefault(); // Verhindert unerwünschte Selektionen
  
    this.resizingResourceId = resourceId;
    this.initialMouseY = event.clientY;
    this.initialHeight = this.selectionService.getRowHeight(resourceId);
  
    // Events für Resizing
    document.addEventListener('mousemove', this.onResizing.bind(this));
    document.addEventListener('mouseup', this.onResizeEnd.bind(this));
  }
  
  onResizing(event: MouseEvent): void {
    if (this.resizingResourceId !== null) {
      const deltaY = event.clientY - this.initialMouseY;
      const newHeight = Math.max(20, this.initialHeight + deltaY); // Mindesthöhe 20px
      this.selectionService.updateRowHeight(this.resizingResourceId, newHeight);
    }
  }
  
  onResizeEnd(): void {
    this.resizingResourceId = null;
  
    // Entferne Events nach Abschluss des Resizing
    document.removeEventListener('mousemove', this.onResizing.bind(this));
    document.removeEventListener('mouseup', this.onResizeEnd.bind(this));
  }
  
  getRowHeight(resourceId: number): number {
    return this.selectionService.getRowHeight(resourceId);
  }
  
}

interface Subtime {
  label: string;
  date: Date;
  isSunday: boolean;
}
