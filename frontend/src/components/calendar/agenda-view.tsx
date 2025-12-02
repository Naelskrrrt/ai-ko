"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Calendar, Clock, MapPin, Tag } from "lucide-react";
import clsx from "clsx";

import { CalendarEvent, AgendaViewProps } from "@/core/types/calendar";
import {
  COLOR_CLASSES,
  formatDate,
  formatTime,
  isSameDay,
  isToday,
} from "@/core/lib/calendar-utils";

export function AgendaView({ events, onEventCreate }: AgendaViewProps) {
  // Grouper les événements par date
  const groupedEvents = React.useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {};

    events.forEach((event) => {
      const dateKey = event.start.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    // Trier les groupes par date
    const sortedGroups = Object.entries(groups).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
    );

    return sortedGroups.map(([dateKey, events]) => ({
      date: new Date(dateKey),
      events: events.sort((a, b) => a.start.getTime() - b.start.getTime()),
    }));
  }, [events]);

  const renderEvent = (event: CalendarEvent) => {
    const isAllDay = event.allDay;
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    return (
      <Card
        key={event.id}
        isPressable
        className="cursor-pointer transition-all hover:shadow-md dark:hover:shadow-lg select-none"
      >
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            {/* Indicateur de couleur */}
            <div
              className={clsx(
                "w-3 h-3 rounded-full flex-shrink-0 mt-1",
                COLOR_CLASSES[event.color].split(" ")[0], // Prendre seulement la classe bg
              )}
            />

            {/* Contenu de l'événement */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {event.title}
                </h3>

                {/* Badge toute la journée */}
                {isAllDay && (
                  <span className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-1 rounded-full flex-shrink-0">
                    Toute la journée
                  </span>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-default-600 dark:text-default-400 mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}

              {/* Informations temporelles */}
              <div className="flex items-center gap-4 mt-2 text-xs text-default-500 dark:text-default-400">
                {!isAllDay && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatTime(startDate)}
                      {!isSameDay(startDate, endDate) &&
                        ` - ${formatTime(endDate)}`}
                    </span>
                  </div>
                )}

                {/* Localisation */}
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}

                {/* Catégorie */}
                {event.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{event.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderDateGroup = (date: Date, events: CalendarEvent[]) => {
    const isTodayDate = isToday(date);
    const isPast = date < new Date() && !isTodayDate;

    return (
      <div key={date.toDateString()} className="mb-6">
        {/* En-tête de date */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={clsx(
              "flex items-center gap-2 px-3 py-1 rounded-lg",
              isTodayDate && "bg-theme-primary/10 text-theme-primary",
              isPast && "text-default-400 dark:text-default-500",
              !isTodayDate &&
                !isPast &&
                "bg-default-100 dark:bg-default-50 text-default-700 dark:text-default-300",
            )}
          >
            <Calendar className="w-4 h-4" />
            <span className="font-medium text-sm">
              {formatDate(date, "long")}
            </span>
            {isTodayDate && (
              <span className="text-xs bg-theme-primary text-white px-2 py-0.5 rounded-full">
                Aujourd'hui
              </span>
            )}
          </div>

          <div className="flex-1 h-px bg-divider" />

          <span className="text-xs text-default-400 dark:text-default-500">
            {events.length} événement{events.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Liste des événements */}
        <div className="space-y-2">{events.map(renderEvent)}</div>
      </div>
    );
  };

  if (events.length === 0) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Calendar className="w-16 h-16 text-default-300 dark:text-default-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucun événement à venir
          </h3>
          <p className="text-default-500 dark:text-default-400 mb-6">
            Vous n'avez aucun événement programmé pour les prochains jours.
          </p>
          <Button
            className="bg-theme-primary text-white"
            startContent={<Calendar className="w-4 h-4" />}
            onPress={onEventCreate}
          >
            Créer un événement
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto scrollbar-hide">
      <div className="max-w-4xl mx-auto p-6">
        {/* En-tête */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Agenda</h2>
          <p className="text-default-500 dark:text-default-400">
            Vue d'ensemble de vos événements à venir
          </p>
        </div>

        {/* Liste des événements groupés par date */}
        <div className="space-y-6">
          {groupedEvents.map(({ date, events }) =>
            renderDateGroup(date, events),
          )}
        </div>

        {/* Zone d'action */}
        {/* <div className="mt-8 p-6 bg-default-50 dark:bg-default-100 rounded-lg">
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-2">
              Besoin de créer un événement ?
            </h3>
            <p className="text-sm text-default-500 dark:text-default-400 mb-4">
              Cliquez sur le bouton ci-dessous pour ajouter un nouvel événement
              à votre agenda.
            </p>
            <Button
              className="bg-theme-primary text-white"
              startContent={<Calendar className="w-4 h-4" />}
              onPress={onEventCreate}
            >
              Créer un événement
            </Button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
