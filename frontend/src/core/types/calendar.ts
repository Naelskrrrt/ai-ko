/**
 * Types TypeScript pour le système de calendrier
 */

export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color: EventColor;
  category?: string;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResizeHandle {
  type: "top" | "bottom";
  event: CalendarEvent;
}

export type EventColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "yellow"
  | "pink"
  | "gray";

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

export interface CalendarWeek {
  days: CalendarDay[];
  weekNumber: number;
}

export interface CalendarMonth {
  weeks: CalendarWeek[];
  month: number;
  year: number;
}

export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  color: EventColor;
  category: string;
  allDay: boolean;
  location: string;
}

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  shouldScrollToDefault: boolean;
  scrollTriggerRef: React.MutableRefObject<number>;
  eventsForCurrentPeriod: CalendarEvent[];
  stats: {
    totalEvents: number;
    todayEvents: number;
    thisWeekEvents: number;
    upcomingEvents: number;
  };
}

export interface CalendarActions {
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  createEvent: (
    event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (start: Date, end: Date) => CalendarEvent[];
  navigateToPrevious: () => void;
  navigateToNext: () => void;
  navigateToToday: () => void;
  triggerScrollToDefault: () => void;
  markScrollCompleted: () => void;
}

export interface CalendarHook extends CalendarState, CalendarActions {}

// Types utilitaires pour les vues
export interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventCreate: (date: Date) => void;
  onNavigateToDay?: (date: Date) => void;
}

export interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onEventCreate: (
    date: Date,
    startTime: string,
    endTime: string,
    triggerElement?: HTMLElement
  ) => void;
  onEventResize?: (eventId: string, newStart: Date, newEnd: Date) => void;
}

export interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventCreate: (
    date: Date,
    startTime: string,
    endTime: string,
    triggerElement?: HTMLElement
  ) => void;
  onEventResize?: (eventId: string, newStart: Date, newEnd: Date) => void;
}

export interface AgendaViewProps {
  events: CalendarEvent[];
  onEventCreate: () => void;
}

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

export interface CalendarToolbarProps {
  currentDate: Date;
  selectedDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onCreateEvent: () => void;
  onBusinessView?: () => void;
}
