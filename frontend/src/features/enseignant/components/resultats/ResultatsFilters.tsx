"use client";

import type { ResultatsFilters } from "../../types/enseignant.types";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { DateRangePicker } from "@heroui/date-picker";
import { Slider } from "@heroui/react";
import { Filter, X, RotateCcw } from "lucide-react";
import { useDisclosure } from "@heroui/modal";
import { parseDate, DateValue } from "@internationalized/date";

interface ResultatsFiltersProps {
  filters: ResultatsFilters;
  onFiltersChange: (filters: ResultatsFilters) => void;
  onReset: () => void;
}

export function ResultatsFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
}: ResultatsFiltersProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // État local pour le slider de score
  const [scoreRange, setScoreRange] = React.useState<number[]>([
    filters.scoreMin ?? 0,
    filters.scoreMax ?? 100,
  ]);

  // Synchroniser le slider avec les filtres
  React.useEffect(() => {
    setScoreRange([filters.scoreMin ?? 0, filters.scoreMax ?? 100]);
  }, [filters.scoreMin, filters.scoreMax]);

  // Compter le nombre de filtres actifs
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;

    if (filters.dateDebut || filters.dateFin) count++;
    if (filters.statutPublication && filters.statutPublication !== "tous")
      count++;
    if (filters.scoreMin != null || filters.scoreMax != null) count++;
    if (filters.statutReussite && filters.statutReussite !== "tous") count++;

    return count;
  }, [filters]);

  const handleDateRangeChange = (
    range: { start: DateValue; end: DateValue } | null,
  ) => {
    if (range && range.start && range.end) {
      const dateDebut = `${range.start.year}-${String(range.start.month).padStart(2, "0")}-${String(range.start.day).padStart(2, "0")}`;
      const dateFin = `${range.end.year}-${String(range.end.month).padStart(2, "0")}-${String(range.end.day).padStart(2, "0")}`;

      onFiltersChange({ ...filters, dateDebut, dateFin });
    } else {
      onFiltersChange({ ...filters, dateDebut: null, dateFin: null });
    }
  };

  const handleScoreRangeChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      const [min, max] = value;

      setScoreRange(value);
      onFiltersChange({
        ...filters,
        scoreMin: min === 0 ? null : min,
        scoreMax: max === 100 ? null : max,
      });
    }
  };

  const handleReset = () => {
    setScoreRange([0, 100]);
    onReset();
    onClose();
  };

  const getDateRangeValue = (): { start: DateValue; end: DateValue } | null => {
    if (!filters.dateDebut || !filters.dateFin) return null;

    try {
      const start = parseDate(filters.dateDebut);
      const end = parseDate(filters.dateFin);

      return { start, end };
    } catch {
      return null;
    }
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

          {/* Date de soumission */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Date de soumission
            </label>
            <DateRangePicker
              classNames={{
                base: "w-full",
              }}
              isRequired={false}
              label="Plage de dates"
              // selectorIcon={<Calendar className="w-4 h-4" />}
              size="md"
              value={getDateRangeValue()}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Statut de publication */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Statut de publication
            </label>
            <Select
              selectedKeys={
                filters.statutPublication
                  ? [filters.statutPublication]
                  : ["tous"]
              }
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;

                onFiltersChange({
                  ...filters,
                  statutPublication: selected as
                    | "tous"
                    | "publie"
                    | "non_publie",
                });
              }}
            >
              <SelectItem key="tous">Tous</SelectItem>
              <SelectItem key="publie">Publié</SelectItem>
              <SelectItem key="non_publie">Non publié</SelectItem>
            </Select>
          </div>

          {/* Score (Range) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Score (%)
            </label>
            <Slider
              className="w-full"
              label="Plage de score"
              maxValue={100}
              minValue={0}
              step={1}
              value={scoreRange}
              onChange={handleScoreRangeChange}
            />
            <p className="text-default-500 font-medium text-small">
              Score sélectionné: {scoreRange[0]}% – {scoreRange[1]}%
            </p>
          </div>

          {/* Échoué ou réussi */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Statut
            </label>
            <Select
              selectedKeys={
                filters.statutReussite ? [filters.statutReussite] : ["tous"]
              }
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;

                onFiltersChange({
                  ...filters,
                  statutReussite: selected as "tous" | "reussi" | "echoue",
                });
              }}
            >
              <SelectItem key="tous">Tous</SelectItem>
              <SelectItem key="reussi">Réussi</SelectItem>
              <SelectItem key="echoue">Échoué</SelectItem>
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
