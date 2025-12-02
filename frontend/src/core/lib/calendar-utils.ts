/**
 * Utilitaires pour le calendrier
 */

import {
  CalendarEvent,
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  EventColor,
} from "@/core/types/calendar";

// Noms des jours de la semaine en français
export const DAYS_OF_WEEK = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Noms des mois en français
export const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Couleurs disponibles pour les événements
export const EVENT_COLORS: EventColor[] = [
  "blue",
  "green",
  "purple",
  "orange",
  "red",
  "yellow",
  "pink",
  "gray",
];

// Mapping des couleurs vers les classes CSS avec thème dynamique
export const COLOR_CLASSES: Record<EventColor, string> = {
  blue: "bg-theme-primary text-white", // Utilise la couleur primaire du thème sélectionné
  green: "bg-success text-white", // Couleur sémantique (toujours vert)
  purple: "bg-theme-secondary text-white", // Utilise la couleur secondaire du thème sélectionné
  orange: "bg-warning text-white", // Couleur sémantique (toujours orange)
  red: "bg-danger text-white", // Couleur sémantique (toujours rouge)
  yellow: "bg-warning-100 text-warning-800", // Couleur sémantique (toujours jaune)
  pink: "bg-pink-500 text-white", // Couleur fixe rose
  gray: "bg-default-500 text-white", // Couleur neutre
};

/**
 * Génère un ID unique pour un événement
 */
export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vérifie si deux dates sont le même jour
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Vérifie si une date est dans le mois courant
 */
export function isCurrentMonth(
  date: Date,
  currentMonth: number,
  currentYear: number,
): boolean {
  return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
}

/**
 * Obtient le premier jour du mois
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Obtient le dernier jour du mois
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * Obtient le nombre de jours dans un mois
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Obtient le premier lundi de la semaine contenant une date donnée
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustement pour commencer le lundi

  return new Date(d.setDate(diff));
}

/**
 * Obtient le dernier dimanche de la semaine contenant une date donnée
 */
export function getEndOfWeek(date: Date): Date {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);

  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return endOfWeek;
}

/**
 * Génère les jours d'un mois avec padding pour les semaines complètes
 */
export function generateMonthDays(
  year: number,
  month: number,
  selectedDate?: Date,
): CalendarDay[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);
  const startOfWeek = getStartOfWeek(firstDay);
  const endOfWeek = getEndOfWeek(lastDay);

  const days: CalendarDay[] = [];
  const currentDate = new Date(startOfWeek);

  while (currentDate <= endOfWeek) {
    days.push({
      date: new Date(currentDate),
      isCurrentMonth: isCurrentMonth(currentDate, month, year),
      isToday: isToday(currentDate),
      isSelected: selectedDate ? isSameDay(currentDate, selectedDate) : false,
      events: [], // Sera rempli par le composant parent
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

/**
 * Génère les semaines d'un mois
 */
export function generateMonthWeeks(
  year: number,
  month: number,
  selectedDate?: Date,
): CalendarWeek[] {
  const days = generateMonthDays(year, month, selectedDate);
  const weeks: CalendarWeek[] = [];

  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);

    weeks.push({
      days: weekDays,
      weekNumber: Math.floor(i / 7) + 1,
    });
  }

  return weeks;
}

/**
 * Génère un objet CalendarMonth
 */
export function generateCalendarMonth(
  year: number,
  month: number,
  selectedDate?: Date,
): CalendarMonth {
  return {
    weeks: generateMonthWeeks(year, month, selectedDate),
    month,
    year,
  };
}

/**
 * Obtient les jours d'une semaine
 */
export function getWeekDays(date: Date): CalendarDay[] {
  const startOfWeek = getStartOfWeek(date);
  const days: CalendarDay[] = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);

    currentDate.setDate(startOfWeek.getDate() + i);

    days.push({
      date: new Date(currentDate),
      isCurrentMonth: true,
      isToday: isToday(currentDate),
      isSelected: isSameDay(currentDate, date),
      events: [],
    });
  }

  return days;
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(
  date: Date,
  format: "short" | "long" | "time" = "short",
): string {
  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case "short":
      options.day = "numeric";
      options.month = "short";
      break;
    case "long":
      options.weekday = "long";
      options.day = "numeric";
      options.month = "long";
      options.year = "numeric";
      break;
    case "time":
      options.hour = "2-digit";
      options.minute = "2-digit";
      break;
  }

  return date.toLocaleDateString("fr-FR", options);
}

/**
 * Formate une heure pour l'affichage
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Obtient les événements pour une date donnée
 */
export function getEventsForDate(
  events: CalendarEvent[],
  date: Date,
): CalendarEvent[] {
  const filteredEvents = events.filter((event) => {
    if (event.allDay) {
      return isSameDay(event.start, date);
    }

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Pour les événements avec heure, vérifier si la date donnée correspond au jour de l'événement
    return (
      isSameDay(eventStart, date) ||
      isSameDay(eventEnd, date) ||
      (eventStart < date && eventEnd > date)
    );
  });

  return filteredEvents;
}

