"use client";

import { Clock, AlertTriangle } from "lucide-react";
import { Chip } from "@heroui/chip";

interface ExamTimerProps {
  timeRemaining: number; // en secondes
}

export function ExamTimer({ timeRemaining }: ExamTimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const isCritical = timeRemaining < 60; // Moins d'une minute
  const isWarning = timeRemaining < 300 && !isCritical; // Moins de 5 minutes

  const formatTime = (value: number) => {
    return value.toString().padStart(2, "0");
  };

  const getColor = () => {
    if (isCritical) return "danger";
    if (isWarning) return "warning";

    return "primary";
  };

  const getVariant = () => {
    if (isCritical) return "solid";

    return "flat";
  };

  return (
    <Chip
      classNames={{
        base: isCritical ? "animate-pulse" : "",
        content: "font-mono font-bold text-lg",
      }}
      color={getColor()}
      size="lg"
      startContent={
        isCritical ? (
          <AlertTriangle className="h-5 w-5 animate-pulse" />
        ) : (
          <Clock className="h-5 w-5" />
        )
      }
      variant={getVariant()}
    >
      {formatTime(minutes)}:{formatTime(seconds)}
    </Chip>
  );
}
