/**
 * Hook personnalisé pour la gestion du calendrier
 */

import React, { useState, useCallback, useMemo } from "react";
import { useQueryState } from "nuqs";
import {
  CalendarEvent,
  CalendarView,
  CalendarHook,
  EventColor,
} from "@/core/types/calendar";
import {
  generateEventId,
  getEventsForDate,
  getEventsForDateRange,
  getPreviousMonth,
  getNextMonth,
  getPreviousWeek,
  getNextWeek,
  getPreviousDay,
  getNextDay,
  generateDemoEvents,
} from "@/core/lib/calendar-utils";

export function useCalendar(): CalendarHook {
  // État principal
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Utiliser NUqs pour persister la vue dans l'URL
  const [viewString, setViewString] = useQueryState("view", {
    defaultValue: "month",
  });

  // Convertir la chaîne en type CalendarView
  const view: CalendarView =
    viewString === "week" || viewString === "day" || viewString === "agenda"
      ? viewString
      : "month";

  const setView = (newView: CalendarView) => {
    setViewString(newView);
  };

  // Utiliser NUqs pour persister la date sélectionnée dans l'URL
  const [dateString, setDateString] = useQueryState("date", {
    defaultValue: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
  });

  // Convertir la chaîne en Date
  const selectedDate: Date = (() => {
    try {
      return new Date(dateString);
    } catch {
      return new Date();
    }
  })();

  const setSelectedDate = (newDate: Date) => {
    setDateString(newDate.toISOString().split("T")[0]);
  };
  const [events, setEvents] = useState<CalendarEvent[]>(generateDemoEvents());

  // État pour gérer le scroll par défaut
  const [shouldScrollToDefault, setShouldScrollToDefault] =
    useState<boolean>(true);

  // Ref pour forcer le scroll même si l'état n'est pas synchronisé
  const scrollTriggerRef = React.useRef<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Actions pour la gestion des événements
  const createEvent = useCallback(
    (eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
      try {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: generateEventId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setEvents((prevEvents) => [...prevEvents, newEvent]);
        setError(null);
      } catch (err) {
        setError("Erreur lors de la création de l'événement");
        console.error("Erreur création événement:", err);
      }
    },
    []
  );

  const updateEvent = useCallback(
    (id: string, eventData: Partial<CalendarEvent>) => {
      try {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === id
              ? {
                  ...event,
                  ...eventData,
                  updatedAt: new Date(),
                }
              : event
          )
        );
        setError(null);
      } catch (err) {
        setError("Erreur lors de la mise à jour de l'événement");
        console.error("Erreur mise à jour événement:", err);
      }
    },
    []
  );

  const deleteEvent = useCallback((id: string) => {
    try {
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
      setError(null);
    } catch (err) {
      setError("Erreur lors de la suppression de l'événement");
      console.error("Erreur suppression événement:", err);
    }
  }, []);

  // Actions pour la navigation temporelle
  const navigateToPrevious = useCallback(() => {
    switch (view) {
      case "month":
        setCurrentDate((prev) => getPreviousMonth(prev));
        break;
      case "week":
        setCurrentDate((prev) => getPreviousWeek(prev));
        break;
      case "day":
        // En vue jour, on modifie selectedDate car c'est ce qui est affiché
        setSelectedDate(getPreviousDay(selectedDate));
        break;
      case "agenda":
        // Pour l'agenda, on navigue par mois
        setCurrentDate((prev) => getPreviousMonth(prev));
        break;
    }
    // Déclencher le scroll par défaut après navigation
    setShouldScrollToDefault(true);
  }, [view, selectedDate]);

  const navigateToNext = useCallback(() => {
    switch (view) {
      case "month":
        setCurrentDate((prev) => getNextMonth(prev));
        break;
      case "week":
        setCurrentDate((prev) => getNextWeek(prev));
        break;
      case "day":
        // En vue jour, on modifie selectedDate car c'est ce qui est affiché
        setSelectedDate(getNextDay(selectedDate));
        break;
      case "agenda":
        // Pour l'agenda, on navigue par mois
        setCurrentDate((prev) => getNextMonth(prev));
        break;
    }
    // Déclencher le scroll par défaut après navigation
    setShouldScrollToDefault(true);
  }, [view, selectedDate]);

  const navigateToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    // Déclencher le scroll par défaut après navigation
    setShouldScrollToDefault(true);
  }, []);

  // Fonctions utilitaires pour récupérer les événements
  const getEventsForDateCallback = useCallback(
    (date: Date) => {
      return getEventsForDate(events, date);
    },
    [events]
  );

  const getEventsForDateRangeCallback = useCallback(
    (start: Date, end: Date) => {
      return getEventsForDateRange(events, start, end);
    },
    [events]
  );

  // Actions pour la gestion de l'état
  const setCurrentDateCallback = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const setSelectedDateCallback = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const setViewCallback = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  // Valeurs calculées
  const eventsForCurrentPeriod = useMemo(() => {
    switch (view) {
      case "month":
        const monthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const monthEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        return getEventsForDateRange(events, monthStart, monthEnd);

      case "week":
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Lundi
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Dimanche
        return getEventsForDateRange(events, weekStart, weekEnd);

      case "day":
        return getEventsForDate(events, selectedDate);

      case "agenda":
        // Pour l'agenda, on affiche les événements des 30 prochains jours
        const agendaStart = new Date();
        const agendaEnd = new Date();
        agendaEnd.setDate(agendaStart.getDate() + 30);
        return getEventsForDateRange(events, agendaStart, agendaEnd).sort(
          (a, b) => a.start.getTime() - b.start.getTime()
        );

      default:
        return [];
    }
  }, [events, currentDate, view]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const today = new Date();
    const todayEvents = getEventsForDate(events, today);
    const thisWeekEvents = getEventsForDateRange(
      events,
      new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000),
      new Date(today.getTime() + (6 - today.getDay()) * 24 * 60 * 60 * 1000)
    );

    return {
      totalEvents: events.length,
      todayEvents: todayEvents.length,
      thisWeekEvents: thisWeekEvents.length,
      upcomingEvents: events.filter((event) => event.start > today).length,
    };
  }, [events]);

  // Fonctions pour gérer le scroll par défaut
  const triggerScrollToDefault = useCallback(() => {
    console.log("triggerScrollToDefault called");
    setShouldScrollToDefault(true);
    scrollTriggerRef.current += 1; // Incrémenter pour forcer le re-render
  }, []);

  const markScrollCompleted = useCallback(() => {
    console.log("markScrollCompleted called");
    setShouldScrollToDefault(false);
  }, []);

  return {
    // État
    currentDate,
    selectedDate,
    view,
    events,
    isLoading,
    error,
    shouldScrollToDefault,
    scrollTriggerRef,

    // Actions
    setCurrentDate: setCurrentDateCallback,
    setSelectedDate: setSelectedDateCallback,
    setView: setViewCallback,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate: getEventsForDateCallback,
    getEventsForDateRange: getEventsForDateRangeCallback,
    navigateToPrevious,
    navigateToNext,
    navigateToToday,
    triggerScrollToDefault,
    markScrollCompleted,

    // Valeurs calculées
    eventsForCurrentPeriod,
    stats,
  };
}

