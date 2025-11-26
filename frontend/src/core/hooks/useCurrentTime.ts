"use client";

import React from "react";

export function useCurrentTime() {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Mise à jour chaque minute

    return () => clearInterval(interval);
  }, []);

  // Calculer la position Y en pixels
  // h-15 = 60px en Tailwind, donc chaque heure = 60px
  // Position = (heures * 60 + minutes) / 60 * 60px
  const position =
    ((currentTime.getHours() * 60 + currentTime.getMinutes()) / 60) * 60;

  return { currentTime, position };
}
