"use client";

import React from "react";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { CalendarEvent, MonthViewProps } from "@/core/types/calendar";
import {
  generateCalendarMonth,
  getEventsForDate,
  DAYS_OF_WEEK,
  COLOR_CLASSES,
} from "@/core/lib/calendar-utils";

export function MonthView({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onEventCreate,
  onNavigateToDay,
}: MonthViewProps) {
  const calendarMonth = generateCalendarMonth(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    selectedDate,
  );

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  const handleDateDoubleClick = (date: Date) => {
    if (onNavigateToDay) {
      onNavigateToDay(date);
    }
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
  };

  const handleCreateEvent = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventCreate(date);
  };

  const getEventsForDay = (date: Date) => {
    return getEventsForDate(events, date);
  };

  const renderEvent = (
    event: CalendarEvent,
    index: number,
    maxVisible: number = 3,
  ) => {
    if (index >= maxVisible) return null;

    return (
      <div
        key={event.id}
        className={clsx(
          "text-xs px-2 py-1 rounded cursor-pointer transition-colors hover:opacity-80 truncate select-none",
          COLOR_CLASSES[event.color],
        )}
        title={`${event.title}${event.allDay ? " (Toute la journée)" : ""}`}
        onClick={(e) => handleEventClick(event, e)}
      >
        {event.title}
      </div>
    );
  };

  const renderMoreEventsIndicator = (date: Date, visibleCount: number) => {
    const dayEvents = getEventsForDay(date);
    const remainingCount = dayEvents.length - visibleCount;

    if (remainingCount <= 0) return null;

    return (
      <div
        className="text-xs px-2 py-1 text-default-500 dark:text-default-400 cursor-pointer hover:text-default-700 dark:hover:text-default-200"
        onClick={(e) => handleCreateEvent(date, e)}
      >
        +{remainingCount} autres
      </div>
    );
  };

  return (
    <>
      {/* En-têtes des jours de la semaine */}
      <div className="flex border-b border-divider flex-shrink-0 bg-background">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="flex-1 p-3 text-center text-sm font-medium text-default-700 dark:text-default-200 bg-default-50 dark:bg-default-900"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier avec flex - prend toute la hauteur disponible */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
        {calendarMonth.weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="flex-1 flex border-t first:border-t-0 border-divider min-h-0 overflow-hidden"
          >
            {week.days.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day.date);
              const maxVisibleEvents = 3;

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={clsx(
                    "flex-1 p-2 cursor-pointer transition-colors hover:bg-default-100 dark:hover:bg-default-800",
                    "flex flex-col min-h-0 overflow-hidden",
                    "border-l first:border-l-0 border-divider",
                    !day.isCurrentMonth &&
                      "bg-default-100/50 dark:bg-default-800/30",
                    day.isToday &&
                      "bg-theme-primary/10 dark:bg-theme-primary/20",
                    day.isSelected &&
                      "bg-theme-primary/20 dark:bg-theme-primary/30",
                  )}
                  title="Cliquez pour sélectionner, double-cliquez pour voir la vue jour"
                  onClick={() => handleDateClick(day.date)}
                  onDoubleClick={() => handleDateDoubleClick(day.date)}
                >
                  {/* Numéro du jour */}
                  <div className="flex items-center justify-between mb-1 flex-shrink-0">
                    <span
                      className={clsx(
                        "text-sm font-medium",
                        day.isToday && "text-theme-primary font-bold",
                        !day.isCurrentMonth &&
                          "text-default-500 dark:text-default-400",
                        day.isCurrentMonth && !day.isToday && "text-foreground",
                      )}
                    >
                      {day.date.getDate()}
                    </span>

                    {/* Bouton + pour créer un événement */}
                    <Button
                      isIconOnly
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 min-w-5"
                      size="sm"
                      variant="light"
                      onClick={(e) => handleCreateEvent(day.date, e)}
                    >
                      <span className="text-xs">+</span>
                    </Button>
                  </div>

                  {/* Événements du jour */}
                  <div className="flex-1 space-y-1 overflow-y-auto min-h-0">
                    {dayEvents
                      .slice(0, maxVisibleEvents)
                      .map((event, index) =>
                        renderEvent(event, index, maxVisibleEvents),
                      )}

                    {renderMoreEventsIndicator(day.date, maxVisibleEvents)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
