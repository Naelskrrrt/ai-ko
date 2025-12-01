"use client";

import { COLOR_THEMES } from "@/core/types/theme";
import { useColorThemeContext } from "@/components/color-theme-provider";

/**
 * Hook personnalisé pour gérer le thème de couleur de l'application
 * Utilise le contexte ColorThemeProvider pour gérer l'état global
 */
export function useColorTheme() {
  const { colorTheme, setColorTheme, isLoaded } = useColorThemeContext();

  // Obtenir le thème actuel
  const currentTheme = COLOR_THEMES[colorTheme];

  // Obtenir tous les thèmes disponibles
  const availableThemes = Object.values(COLOR_THEMES);

  return {
    colorTheme,
    setColorTheme,
    currentTheme,
    availableThemes,
    isLoaded,
  };
}
