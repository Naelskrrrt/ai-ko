"use client";

import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Textarea } from "@heroui/input";
import { CalendarEvent, EventColor } from "@/core/types/calendar";
import { useEventForm } from "@/core/hooks/useCalendar";
import { EVENT_COLORS, COLOR_CLASSES } from "@/core/lib/calendar-utils";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Palette,
  Save,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";

interface EventPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  triggerElement?: HTMLElement | null;
}

export function EventPopover({
  isOpen,
  onClose,
  event,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onSave,
  onDelete,
  triggerElement,
}: EventPopoverProps) {
  const isEditing = !!event;
  const {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    getEventFromForm,
  } = useEventForm(event);

  // Initialiser les valeurs par défaut
  React.useEffect(() => {
    if (defaultDate) {
      updateField("startDate", defaultDate.toISOString().split("T")[0]);
      updateField("endDate", defaultDate.toISOString().split("T")[0]);
    }
    if (defaultStartTime) {
      updateField("startTime", defaultStartTime);
    }
    if (defaultEndTime) {
      updateField("endTime", defaultEndTime);
    }
  }, [defaultDate, defaultStartTime, defaultEndTime, updateField]);

  const handleSave = () => {
    if (validateForm()) {
      const eventData = getEventFromForm();
      console.log("Saving event data:", eventData);
      // Créer un objet CalendarEvent complet avec des valeurs par défaut
      const fullEvent: CalendarEvent = {
        ...eventData,
        id: event?.id || `temp-${Date.now()}`, // ID temporaire pour la création
        createdAt: event?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      console.log("Full event object:", fullEvent);
      onSave(fullEvent);
      resetForm();
      onClose();
    } else {
      console.log("Form validation failed:", errors);
    }
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      resetForm();
      onClose();
      setIsClosing(false);
    }, 150); // Délai pour l'animation de fermeture
  };

  // État pour l'animation de fermeture
  const [isClosing, setIsClosing] = React.useState(false);

  // Référence pour le popover
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Détecter les clics en dehors du popover
  React.useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          popoverRef.current &&
          !popoverRef.current.contains(event.target as Node) &&
          triggerElement &&
          !triggerElement.contains(event.target as Node)
        ) {
          // Empêcher la propagation de l'événement pour éviter l'ouverture d'un nouveau popover
          event.stopPropagation();
          event.preventDefault();

          // Fermer le popover
          handleClose();

          // Ajouter un délai pour empêcher l'ouverture d'un nouveau popover
          setTimeout(() => {
            // Marquer temporairement que nous venons de fermer un popover
            (window as any).__popoverJustClosed = true;
            setTimeout(() => {
              (window as any).__popoverJustClosed = false;
            }, 200);
          }, 50);
        }
      };

      // Ajouter un délai pour éviter la fermeture immédiate lors de l'ouverture
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside, true); // Use capture phase
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    }
  }, [isOpen, triggerElement]);

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleClose}
      placement="bottom-start"
      offset={10}
      showArrow
      classNames={{
        content: "p-0 w-fit",
        arrow: "bg-background border-divider",
      }}
    >
      <PopoverTrigger>
        <div
          ref={(el) => {
            if (el && triggerElement) {
              // Copier la position de l'élément trigger
              const rect = triggerElement.getBoundingClientRect();
              el.style.position = "fixed";
              el.style.left = `${rect.left}px`;
              el.style.top = `${rect.top}px`;
              el.style.width = `${rect.width}px`;
              el.style.height = `${rect.height}px`;
              el.style.pointerEvents = "none";
              el.style.zIndex = "1000";
            }
          }}
        />
      </PopoverTrigger>
      <PopoverContent>
        <div
          ref={popoverRef}
          className="p-4 max-w-4xl w-xl space-y-4 rounded-lg bg-background border border-divider shadow-lg"
        >
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-primary" />
              <h3 className="font-semibold text-foreground dark:text-foreground">
                {isEditing ? "Modifier l'événement" : "Nouvel événement"}
              </h3>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleClose}
              className="text-default-500 dark:text-default-400 hover:text-default-700 dark:hover:text-default-200 transition-colors duration-150 hover:bg-default-100 dark:hover:bg-default-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Formulaire */}
          <div className="space-y-3">
            {/* Titre */}
            <Input
              label="Titre"
              placeholder="Nom de l'événement"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              isInvalid={!!errors.title}
              errorMessage={errors.title}
              startContent={
                <Tag className="w-4 h-4 text-default-500 dark:text-default-300" />
              }
              size="sm"
              classNames={{
                input: "bg-default-50 dark:bg-default-100 text-foreground",
                inputWrapper:
                  "bg-default-50 dark:bg-default-800 border-default-200 dark:border-default-300 hover:border-default-300 dark:hover:border-default-400 focus-within:border-theme-primary",
                label: "text-default-700 dark:text-default-300",
              }}
            />

            {/* Date et heures */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                isInvalid={!!errors.startDate}
                errorMessage={errors.startDate}
                startContent={
                  <Calendar className="w-4 h-4 text-default-500 dark:text-default-300" />
                }
                size="sm"
                classNames={{
                  input: "bg-default-50 dark:bg-default-800 text-foreground",
                  inputWrapper:
                    "bg-default-50 dark:bg-default-800 border-default-200 dark:border-default-300 hover:border-default-300 dark:hover:border-default-400 focus-within:border-theme-primary",
                  label: "text-default-700 dark:text-default-300",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Début"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                isInvalid={!!errors.startTime}
                errorMessage={errors.startTime}
                startContent={
                  <Clock className="w-4 h-4 text-default-500 dark:text-default-300" />
                }
                size="sm"
                classNames={{
                  input: "bg-default-50 dark:bg-default-800 text-foreground",
                  inputWrapper:
                    "bg-default-50 dark:bg-default-800 border-default-200 dark:border-default-300 hover:border-default-300 dark:hover:border-default-400 focus-within:border-theme-primary",
                  label: "text-default-700 dark:text-default-300",
                }}
              />
              <Input
                label="Fin"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                isInvalid={!!errors.endTime}
                errorMessage={errors.endTime}
                startContent={
                  <Clock className="w-4 h-4 text-default-500 dark:text-default-300" />
                }
                size="sm"
                classNames={{
                  input: "bg-default-50 dark:bg-default-800 text-foreground",
                  inputWrapper:
                    "bg-default-50 dark:bg-default-800 border-default-200 dark:border-default-300 hover:border-default-300 dark:hover:border-default-400 focus-within:border-theme-primary",
                  label: "text-default-700 dark:text-default-300",
                }}
              />
            </div>

            {/* Toute la journée */}
            <div
              className={clsx(
                "flex items-center justify-between p-3 rounded-lg bg-default-50 dark:bg-default-800 border border-default-200 dark:border-default-300",
                formData.allDay
                  ? "border-theme-primary"
                  : "bg-default-50 dark:bg-default-800"
              )}
            >
              <span
                className="text-sm font-medium text-default-700 dark:text-default-300"
                // className={
                //   formData.allDay
                //     ? "text-default-700 dark:text-default-300"
                //     : "text-default-500 dark:text-default-300"
                // }
              >
                Toute la journée
              </span>
              <Switch
                isSelected={formData.allDay}
                onValueChange={(value) => updateField("allDay", value)}
                size="sm"
                classNames={{
                  wrapper: `${formData.allDay ? "bg-theme-primary" : ""} group-data-[selected=true]:${formData.allDay ? "bg-theme-primary" : ""}`,
                  thumb: "bg-white shadow-md",
                }}
              />
            </div>

            {/* Localisation */}
            <Input
              label="Localisation"
              placeholder="Lieu de l'événement"
              value={formData.location || ""}
              onChange={(e) => updateField("location", e.target.value)}
              startContent={
                <MapPin className="w-4 h-4 text-default-500 dark:text-default-300" />
              }
              size="sm"
              classNames={{
                input: "bg-default-50 dark:bg-default-800 text-foreground",
                inputWrapper:
                  "bg-default-50 dark:bg-default-800 border-default-200 dark:border-default-300 hover:border-default-300 dark:hover:border-default-400 focus-within:border-theme-primary",
                label: "text-default-700 dark:text-default-300",
              }}
            />

            {/* Description */}
            <Textarea
              label="Description"
              placeholder="Description de l'événement"
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              minRows={2}
              maxRows={3}
              size="sm"
              classNames={{
                input: "bg-default-50 dark:bg-default-100 text-foreground",
                inputWrapper:
                  "bg-default-50 dark:bg-default-800 border-default-200 dark:border-default-300 hover:border-default-300 dark:hover:border-default-400 focus-within:border-theme-primary",
                label: "text-default-700 dark:text-default-300",
              }}
            />

            {/* Couleur */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-default-500 dark:text-default-300" />
                <span className="text-sm font-medium text-default-700 dark:text-default-300">
                  Couleur
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={clsx(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      COLOR_CLASSES[color],
                      formData.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    onClick={() => updateField("color", color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-divider">
            <div className="flex gap-2">
              {isEditing && onDelete && (
                <Button
                  color="danger"
                  variant="light"
                  size="sm"
                  startContent={<Trash2 className="w-4 h-4" />}
                  onPress={handleDelete}
                  className="hover:bg-danger-50 dark:hover:bg-danger-900/20 text-danger-600 dark:text-danger-400"
                >
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="light"
                size="sm"
                onPress={handleClose}
                className="transition-all duration-150 hover:bg-default-100 dark:hover:bg-default-800 text-default-700 dark:text-default-300"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                startContent={<Save className="w-4 h-4" />}
                onPress={handleSave}
                className="transition-all duration-150 hover:scale-105 bg-theme-primary text-white hover:bg-theme-primary/90"
              >
                {isEditing ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
