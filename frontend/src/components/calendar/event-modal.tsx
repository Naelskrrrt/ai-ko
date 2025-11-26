"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Textarea } from "@heroui/input";
import { CalendarEvent, EventColor } from "@/core/types/calendar";
import { useEventForm } from "@/core/hooks/useCalendar";
import { EVENT_COLORS, COLOR_CLASSES } from "@/core/lib/calendar-utils";
import { Calendar, Clock, MapPin, Tag, Palette } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onSave,
  onDelete,
}: EventModalProps) {
  const isEditing = !!event;
  const {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    getEventFromForm,
  } = useEventForm(event);

  // Initialiser le formulaire avec la date et les heures par défaut si fournies
  React.useEffect(() => {
    if (defaultDate && !isEditing) {
      const dateStr = defaultDate.toISOString().split("T")[0];
      updateField("startDate", dateStr);
      updateField("endDate", dateStr);

      // Utiliser les heures par défaut si fournies
      if (defaultStartTime) {
        updateField("startTime", defaultStartTime);
      }
      if (defaultEndTime) {
        updateField("endTime", defaultEndTime);
      }
    }
  }, [defaultDate, defaultStartTime, defaultEndTime, isEditing, updateField]);

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    try {
      const eventData = getEventFromForm();

      if (isEditing && event) {
        // Mise à jour d'un événement existant
        const updatedEvent: CalendarEvent = {
          ...event,
          ...eventData,
          updatedAt: new Date(),
        };
        onSave(updatedEvent);
      } else {
        // Création d'un nouvel événement - on passe seulement les données sans id, createdAt, updatedAt
        onSave(eventData as CalendarEvent);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      resetForm();
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Options pour les catégories
  const categoryOptions = [
    { key: "travail", label: "Travail" },
    { key: "personnel", label: "Personnel" },
    { key: "formation", label: "Formation" },
    { key: "client", label: "Client" },
    { key: "reunion", label: "Réunion" },
    { key: "autre", label: "Autre" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-background",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Modifier l'événement" : "Créer un événement"}
          </h2>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Titre */}
            <Input
              label="Titre"
              placeholder="Nom de l'événement"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              isInvalid={!!errors.title}
              errorMessage={errors.title}
              startContent={<Calendar className="w-4 h-4 text-default-400" />}
              variant="bordered"
            />

            {/* Description */}
            <Textarea
              label="Description"
              placeholder="Description de l'événement (optionnel)"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              minRows={3}
              variant="bordered"
            />

            {/* Toute la journée */}
            <div className="flex items-center gap-3">
              <Switch
                isSelected={formData.allDay}
                onValueChange={(value) => updateField("allDay", value)}
                size="sm"
              />
              <span className="text-sm text-default-600">Toute la journée</span>
            </div>

            {/* Dates et heures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de début */}
              <Input
                label="Date de début"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                isInvalid={!!errors.startDate}
                errorMessage={errors.startDate}
                variant="bordered"
              />

              {/* Heure de début */}
              {!formData.allDay && (
                <Input
                  label="Heure de début"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  startContent={<Clock className="w-4 h-4 text-default-400" />}
                  variant="bordered"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de fin */}
              <Input
                label="Date de fin"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                isInvalid={!!errors.endDate}
                errorMessage={errors.endDate}
                variant="bordered"
              />

              {/* Heure de fin */}
              {!formData.allDay && (
                <Input
                  label="Heure de fin"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateField("endTime", e.target.value)}
                  isInvalid={!!errors.endTime}
                  errorMessage={errors.endTime}
                  startContent={<Clock className="w-4 h-4 text-default-400" />}
                  variant="bordered"
                />
              )}
            </div>

            {/* Localisation */}
            <Input
              label="Localisation"
              placeholder="Lieu de l'événement (optionnel)"
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
              startContent={<MapPin className="w-4 h-4 text-default-400" />}
              variant="bordered"
            />

            {/* Catégorie */}
            <Select
              label="Catégorie"
              placeholder="Sélectionner une catégorie"
              selectedKeys={formData.category ? [formData.category] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                updateField("category", selectedKey);
              }}
              startContent={<Tag className="w-4 h-4 text-default-400" />}
              variant="bordered"
            >
              {categoryOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            {/* Couleur */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-default-400" />
                <span className="text-sm font-medium">Couleur</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateField("color", color)}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${
                        formData.color === color
                          ? "border-foreground scale-110"
                          : "border-default-300 hover:border-default-400"
                      }
                      ${COLOR_CLASSES[color]}
                    `}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-between w-full">
            <div>
              {isEditing && onDelete && (
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleDelete}
                  size="sm"
                >
                  Supprimer
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="light" onPress={handleClose}>
                Annuler
              </Button>
              <Button
                className="bg-theme-primary text-white"
                onPress={handleSave}
                isDisabled={!formData.title.trim()}
              >
                {isEditing ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
