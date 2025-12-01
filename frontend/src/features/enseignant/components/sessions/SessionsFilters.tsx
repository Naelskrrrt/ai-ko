"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { DateRangePicker } from "@heroui/date-picker";
import { Filter, X, RotateCcw } from "lucide-react";
import { useDisclosure } from "@heroui/modal";
import { parseDate, DateValue } from "@internationalized/date";

interface SessionsFiltersProps {
  filters: {
    dateDebut: string | null;
    dateFin: string | null;
    qcmId: string | null;
    matiere: string | null;
    status: string | null;
  };
  qcmOptions: Array<{ id: string; titre: string }>;
  matiereOptions: Array<string>;
  onFiltersChange: (filters: SessionsFiltersProps["filters"]) => void;
  onReset: () => void;
}

export function SessionsFilters({
  filters,
  qcmOptions,
  matiereOptions,
  onFiltersChange,
  onReset,
}: SessionsFiltersProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Compter le nombre de filtres actifs
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.dateDebut || filters.dateFin) count++;
    if (filters.qcmId && filters.qcmId !== "tous") count++;
    if (filters.matiere && filters.matiere !== "tous") count++;
    if (filters.status && filters.status !== "tous") count++;
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

  const handleReset = () => {
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

          {/* Date de début */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Date de début
            </label>
            <DateRangePicker
              classNames={{
                base: "w-full",
              }}
              isRequired={false}
              label="Plage de dates"
              size="md"
              value={getDateRangeValue()}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* QCM assigné */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              QCM assigné à la session
            </label>
            <Select
              selectedKeys={filters.qcmId ? [filters.qcmId] : ["tous"]}
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  qcmId: selected === "tous" ? null : selected,
                });
              }}
            >
              {[{ id: "tous", titre: "Tous les QCMs" }, ...qcmOptions].map((qcm: { id: string; titre: string }) => (
                <SelectItem key={qcm.id}>{qcm.titre}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Matière */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Matière
            </label>
            <Select
              selectedKeys={filters.matiere ? [filters.matiere] : ["tous"]}
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  matiere: selected === "tous" ? null : selected,
                });
              }}
            >
              {["tous", ...matiereOptions].map((matiere: string) => (
                <SelectItem key={matiere}>{matiere === "tous" ? "Toutes les matières" : matiere}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-default-700">
              Statut
            </label>
            <Select
              selectedKeys={filters.status ? [filters.status] : ["tous"]}
              size="md"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  status: selected === "tous" ? null : selected,
                });
              }}
            >
              <SelectItem key="tous">Tous les statuts</SelectItem>
              <SelectItem key="programmee">Programmée</SelectItem>
              <SelectItem key="en_cours">En cours</SelectItem>
              <SelectItem key="en_pause">En pause</SelectItem>
              <SelectItem key="terminee">Terminée</SelectItem>
              <SelectItem key="annulee">Annulée</SelectItem>
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