/**
 * Obtient les événements pour une plage de dates
 */
export function getEventsForDateRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Vérifier si l'événement chevauche avec la plage
    return eventStart <= endDate && eventEnd >= startDate;
  });
}

/**
 * Vérifie s'il y a des conflits entre événements
 */
export function hasEventConflict(
  events: CalendarEvent[],
  newEvent: CalendarEvent,
): boolean {
  return events.some((event) => {
    if (event.id === newEvent.id) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const newEventStart = new Date(newEvent.start);
    const newEventEnd = new Date(newEvent.end);

    // Vérifier le chevauchement
    return newEventStart < eventEnd && newEventEnd > eventStart;
  });
}

/**
 * Calcule la position d'un événement dans la vue semaine/jour
 */
export function calculateEventPosition(
  event: CalendarEvent,
  startHour: number = 0,
): {
  top: number;
  height: number;
  left: number;
  width: number;
} {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const top = ((startMinutes - startHour * 60) / 60) * 60; // 60px par heure
  const height = ((endMinutes - startMinutes) / 60) * 60;

  return {
    top,
    height: Math.max(height, 20), // Hauteur minimale de 20px
    left: 0,
    width: 100,
  };
}

/**
 * Calcule les positions des événements en gérant les chevauchements
 */
export function calculateEventPositionsWithOverlap(
  events: CalendarEvent[],
  startHour: number = 0,
): Array<{
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  column: number;
  totalColumns: number;
  overlapLevel: number;
}> {
  if (events.length === 0) return [];

  // Trier les événements par heure de début
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const result: Array<{
    event: CalendarEvent;
    top: number;
    height: number;
    left: number;
    width: number;
    column: number;
    totalColumns: number;
    overlapLevel: number;
  }> = [];

  // Grouper les événements par créneaux qui se chevauchent
  const eventGroups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [];
  let groupEndTime = 0;

  for (const event of sortedEvents) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const eventStartMinutes =
      eventStart.getHours() * 60 + eventStart.getMinutes();
    const eventEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();

    if (currentGroup.length === 0 || eventStartMinutes < groupEndTime) {
      // Ajouter à la groupe actuelle
      currentGroup.push(event);
      groupEndTime = Math.max(groupEndTime, eventEndMinutes);
    } else {
      // Commencer un nouveau groupe
      eventGroups.push(currentGroup);
      currentGroup = [event];
      groupEndTime = eventEndMinutes;
    }
  }

  // Ajouter le dernier groupe
  if (currentGroup.length > 0) {
    eventGroups.push(currentGroup);
  }

  // Calculer les positions pour chaque groupe
  for (const group of eventGroups) {
    const totalColumns = group.length;
    const overlapLevel = Math.min(totalColumns, 4); // Limiter à 4 colonnes max pour l'UX

    for (let i = 0; i < group.length; i++) {
      const event = group[i];
      const start = new Date(event.start);
      const end = new Date(event.end);

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      const top = ((startMinutes - startHour * 60) / 60) * 60;
      const height = ((endMinutes - startMinutes) / 60) * 60;

      // Calculer la position horizontale avec espacement intelligent
      const spacing = totalColumns > 1 ? 1 : 0; // 1% d'espacement entre les colonnes
      const availableWidth = 100 - spacing * (totalColumns - 1);
      const columnWidth = availableWidth / totalColumns;
      const left = i * (columnWidth + spacing);
      const width = columnWidth;

      result.push({
        event,
        top,
        height: Math.max(height, 20),
        left,
        width,
        column: i,
        totalColumns,
        overlapLevel,
      });
    }
  }

  return result;
}

/**
 * Convertit une position Y en heure
 */
export function yToHour(y: number, startHour: number = 0): number {
  return startHour + y / 60; // 60px par heure
}

/**
 * Convertit une heure en position Y
 */
export function hourToY(hour: number, startHour: number = 0): number {
  return (hour - startHour) * 60; // 60px par heure
}

/**
 * Arrondit une heure au quart d'heure le plus proche
 */
export function roundToQuarterHour(hour: number): number {
  return Math.round(hour * 4) / 4;
}

/**
 * Arrondit une heure au créneau le plus proche avec une tolérance
 */
export function snapToNearestSlot(
  hour: number,
  tolerance: number = 0.1,
): number {
  const quarterHour = roundToQuarterHour(hour);
  const difference = Math.abs(hour - quarterHour);

  // Si la différence est très petite, on snap au quart d'heure
  if (difference <= tolerance) {
    return quarterHour;
  }

  // Sinon, on retourne l'heure exacte
  return hour;
}

/**
 * Calcule l'index du jour basé sur la position X et la largeur des colonnes
 */
