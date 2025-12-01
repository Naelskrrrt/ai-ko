"use client";

import * as React from "react";
import { Input } from "@heroui/input";

interface HoraireSlot {
  debut: string;
  fin: string;
}

interface HorairesInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  label?: string;
  errorMessage?: string;
  isInvalid?: boolean;
}

export function HorairesInput({
  value,
  onChange,
  label = "Horaires de disponibilité",
  errorMessage,
  isInvalid,
}: HorairesInputProps) {
  const [horaire, setHoraire] = React.useState<HoraireSlot>({
    debut: "09:00",
    fin: "17:00",
  });

  // Parser la valeur initiale (format JSON)
  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed) && parsed.length > 0) {
          // Prendre le premier élément si c'est un tableau
          setHoraire(parsed[0]);
        } else if (parsed && typeof parsed === "object") {
          // Si c'est directement un objet
          setHoraire(parsed);
        }
      } catch {
        // Si ce n'est pas du JSON, utiliser les valeurs par défaut
        setHoraire({ debut: "09:00", fin: "17:00" });
      }
    }
  }, [value]);

  const handleChange = (field: keyof HoraireSlot, newValue: string) => {
    const newHoraire = { ...horaire, [field]: newValue };

    setHoraire(newHoraire);
    onChange(JSON.stringify(newHoraire));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-default-500 italic">
        Horaires valables du lundi au vendredi
      </p>

      <div className="flex gap-2 items-start">
        <Input
          label="Début"
          size="sm"
          type="time"
          value={horaire.debut}
          onChange={(e) => handleChange("debut", e.target.value)}
        />

        <Input
          label="Fin"
          size="sm"
          type="time"
          value={horaire.fin}
          onChange={(e) => handleChange("fin", e.target.value)}
        />
      </div>

      {isInvalid && errorMessage && (
        <p className="text-xs text-danger">{errorMessage}</p>
      )}
    </div>
  );
}

