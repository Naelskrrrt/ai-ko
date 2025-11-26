"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { CalendarView, CalendarToolbarProps } from "@/core/types/calendar";
import { getPeriodTitle } from "@/core/lib/calendar-utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";

export function CalendarToolbar({
  currentDate,
  selectedDate,
  view,
  onViewChange,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
  onCreateEvent,
  onBusinessView,
}: CalendarToolbarProps) {
  // Pour la vue jour, utiliser selectedDate, sinon utiliser currentDate
  const displayDate = view === "day" ? selectedDate : currentDate;
  const periodTitle = getPeriodTitle(displayDate, view);

  // Hook pour détecter la taille de l'écran de manière sûre côté client
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Vérifier au montage
    checkIsMobile();

    // Écouter les changements de taille
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  const viewOptions = [
    { key: "month", label: "Mois" },
    { key: "week", label: "Semaine" },
    { key: "day", label: "Jour" },
    { key: "agenda", label: "Agenda" },
  ] as const;

  return (
    <div className=" border-b bg-background w-full mx-auto border-divider">
      <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
        {/* Layout principal - responsive */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Section gauche - Titre de la période */}
          <div className="flex items-center gap-2 sm:gap-3">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-theme-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
              {periodTitle}
            </h1>
          </div>

          {/* Section droite - Contrôles */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Navigation temporelle */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={onNavigatePrevious}
                className="hover:bg-default-100 dark:hover:bg-default-50 min-w-8 h-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="light"
                size="sm"
                onPress={onNavigateToday}
                className="hover:bg-default-100 dark:hover:bg-default-50 min-w-16 sm:min-w-20 text-xs sm:text-sm"
              >
                Aujourd'hui
              </Button>

              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={onNavigateNext}
                className="hover:bg-default-100 dark:hover:bg-default-50 min-w-8 h-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Sélecteur de vue - Desktop */}
            <div className="hidden md:block">
              <Tabs
                selectedKey={view}
                onSelectionChange={(key) => onViewChange(key as CalendarView)}
                variant="underlined"
                classNames={{
                  tabList:
                    "gap-4 lg:gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-theme-primary",
                  tab: "max-w-fit px-0 h-10 lg:h-12",
                  tabContent:
                    "group-data-[selected=true]:text-theme-primary text-sm lg:text-base",
                }}
              >
                {viewOptions.map((option) => (
                  <Tab key={option.key} title={option.label} />
                ))}
              </Tabs>
            </div>

            {/* Bouton Vue Business - visible seulement pour les vues semaine et jour */}
            {(view === "week" || view === "day") && onBusinessView && (
              <Button
                startContent={<Clock className="w-4 h-4" />}
                onPress={onBusinessView}
                size="sm"
                variant="bordered"
                className="font-medium w-full sm:w-auto hover:bg-blue-50 dark:hover:bg-blue-900/20"
                isIconOnly={isMobile}
              >
                <span className="xs:hidden">Vue Business</span>
              </Button>
            )}

            {/* Bouton créer événement */}
            <Button
              startContent={<Plus className="w-4 h-4" />}
              onPress={onCreateEvent}
              size="sm"
              className="font-medium w-full sm:w-auto bg-theme-primary text-white"
              isIconOnly={isMobile}
            >
              <span className="xs:hidden">Créer</span>
              {/* <span className="xs:hidden">+</span> */}
            </Button>
          </div>
        </div>

        {/* Sélecteur de vue mobile/tablet */}
        <div className="md:hidden mt-3">
          <Tabs
            selectedKey={view}
            onSelectionChange={(key) => onViewChange(key as CalendarView)}
            variant="bordered"
            classNames={{
              tabList:
                "gap-1 sm:gap-2 w-full relative rounded-lg p-1 bg-default-100 dark:bg-default-50",
              cursor: "w-full bg-background shadow-sm",
              tab: "max-w-fit px-2 sm:px-3 h-7 sm:h-8",
              tabContent:
                "group-data-[selected=true]:text-theme-primary text-xs sm:text-sm",
            }}
          >
            {viewOptions.map((option) => (
              <Tab key={option.key} title={option.label} />
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
