"use client";

import React, { Suspense } from "react";

import { DashboardContentArea } from "@/components/layout/content-area";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import { AgendaView } from "@/components/calendar/agenda-view";
import { EventPopover } from "@/components/calendar/event-popover";
import { useCalendar } from "@/core/hooks/useCalendar";
import { CalendarEvent } from "@/core/types/calendar";
// Metadata déplacée vers le layout parent

function CalendarPageContent() {
  const {
    currentDate,
    selectedDate,
    view,
    events,
    shouldScrollToDefault,
    scrollTriggerRef,
    setSelectedDate,
    setView,
    createEvent,
    updateEvent,
    deleteEvent,
    navigateToPrevious,
    navigateToNext,
    navigateToToday,
    triggerScrollToDefault,
    markScrollCompleted,
  } = useCalendar();

  // État pour le popover d'événement
  const [isEventPopoverOpen, setIsEventPopoverOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(
    null,
  );
  const [defaultEventDate, setDefaultEventDate] = React.useState<
    Date | undefined
  >();
  const [defaultStartTime, setDefaultStartTime] = React.useState<
    string | undefined
  >();
  const [defaultEndTime, setDefaultEndTime] = React.useState<
    string | undefined
  >();
  const [popoverTriggerElement, setPopoverTriggerElement] =
    React.useState<HTMLElement | null>(null);

  // Déclencher le scroll par défaut quand on change de vue vers semaine ou jour
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("CalendarPage view changed:", { view, shouldScrollToDefault });
    if (view === "week" || view === "day") {
      // eslint-disable-next-line no-console
      console.log("Triggering scroll to default for view:", view);
      triggerScrollToDefault();
    }
  }, [view, triggerScrollToDefault]);

  // Gestionnaires d'événements
  const handleCreateEvent = (date?: Date, triggerElement?: HTMLElement) => {
    setDefaultEventDate(date);
    setDefaultStartTime(undefined);
    setDefaultEndTime(undefined);
    setEditingEvent(null);
    setPopoverTriggerElement(triggerElement || null);
    setIsEventPopoverOpen(true);
  };

  const handleCreateEventWithTime = (
    date: Date,
    startTime: string,
    endTime: string,
    triggerElement?: HTMLElement,
  ) => {
    setDefaultEventDate(date);
    setDefaultStartTime(startTime);
    setDefaultEndTime(endTime);
    setEditingEvent(null);
    setPopoverTriggerElement(triggerElement || null);
    setIsEventPopoverOpen(true);
  };

  const handleEditEvent = (
    event: CalendarEvent,
    triggerElement?: HTMLElement,
  ) => {
    setEditingEvent(event);
    // Ne pas écraser les valeurs par défaut lors de l'édition
    // Le hook useEventForm utilisera les données de l'événement
    setPopoverTriggerElement(triggerElement || null);
    setIsEventPopoverOpen(true);
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    // eslint-disable-next-line no-console
    console.log("handleSaveEvent called with:", event);
    if (editingEvent) {
      // Pour l'édition, on passe l'événement complet
      // eslint-disable-next-line no-console
      console.log("Updating event:", event.id);
      updateEvent(event.id, event);
    } else {
      // Pour la création, on passe seulement les données sans id, createdAt, updatedAt
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...eventData
      } = event;

      // eslint-disable-next-line no-console
      console.log("Creating new event with data:", eventData);
      createEvent(eventData);
    }
    setIsEventPopoverOpen(false);
    setEditingEvent(null);
    setDefaultEventDate(undefined);
    setPopoverTriggerElement(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    setIsEventPopoverOpen(false);
    setEditingEvent(null);
    setPopoverTriggerElement(null);
  };

  const handleEventResize = (eventId: string, newStart: Date, newEnd: Date) => {
    updateEvent(eventId, {
      start: newStart,
      end: newEnd,
    });
  };

  const handleNavigateToDay = (date: Date) => {
    setSelectedDate(date);
    setView("day");
  };

  const handleClosePopover = () => {
    setIsEventPopoverOpen(false);
    setEditingEvent(null);
    setDefaultEventDate(undefined);
    setDefaultStartTime(undefined);
    setDefaultEndTime(undefined);
    setPopoverTriggerElement(null);
  };

  // Rendu conditionnel des vues
  const renderCurrentView = () => {
    const commonProps = {
      currentDate,
      selectedDate,
      events,
      onEventClick: (event: CalendarEvent, triggerElement?: HTMLElement) =>
        handleEditEvent(event, triggerElement),
    };

    switch (view) {
      case "month":
        return (
          <MonthView
            {...commonProps}
            onDateSelect={setSelectedDate}
            onEventCreate={handleCreateEvent}
            onNavigateToDay={handleNavigateToDay}
          />
        );

      case "week":
        return (
          <WeekView
            {...commonProps}
            scrollTriggerRef={scrollTriggerRef}
            shouldScrollToDefault={shouldScrollToDefault}
            onEventClick={(
              event: CalendarEvent,
              triggerElement?: HTMLElement,
            ) => handleEditEvent(event, triggerElement)}
            onEventCreate={(
              date: Date,
              startTime: string,
              endTime: string,
              triggerElement?: HTMLElement,
            ) =>
              handleCreateEventWithTime(
                date,
                startTime,
                endTime,
                triggerElement,
              )
            }
            onEventResize={handleEventResize}
            onScrollCompleted={markScrollCompleted}
          />
        );

      case "day":
        return (
          <DayView
            currentDate={selectedDate}
            events={events}
            scrollTriggerRef={scrollTriggerRef}
            shouldScrollToDefault={shouldScrollToDefault}
            onEventClick={(
              event: CalendarEvent,
              triggerElement?: HTMLElement,
            ) => handleEditEvent(event, triggerElement)}
            onEventCreate={(
              date: Date,
              startTime: string,
              endTime: string,
              triggerElement?: HTMLElement,
            ) =>
              handleCreateEventWithTime(
                date,
                startTime,
                endTime,
                triggerElement,
              )
            }
            onEventResize={handleEventResize}
            onScrollCompleted={markScrollCompleted}
          />
        );

      case "agenda":
        return (
          <AgendaView
            events={events}
            onEventCreate={() => handleCreateEvent()}
          />
        );

      default:
        return null;
    }
  };

  return (
    <DashboardContentArea
      className="flex flex-col h-full p-0"
      enableScroll={false}
      fullWidth={true}
    >
      {/* Toolbar de navigation */}
      <div className="pb-0 flex-shrink-0">
        <CalendarToolbar
          currentDate={currentDate}
          selectedDate={selectedDate}
          view={view}
          onBusinessView={() => triggerScrollToDefault()}
          onCreateEvent={() => handleCreateEvent()}
          onNavigateNext={navigateToNext}
          onNavigatePrevious={navigateToPrevious}
          onNavigateToday={navigateToToday}
          onViewChange={setView}
        />
      </div>

      {/* Contenu principal du calendrier */}
      <DashboardContentArea
        className="flex-1 flex flex-col min-h-0 scrollbar-hide"
        enableScroll={view !== "month"}
        fullWidth={true}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {renderCurrentView()}
        </div>
      </DashboardContentArea>

      {/* Popover d'événement */}
      <EventPopover
        defaultDate={defaultEventDate}
        defaultEndTime={defaultEndTime}
        defaultStartTime={defaultStartTime}
        event={editingEvent}
        isOpen={isEventPopoverOpen}
        triggerElement={popoverTriggerElement}
        onClose={handleClosePopover}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
        onSave={handleSaveEvent}
      />
    </DashboardContentArea>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Chargement...
        </div>
      }
    >
      <CalendarPageContent />
    </Suspense>
  );
}
