"use client";

import React from "react";
import { CalendarEvent, WeekViewProps } from "@/core/types/calendar";
import {
  getWeekDays,
  getEventsForDate,
  DAYS_OF_WEEK,
  COLOR_CLASSES,
  formatTime,
  calculateEventPosition,
  calculateEventPositionsWithOverlap,
  yToHour,
  roundToQuarterHour,
  snapToNearestSlot,
} from "@/core/lib/calendar-utils";
import { ResizeHandle } from "./resize-handle";
import { useCurrentTime } from "@/core/hooks/useCurrentTime";
import clsx from "clsx";

export function WeekView({
  currentDate,
  selectedDate,
  events,
  onEventCreate,
  onEventResize,
  onEventClick,
  shouldScrollToDefault = false,
  scrollTriggerRef,
  onScrollCompleted,
}: WeekViewProps & {
  onEventClick?: (event: CalendarEvent, triggerElement?: HTMLElement) => void;
  shouldScrollToDefault?: boolean;
  scrollTriggerRef?: React.MutableRefObject<number>;
  onScrollCompleted?: () => void;
}) {
  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const startHour = 7; // Heure de début par défaut

  // Refs pour gérer le scroll
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll automatique au montage du composant
  React.useEffect(() => {
    const scrollTo7h = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const targetPosition = startHour * 60; // 7h * 60px = 420px
      const containerHeight = container.clientHeight;
      const maxScrollTop = container.scrollHeight - containerHeight;

      const centerOffset = containerHeight / 2;
      const optimalScrollTop = Math.max(
        0,
        Math.min(targetPosition - centerOffset, maxScrollTop)
      );

      container.scrollTop = optimalScrollTop;
      console.log("WeekView auto-scroll to 7h on mount:", { optimalScrollTop });
    };

    // Délai pour s'assurer que le DOM est rendu
    const timeoutId = setTimeout(scrollTo7h, 200);
    return () => clearTimeout(timeoutId);
  }, []); // Se déclenche seulement au montage

  // Scroll automatique quand on change de date
  React.useEffect(() => {
    const scrollTo7h = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const targetPosition = startHour * 60; // 7h * 60px = 420px
      const containerHeight = container.clientHeight;
      const maxScrollTop = container.scrollHeight - containerHeight;

      const centerOffset = containerHeight / 2;
      const optimalScrollTop = Math.max(
        0,
        Math.min(targetPosition - centerOffset, maxScrollTop)
      );

      container.scrollTop = optimalScrollTop;
      console.log("WeekView auto-scroll to 7h on date change:", {
        optimalScrollTop,
        currentDate: currentDate.toISOString(),
      });
    };

    // Délai pour s'assurer que le DOM est rendu
    const timeoutId = setTimeout(scrollTo7h, 200);
    return () => clearTimeout(timeoutId);
  }, [currentDate, selectedDate]); // Se déclenche quand on change de date

  // Hook pour l'heure actuelle (pour la ligne d'heure actuelle)
  const { currentTime, position } = useCurrentTime();

  // État pour le redimensionnement
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeData, setResizeData] = React.useState<{
    event: CalendarEvent;
    type: "top" | "bottom";
    startY: number;
    startTime: Date;
  } | null>(null);
  const [resizeCooldown, setResizeCooldown] = React.useState(false);
  const [previewEvent, setPreviewEvent] = React.useState<CalendarEvent | null>(
    null
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const [placeholderPosition, setPlaceholderPosition] = React.useState<{
    top: number;
    height: number;
    left: number;
    width: number;
    dayIndex: number;
    color: string;
  } | null>(null);
  const [dragData, setDragData] = React.useState<{
    event: CalendarEvent;
    startY: number;
    startX: number;
    originalStart: Date;
    originalEnd: Date;
    originalDay: Date;
    originalTop: number;
    containerRect: DOMRect | null;
  } | null>(null);
  const [mouseDownData, setMouseDownData] = React.useState<{
    event: CalendarEvent;
    startX: number;
    startY: number;
    timestamp: number;
  } | null>(null);

  const handleTimeSlotClick = (
    date: Date,
    hour: number,
    e: React.MouseEvent
  ) => {
    // Vérifier si un popover vient d'être fermé pour éviter l'ouverture immédiate
    if (typeof window !== "undefined" && (window as any).__popoverJustClosed) {
      return;
    }

    const startDate = new Date(date);
    startDate.setHours(hour, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(hour + 1, 0, 0, 0); // +1 heure par défaut

    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

    onEventCreate(
      startDate,
      startTime,
      endTime,
      e.currentTarget as HTMLElement
    );
  };

  const getEventsForDay = (date: Date) => {
    return getEventsForDate(events, date);
  };

  // Gestionnaires de redimensionnement
  const handleResizeStart = (
    event: CalendarEvent,
    type: "top" | "bottom",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeData({
      event,
      type,
      startY: e.clientY,
      startTime: type === "top" ? event.start : event.end,
    });
  };

  const handleMouseDown = (event: CalendarEvent, e: React.MouseEvent) => {
    // Démarrer le drag seulement si on ne clique pas sur une poignée de redimensionnement
    if (e.target && (e.target as HTMLElement).closest(".resize-handle")) {
      return;
    }

    // Enregistrer les données du mousedown pour détecter si c'est un clic ou un drag
    setMouseDownData({
      event,
      startX: e.clientX,
      startY: e.clientY,
      timestamp: Date.now(),
    });
  };

  const handleDragStart = (
    event: CalendarEvent,
    startX: number,
    startY: number
  ) => {
    setIsDragging(true);

    // Obtenir le conteneur de la grille
    const eventElement = document.querySelector(
      `[data-event-id="${event.id}"]`
    ) as HTMLElement;
    const gridContainer = eventElement?.closest(".grid") as HTMLElement;
    const containerRect = gridContainer?.getBoundingClientRect() || null;

    // Calculer la position top actuelle de l'événement
    const currentPosition = calculateEventPosition(event);

    setDragData({
      event,
      startY,
      startX,
      originalStart: event.start,
      originalEnd: event.end,
      originalDay: new Date(
        event.start.getFullYear(),
        event.start.getMonth(),
        event.start.getDate()
      ),
      originalTop: currentPosition.top,
      containerRect,
    });
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      // Détecter si c'est un drag (mouvement significatif)
      if (mouseDownData && !isDragging && !isResizing) {
        const deltaX = Math.abs(e.clientX - mouseDownData.startX);
        const deltaY = Math.abs(e.clientY - mouseDownData.startY);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Si le mouvement est significatif (> 5px), démarrer le drag
        if (distance > 5) {
          handleDragStart(
            mouseDownData.event,
            mouseDownData.startX,
            mouseDownData.startY
          );
          setMouseDownData(null);
        }
      }

      // Gestion du redimensionnement
      if (isResizing && resizeData) {
        const deltaY = e.clientY - resizeData.startY;
        const newY =
          (resizeData.type === "top"
            ? calculateEventPosition(resizeData.event).top
            : calculateEventPosition(resizeData.event).top +
              calculateEventPosition(resizeData.event).height) + deltaY;

        const newHour = snapToNearestSlot(yToHour(newY), 0.15);
        const newTime = new Date(resizeData.startTime);
        const hours = Math.floor(newHour);
        const minutes = (newHour - hours) * 60;
        newTime.setHours(hours, minutes, 0, 0);

        // Créer un événement de prévisualisation avec les nouvelles heures
        let newStart = new Date(resizeData.event.start);
        let newEnd = new Date(resizeData.event.end);

        if (resizeData.type === "top") {
          newStart = newTime;
        } else {
          newEnd = newTime;
        }

        // Mettre à jour la prévisualisation en temps réel
        setPreviewEvent({
          ...resizeData.event,
          start: newStart,
          end: newEnd,
        });
      }

      // Gestion du drag and drop
      if (isDragging && dragData && dragData.containerRect) {
        // Calculer la position relative par rapport au conteneur
        const relativeX = e.clientX - dragData.containerRect.left;
        const relativeY = e.clientY - dragData.containerRect.top;

        // Calculer la largeur d'une colonne
        const dayWidth = dragData.containerRect.width / 7;

        // Déterminer la colonne (0-6)
        const dayIndex = Math.max(
          0,
          Math.min(6, Math.floor(relativeX / dayWidth))
        );

        // Obtenir la date du jour correspondant
        const newDay = weekDays[dayIndex]?.date || dragData.originalDay;

        // Calculer l'heure basée sur la position Y
        // 60px = 1 heure
        const hourFromTop = relativeY / 60;
        const newHour = Math.max(0, Math.min(23.75, hourFromTop));
        const snappedHour = snapToNearestSlot(newHour, 0.1);

        // Créer la nouvelle heure de début
        const newTime = new Date(newDay);
        const hours = Math.floor(snappedHour);
        const minutes = (snappedHour - hours) * 60;
        newTime.setHours(hours, minutes, 0, 0);

        // Calculer la durée de l'événement
        const duration =
          dragData.originalEnd.getTime() - dragData.originalStart.getTime();
        const newEnd = new Date(newTime.getTime() + duration);

        // Créer un événement temporaire pour calculer la position avec chevauchement
        const tempEvent = {
          ...dragData.event,
          id: `temp-${dragData.event.id}`, // ID unique pour éviter les conflits
          start: newTime,
          end: newEnd,
        };

        // Calculer la position du placeholder en utilisant la même logique que les événements
        // Remplacer temporairement l'événement original par l'événement temporaire
        const dayEvents = getEventsForDate(events, newDay).map((event) =>
          event.id === dragData.event.id ? tempEvent : event
        );
        const eventPositions = calculateEventPositionsWithOverlap(dayEvents);

        // Trouver la position de notre événement temporaire
        let placeholderPos = eventPositions.find(
          (pos) => pos.event.id === tempEvent.id
        );

        // Si pas trouvé, utiliser la position par défaut
        if (!placeholderPos) {
          const { top, height } = calculateEventPosition(tempEvent);
          placeholderPos = {
            event: tempEvent,
            top,
            height: Math.max(height, 20),
            left: 0,
            width: 100,
            column: 0,
            totalColumns: 1,
            overlapLevel: 1,
          };
        }

        // Mettre à jour la prévisualisation en temps réel
        setPreviewEvent(tempEvent);

        // Mettre à jour la position du placeholder
        setPlaceholderPosition({
          top: placeholderPos.top,
          height: placeholderPos.height,
          left: placeholderPos.left,
          width: placeholderPos.width,
          dayIndex,
          color: dragData.event.color,
        });
      }
    },
    [isResizing, resizeData, isDragging, dragData, mouseDownData]
  );

  const handleMouseUp = React.useCallback(
    (e: MouseEvent) => {
      // Gestion des clics (si pas de drag ni de resize)
      if (mouseDownData && !isDragging && !isResizing) {
        const timeDiff = Date.now() - mouseDownData.timestamp;
        const deltaX = Math.abs(e.clientX - mouseDownData.startX);
        const deltaY = Math.abs(e.clientY - mouseDownData.startY);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Clic sur événement désactivé - seul le drag and drop est autorisé

        setMouseDownData(null);
        return;
      }

      // Gestion du redimensionnement
      if (isResizing && resizeData && onEventResize) {
        const deltaY = e.clientY - resizeData.startY;
        const currentPos = calculateEventPosition(resizeData.event);
        const newY =
          (resizeData.type === "top"
            ? currentPos.top
            : currentPos.top + currentPos.height) + deltaY;

        const newHour = snapToNearestSlot(yToHour(newY), 0.15);
        const newTime = new Date(resizeData.startTime);
        const hours = Math.floor(newHour);
        const minutes = (newHour - hours) * 60;
        newTime.setHours(hours, minutes, 0, 0);

        // Calculer les nouvelles heures de début et fin
        let newStart = new Date(resizeData.event.start);
        let newEnd = new Date(resizeData.event.end);

        if (resizeData.type === "top") {
          newStart = newTime;
        } else {
          newEnd = newTime;
        }

        // Appeler le callback de redimensionnement
        onEventResize(resizeData.event.id, newStart, newEnd);

        setIsResizing(false);
        setResizeData(null);
        setPreviewEvent(null); // Nettoyer la prévisualisation

        // Activer le délai de grâce pour éviter les clics accidentels
        setResizeCooldown(true);
        setTimeout(() => {
          setResizeCooldown(false);
        }, 300); // 300ms de délai de grâce
      }

      // Gestion du drag and drop
      if (isDragging && dragData && onEventResize && dragData.containerRect) {
        // Calculer la position relative par rapport au conteneur
        const relativeX = e.clientX - dragData.containerRect.left;
        const relativeY = e.clientY - dragData.containerRect.top;

        // Calculer la largeur d'une colonne
        const dayWidth = dragData.containerRect.width / 7;

        // Déterminer la colonne (0-6)
        const dayIndex = Math.max(
          0,
          Math.min(6, Math.floor(relativeX / dayWidth))
        );

        // Obtenir la date du jour correspondant
        const newDay = weekDays[dayIndex]?.date || dragData.originalDay;

        // Calculer l'heure basée sur la position Y
        // 60px = 1 heure
        const hourFromTop = relativeY / 60;
        const newHour = Math.max(0, Math.min(23.75, hourFromTop));
        const snappedHour = snapToNearestSlot(newHour, 0.1);

        // Créer la nouvelle heure de début
        const newTime = new Date(newDay);
        const hours = Math.floor(snappedHour);
        const minutes = (snappedHour - hours) * 60;
        newTime.setHours(hours, minutes, 0, 0);

        // Calculer la durée de l'événement
        const duration =
          dragData.originalEnd.getTime() - dragData.originalStart.getTime();
        const newEnd = new Date(newTime.getTime() + duration);

        // Appeler le callback de redimensionnement pour déplacer l'événement
        onEventResize(dragData.event.id, newTime, newEnd);

        setIsDragging(false);
        setDragData(null);
        setPreviewEvent(null); // Nettoyer la prévisualisation
        setPlaceholderPosition(null); // Nettoyer le placeholder

        // Activer le délai de grâce pour éviter les clics accidentels
        setResizeCooldown(true);
        setTimeout(() => {
          setResizeCooldown(false);
        }, 300); // 300ms de délai de grâce
      }
    },
    [isResizing, resizeData, isDragging, dragData, onEventResize, mouseDownData]
  );

  // Ajouter les écouteurs d'événements globaux
  React.useEffect(() => {
    if (isResizing || isDragging || mouseDownData) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, isDragging, mouseDownData, handleMouseMove, handleMouseUp]);

  // Algorithme de scroll optimisé et unifié pour 7h
  React.useEffect(() => {
    console.log("WeekView useEffect triggered:", {
      hasContainer: !!scrollContainerRef.current,
      shouldScrollToDefault,
      scrollTriggerValue: scrollTriggerRef?.current,
      currentDate: currentDate.toISOString(),
      selectedDate: selectedDate.toISOString(),
    });

    if (
      !scrollContainerRef.current ||
      (!shouldScrollToDefault && !scrollTriggerRef?.current)
    )
      return;

    const container = scrollContainerRef.current;

    // Fonction pour scroller à 7h de manière optimale
    const scrollToStartHour = () => {
      if (!container) return;

      const targetPosition = startHour * 60; // 7h * 60px = 420px
      const containerHeight = container.clientHeight;
      const maxScrollTop = container.scrollHeight - containerHeight;

      // Calculer la position optimale (centrer 7h dans la vue)
      const centerOffset = containerHeight / 2;
      const optimalScrollTop = Math.max(
        0,
        Math.min(targetPosition - centerOffset, maxScrollTop)
      );

      // Scroll immédiat pour éviter les glitches visuels
      container.scrollTop = optimalScrollTop;

      console.log("WeekView Scroll to 7h:", {
        targetPosition,
        containerHeight,
        maxScrollTop,
        optimalScrollTop,
        scrollHeight: container.scrollHeight,
      });

      // Marquer le scroll comme terminé
      onScrollCompleted?.();
    };

    // Délai pour s'assurer que le DOM est complètement rendu
    const timeoutId = setTimeout(scrollToStartHour, 150);

    return () => clearTimeout(timeoutId);
  }, [
    currentDate,
    selectedDate,
    startHour,
    shouldScrollToDefault,
    scrollTriggerRef?.current,
    onScrollCompleted,
  ]);

  const renderAllDayEventsInHeader = (day: {
    date: Date;
    isToday: boolean;
    isSelected: boolean;
  }) => {
    const allDayEvents = getEventsForDay(day.date).filter(
      (event) => event.allDay
    );

    if (allDayEvents.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {allDayEvents.map((event) => (
          <div
            key={event.id}
            className={clsx(
              "rounded px-2 py-1 text-xs font-medium transition-all cursor-pointer hover:opacity-80 select-none",
              COLOR_CLASSES[event.color]
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onEventClick) {
                onEventClick(event, e.currentTarget as HTMLElement);
              }
            }}
            title={`${event.title} - Toute la journée`}
          >
            {event.title}
          </div>
        ))}
      </div>
    );
  };

  const renderEvent = (event: CalendarEvent, dayIndex: number) => {
    // Utiliser l'événement de prévisualisation s'il existe et correspond à cet événement
    const displayEvent =
      previewEvent && previewEvent.id === event.id ? previewEvent : event;

    // Obtenir tous les événements du jour pour calculer les chevauchements
    const dayEvents = getEventsForDay(weekDays[dayIndex].date);
    const eventPositions = calculateEventPositionsWithOverlap(dayEvents);
    const eventPosition = eventPositions.find(
      (pos) => pos.event.id === displayEvent.id
    );

    if (!eventPosition) {
      // Fallback si l'événement n'est pas trouvé
      const { top, height } = calculateEventPosition(displayEvent);
      return renderEventWithPosition(
        displayEvent,
        top,
        height,
        0,
        100,
        0,
        1,
        1
      );
    }

    const { top, height, left, width, column, totalColumns, overlapLevel } =
      eventPosition;
    return renderEventWithPosition(
      displayEvent,
      top,
      height,
      left,
      width,
      column,
      totalColumns,
      overlapLevel
    );
  };

  const renderEventWithPosition = (
    displayEvent: CalendarEvent,
    top: number,
    height: number,
    left: number,
    width: number,
    column: number,
    totalColumns: number,
    overlapLevel: number
  ) => {
    // Ne pas afficher les événements "toute la journée" dans la grille
    if (displayEvent.allDay) return null;

    // Déterminer le mode d'affichage selon la hauteur
    const isVerySmall = height < 18;
    const isSmall = height < 25;
    const isMedium = height < 35;
    const canResize = height >= 15; // Permettre le redimensionnement même sur les petits événements

    return (
      <div
        key={displayEvent.id}
        data-event-id={displayEvent.id}
        className={clsx(
          "absolute rounded transition-all z-10 overflow-hidden select-none",
          COLOR_CLASSES[displayEvent.color],
          canResize && "group", // Permettre le redimensionnement sur tous les événements
          isResizing && previewEvent && previewEvent.id === displayEvent.id
            ? "cursor-ns-resize opacity-90 ring-2 ring-white/50 shadow-lg"
            : isDragging && previewEvent && previewEvent.id === displayEvent.id
              ? "cursor-grabbing opacity-90 ring-2 ring-blue-400/50 shadow-lg"
              : "cursor-pointer hover:opacity-80",
          // Ajustement du padding selon la taille
          isVerySmall ? "px-1 py-0" : isSmall ? "px-1 py-0.5" : "px-2 py-1",
          // Amélioration des indicateurs de chevauchement
          totalColumns > 1 && "border-2 border-white/30 shadow-lg",
          totalColumns > 2 && "ring-1 ring-white/20",
          totalColumns > 3 && "ring-2 ring-white/30",
          // Espacement intelligent entre les colonnes
          column > 0 && "ml-0.5",
          column === totalColumns - 1 && "mr-0.5",
          // Indicateur de niveau de chevauchement
          overlapLevel > 1 &&
            "before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-white/40 before:rounded-l"
        )}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: `${left}%`,
          width: `${width}%`,
        }}
        onMouseDown={(e) => handleMouseDown(displayEvent, e)}
        title={`${displayEvent.title} - ${formatTime(displayEvent.start)} - ${formatTime(displayEvent.end)}${totalColumns > 1 ? `\n📅 ${totalColumns} événements se chevauchent (position ${column + 1}/${totalColumns})` : ""}${canResize ? "\n🔄 Glissez les bords pour redimensionner\n↔️ Glissez l'événement pour le déplacer" : "\n↔️ Glissez l'événement pour le déplacer"}`}
      >
        {/* Contenu adaptatif selon la taille */}
        {isVerySmall ? (
          // Mode très petit : juste le titre, centré verticalement
          <div className="truncate font-medium text-xs leading-none h-full flex items-center">
            {displayEvent.title}
          </div>
        ) : isSmall ? (
          // Mode petit : titre seulement, centré verticalement
          <div className="h-full flex items-center">
            <div className="truncate font-medium text-xs leading-tight">
              {displayEvent.title}
            </div>
          </div>
        ) : isMedium ? (
          // Mode moyen : titre + heure compacte
          <div className="space-y-0.5 h-full flex flex-col justify-center">
            <div className="truncate font-medium text-xs leading-tight">
              {displayEvent.title}
            </div>
            <div className="text-xs opacity-90 leading-tight truncate">
              {formatTime(displayEvent.start)}-{formatTime(displayEvent.end)}
            </div>
          </div>
        ) : (
          // Mode normal : affichage complet
          <div className="space-y-1 h-full flex flex-col justify-center">
            <div className="truncate font-medium text-xs">
              {displayEvent.title}
            </div>
            <div className="text-xs opacity-90">
              {formatTime(displayEvent.start)} - {formatTime(displayEvent.end)}
            </div>
          </div>
        )}

        {/* Indicateur de chevauchement */}
        {totalColumns > 1 && (
          <div className="absolute top-1 right-1 bg-white/95 dark:bg-black/95 text-xs px-1.5 py-0.5 rounded-full text-gray-700 dark:text-gray-300 font-bold shadow-md border border-white/20">
            {column + 1}/{totalColumns}
          </div>
        )}

        {/* Bouton de modification */}
        <div
          className={`absolute top-1 bg-white/95 dark:bg-black/95 text-xs p-1 rounded-full text-gray-700 dark:text-gray-300 shadow-md border border-white/20 cursor-pointer hover:bg-white dark:hover:bg-black transition-colors opacity-0 group-hover:opacity-100 ${
            totalColumns > 1 ? "left-1" : "right-1"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            // Appeler directement onEventClick si elle existe, sinon créer un événement de modification
            if (typeof onEventClick === "function") {
              onEventClick(displayEvent, e.currentTarget as HTMLElement);
            }
          }}
          title="Modifier l'événement"
        >
          ✏️
        </div>

        {/* Poignées de redimensionnement - disponibles sur tous les événements */}
        {canResize && (
          <>
            <ResizeHandle
              event={displayEvent}
              type="top"
              onResizeStart={handleResizeStart}
            />
            <ResizeHandle
              event={displayEvent}
              type="bottom"
              onResizeStart={handleResizeStart}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* En-têtes des jours - Sticky au top */}
      <div className="sticky top-0 z-30 bg-background border-b border-divider flex-shrink-0">
        <div className="flex">
          {/* Colonne Heure */}
          <div className="w-20 flex-shrink-0 p-3 border-r border-divider bg-default-50 dark:bg-default-900 flex items-center justify-center">
            <span className="text-sm font-medium text-default-700 dark:text-default-200">
              Heure
            </span>
          </div>

          {/* Colonnes des jours */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={clsx(
                  "p-3 text-center border-r border-divider last:border-r-0",
                  "bg-default-50 dark:bg-default-900"
                )}
              >
                <div className="text-sm font-medium text-default-700 dark:text-default-200">
                  {DAYS_OF_WEEK[day.date.getDay()]}
                </div>
                <div
                  className={clsx(
                    "text-lg font-bold mt-1",
                    day.isToday && "text-blue-600 dark:text-blue-400",
                    day.isSelected && "text-blue-600 dark:text-blue-400",
                    !day.isToday &&
                      !day.isSelected &&
                      "text-default-800 dark:text-default-100"
                  )}
                >
                  {day.date.getDate()}
                </div>
                {/* Événements toute la journée intégrés dans le header */}
                {renderAllDayEventsInHeader(day)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grille horaire avec scroll */}
      <div
        ref={scrollContainerRef}
        className="week-view-scroll-container flex-1 overflow-auto min-h-0"
      >
        <div className="flex relative">
          {/* Ligne d'heure actuelle - Positionnée dans le conteneur scrollable */}
          <div
            className="absolute left-20 right-0 z-20 pointer-events-none"
            style={{ top: `${position}px` }}
          >
            <div className="h-0.5 bg-theme-primary shadow-lg" />
            <div className="absolute left-[-6px] w-3 h-3 rounded-full bg-theme-primary -translate-y-1/2" />
          </div>

          {/* Colonne des heures - Sticky */}
          <div className="w-20 flex-shrink-0 border-r border-divider sticky left-0 z-10 bg-default-50 dark:bg-default-900">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-divider p-2 text-xs text-default-600 dark:text-default-200 flex items-center justify-center"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="border-r border-divider last:border-r-0 relative"
              >
                {hours.map((hour) => (
                  <div key={hour} className="h-15 border-b border-divider" />
                ))}

                {/* Événements du jour */}
                <div className="absolute inset-0 pointer-events-none">
                  {getEventsForDay(day.date).map((event) => (
                    <div key={event.id} className="pointer-events-auto">
                      {renderEvent(event, dayIndex)}
                    </div>
                  ))}
                </div>

                {/* Placeholder pour le drag and drop */}
                {placeholderPosition &&
                  placeholderPosition.dayIndex === dayIndex && (
                    <div
                      className={clsx(
                        "absolute pointer-events-none z-20 border-2 border-dashed rounded-md opacity-50",
                        COLOR_CLASSES[
                          placeholderPosition.color as keyof typeof COLOR_CLASSES
                        ]
                      )}
                      style={{
                        top: `${placeholderPosition.top}px`,
                        height: `${placeholderPosition.height}px`,
                        left: `${placeholderPosition.left}%`,
                        width: `${placeholderPosition.width}%`,
                      }}
                    >
                      <div className="flex items-center justify-center h-full text-xs font-medium opacity-75">
                        Déposer ici
                      </div>
                    </div>
                  )}

                {/* Zone cliquable pour les créneaux vides - au-dessus des événements */}
                <div className="absolute inset-0 pointer-events-auto">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className={clsx(
                        "absolute w-full border-b border-divider cursor-pointer transition-colors",
                        "hover:bg-default-100 dark:hover:bg-default-800 opacity-0 hover:opacity-100"
                      )}
                      style={{
                        top: `${hour * 60}px`,
                        height: "60px",
                      }}
                      onClick={(e) => handleTimeSlotClick(day.date, hour, e)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