export function calculateDayIndex(
  deltaX: number,
  originalDayIndex: number,
  dayWidth: number,
): number {
  // Calculer la position X relative en tenant compte de la position originale
  const relativeX = deltaX + originalDayIndex * dayWidth;

  // Calculer le nouvel index avec des limites
  const newIndex = Math.max(0, Math.min(6, Math.round(relativeX / dayWidth)));

  return newIndex;
}

/**
 * Calcule la nouvelle heure de fin lors du redimensionnement
 */
export function calculateNewEndTime(
  event: CalendarEvent,
  newY: number,
  handleType: "top" | "bottom",
  startHour: number = 0,
): Date {
  const newHour = roundToQuarterHour(yToHour(newY, startHour));
  const newDate = new Date(event.end);

  if (handleType === "bottom") {
    // Redimensionnement par le bas - modifier l'heure de fin
    const hours = Math.floor(newHour);
    const minutes = (newHour - hours) * 60;

    newDate.setHours(hours, minutes, 0, 0);
  } else {
    // Redimensionnement par le haut - modifier l'heure de début
    const hours = Math.floor(newHour);
    const minutes = (newHour - hours) * 60;

    newDate.setHours(hours, minutes, 0, 0);
  }

  return newDate;
}

/**
 * Calcule la nouvelle heure de début lors du redimensionnement par le haut
 */
export function calculateNewStartTime(
  event: CalendarEvent,
  newY: number,
  startHour: number = 0,
): Date {
  const newHour = roundToQuarterHour(yToHour(newY, startHour));
  const newDate = new Date(event.start);

  const hours = Math.floor(newHour);
  const minutes = (newHour - hours) * 60;

  newDate.setHours(hours, minutes, 0, 0);

  return newDate;
}

/**
 * Navigation temporelle
 */
export function getPreviousMonth(date: Date): Date {
  const newDate = new Date(date);

  newDate.setMonth(date.getMonth() - 1);

  return newDate;
}

export function getNextMonth(date: Date): Date {
  const newDate = new Date(date);

  newDate.setMonth(date.getMonth() + 1);

  return newDate;
}

export function getPreviousWeek(date: Date): Date {
  const newDate = new Date(date);

  newDate.setDate(date.getDate() - 7);

  return newDate;
}

export function getNextWeek(date: Date): Date {
  const newDate = new Date(date);

  newDate.setDate(date.getDate() + 7);

  return newDate;
}

export function getPreviousDay(date: Date): Date {
  const newDate = new Date(date);

  newDate.setDate(date.getDate() - 1);

  return newDate;
}

export function getNextDay(date: Date): Date {
  const newDate = new Date(date);

  newDate.setDate(date.getDate() + 1);

  return newDate;
}

/**
 * Obtient le titre de la période courante selon la vue
 */
export function getPeriodTitle(
  date: Date,
  view: "month" | "week" | "day" | "agenda",
): string {
  switch (view) {
    case "month":
      return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    case "week":
      const startOfWeek = getStartOfWeek(date);
      const endOfWeek = getEndOfWeek(date);

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
      } else {
        return `${startOfWeek.getDate()} ${MONTHS[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${MONTHS[endOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
      }
    case "day":
      return formatDate(date, "long");
    case "agenda":
      return "Agenda";
    default:
      return "";
  }
}

/**
 * Génère des événements de démonstration
 */
export function generateDemoEvents(): CalendarEvent[] {
  const today = new Date();
  const events: CalendarEvent[] = [];

  // Événement aujourd'hui
  const todayEvent = new Date(today);

  todayEvent.setHours(10, 0, 0, 0);
  events.push({
    id: generateEventId(),
    title: "Réunion équipe",
    description: "Réunion hebdomadaire de l'équipe",
    start: todayEvent,
    end: new Date(todayEvent.getTime() + 2 * 60 * 60 * 1000), // +2h
    color: "blue",
    category: "Travail",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Événement demain
  const tomorrowEvent = new Date(today);

  tomorrowEvent.setDate(today.getDate() + 1);
  tomorrowEvent.setHours(14, 30, 0, 0);
  events.push({
    id: generateEventId(),
    title: "Présentation client",
    description: "Présentation du nouveau projet",
    start: tomorrowEvent,
    end: new Date(tomorrowEvent.getTime() + 1.5 * 60 * 60 * 1000), // +1.5h
    color: "green",
    category: "Client",
    location: "Salle de conférence A",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Événement toute la journée
  const allDayEvent = new Date(today);

  allDayEvent.setDate(today.getDate() + 3);
  allDayEvent.setHours(0, 0, 0, 0);
  events.push({
    id: generateEventId(),
    title: "Formation",
    description: "Formation sur les nouvelles technologies",
    start: allDayEvent,
    end: new Date(allDayEvent.getTime() + 24 * 60 * 60 * 1000), // +24h
    color: "purple",
    category: "Formation",
    allDay: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return events;
}