// Hook spécialisé pour la gestion des formulaires d'événements
export function useEventForm(initialEvent?: CalendarEvent | null) {
  const [formData, setFormData] = useState({
    title: initialEvent?.title || "",
    description: initialEvent?.description || "",
    startDate: initialEvent
      ? initialEvent.start.toISOString().split("T")[0]
      : "",
    startTime:
      initialEvent && !initialEvent.allDay
        ? initialEvent.start.toTimeString().slice(0, 5)
        : "09:00",
    endDate: initialEvent ? initialEvent.end.toISOString().split("T")[0] : "",
    endTime:
      initialEvent && !initialEvent.allDay
        ? initialEvent.end.toTimeString().slice(0, 5)
        : "10:00",
    color: (initialEvent?.color || "blue") as EventColor,
    category: initialEvent?.category || "",
    allDay: initialEvent?.allDay || false,
    location: initialEvent?.location || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mettre à jour le formulaire quand l'événement initial change
  React.useEffect(() => {
    if (initialEvent) {
      setFormData({
        title: initialEvent.title || "",
        description: initialEvent.description || "",
        startDate: initialEvent.start.toISOString().split("T")[0],
        startTime: initialEvent.allDay
          ? "09:00"
          : initialEvent.start.toTimeString().slice(0, 5),
        endDate: initialEvent.end.toISOString().split("T")[0],
        endTime: initialEvent.allDay
          ? "10:00"
          : initialEvent.end.toTimeString().slice(0, 5),
        color: (initialEvent.color || "blue") as EventColor,
        category: initialEvent.category || "",
        allDay: initialEvent.allDay || false,
        location: initialEvent.location || "",
      });
    }
  }, [initialEvent]);

  const updateField = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Effacer l'erreur du champ modifié
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!formData.startDate) {
      newErrors.startDate = "La date de début est requise";
    }

    if (!formData.endDate) {
      newErrors.endDate = "La date de fin est requise";
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate < startDate) {
        newErrors.endDate = "La date de fin doit être après la date de début";
      }
    }

    if (!formData.allDay && formData.startTime && formData.endTime) {
      if (
        formData.startDate === formData.endDate &&
        formData.endTime <= formData.startTime
      ) {
        newErrors.endTime = "L'heure de fin doit être après l'heure de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      startTime: "09:00",
      endDate: "",
      endTime: "10:00",
      color: "blue",
      category: "",
      allDay: false,
      location: "",
    });
    setErrors({});
  }, []);

  const getEventFromForm = useCallback((): Omit<
    CalendarEvent,
    "id" | "createdAt" | "updatedAt"
  > => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (!formData.allDay) {
      const [startHour, startMinute] = formData.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = formData.endTime.split(":").map(Number);

      startDate.setHours(startHour, startMinute, 0, 0);
      endDate.setHours(endHour, endMinute, 0, 0);
    } else {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    return {
      title: formData.title,
      description: formData.description,
      start: startDate,
      end: endDate,
      color: formData.color,
      category: formData.category,
      allDay: formData.allDay,
      location: formData.location,
    };
  }, [formData]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    getEventFromForm,
  };
}
