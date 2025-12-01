"use client";

import type { EleveFilters } from "../../types/eleves.types";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Filter, X, RotateCcw } from "lucide-react";
import { useDisclosure } from "@heroui/modal";
import { DatePicker } from "@heroui/date-picker";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";

interface ElevesFiltersProps {
  filters: EleveFilters;
  matiereOptions: Array<{ id: string; nom: string }>;
  niveauOptions: Array<{ id: string; nom: string }>;
  parcoursOptions: Array<{ id: string; nom: string }>;
  onFiltersChange: (filters: EleveFilters) => void;
  onReset: () => void;
}

export function ElevesFilters({
  filters,
  matiereOptions,
  niveauOptions,
  parcoursOptions,
  onFiltersChange,
  onReset,
}: ElevesFiltersProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Compter le nombre de filtres actifs
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.matiere_id) count++;
    if (filters.niveau_id) count++;
    if (filters.parcours_id) count++;
    if (filters.annee_scolaire) count++;
    return count;
  }, [filters]);

  // Générer les années scolaires (année en cours et 5 années précédentes)
  const anneeScolaireOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options: string[] = [];
    
    // Format: 2024-2025
    for (let i = 0; i < 6; i++) {
      const year = currentYear - i;
      options.push(`${year}-${year + 1}`);
    }
    
    return options;
  }, []);

  // Convertir l'année scolaire en CalendarDate pour le DatePicker
  const getAnneeScolaireValue = (): CalendarDate | null => {
    if (!filters.annee_scolaire) return null;
    
    try {
      // Extraire la première année (ex: "2024-2025" -> 2024)
      const year = parseInt(filters.annee_scolaire.split('-')[0]);
      return new CalendarDate(year, 1, 1);
    } catch {
      return null;
    }
  };

  const handleAnneeScolaireChange = (date: CalendarDate | null) => {
    if (date) {
      // Format: YYYY-YYYY+1
      const anneeScolaire = `${date.year}-${date.year + 1}`;
      onFiltersChange({ ...filters, annee_scolaire: anneeScolaire });
    } else {
      onFiltersChange({ ...filters, annee_scolaire: undefined });
    }
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <Popover
      showArrow
      isOpen={isOpen}
      placement="bottom-start"
      onOpenChange={(open) => (open ? onOpen() : onClose())}
    >
      <PopoverTrigger>
        <Button
          color="default"
          size="sm"
          startContent={<Filter className="w-4 h-4" />}
          variant="flat"
        >
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <div className="p-4 space-y-4 w-96">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filtres</h3>
            <Button isIconOnly size="sm" variant="light" onPress={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Matière */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Matière
            </label>
            <Select
              selectedKeys={filters.matiere_id ? [filters.matiere_id] : []}
              placeholder="Toutes les matières"
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  matiere_id: selected || undefined,
                });
              }}
            >
              {matiereOptions.map((matiere) => (
                <SelectItem key={matiere.id}>{matiere.nom}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Niveau */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Niveau
            </label>
            <Select
              selectedKeys={filters.niveau_id ? [filters.niveau_id] : []}
              placeholder="Tous les niveaux"
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  niveau_id: selected || undefined,
                });
              }}
            >
              {niveauOptions.map((niveau) => (
                <SelectItem key={niveau.id}>{niveau.nom}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Parcours */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Parcours
            </label>
            <Select
              selectedKeys={filters.parcours_id ? [filters.parcours_id] : []}
              placeholder="Tous les parcours"
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  parcours_id: selected || undefined,
                });
              }}
            >
              {parcoursOptions.map((parcours) => (
                <SelectItem key={parcours.id}>{parcours.nom}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Année scolaire */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Année scolaire
            </label>
            <Select
              selectedKeys={filters.annee_scolaire ? [filters.annee_scolaire] : []}
              placeholder="Année en cours"
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  annee_scolaire: selected || undefined,
                });
              }}
            >
              {anneeScolaireOptions.map((annee) => (
                <SelectItem key={annee}>{annee}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Bouton réinitialiser */}
          <div className="flex justify-end pt-2 border-t border-default-200">
            <Button
              color="default"
              size="sm"
              startContent={<RotateCcw className="w-4 h-4" />}
              variant="light"
              onPress={handleReset}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

