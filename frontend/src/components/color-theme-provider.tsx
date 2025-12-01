"use client";

import { createContext, useContext, useEffect, useState } from "react";

import {
  COLOR_THEMES,
  generateColorPalette,
  type ColorThemeId,
} from "@/core/types/theme";

const COLOR_THEME_STORAGE_KEY = "color-theme";
const DEFAULT_COLOR_THEME: ColorThemeId = "emerald";

interface ColorThemeContextType {
  colorTheme: ColorThemeId;
  setColorTheme: (themeId: ColorThemeId) => void;
  isLoaded: boolean;
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  colorTheme: DEFAULT_COLOR_THEME,
  setColorTheme: () => {},
  isLoaded: false,
});

/**
 * Provider pour gérer le thème de couleur de toute l'application
 * Applique dynamiquement les couleurs aux variables CSS et HeroUI
 */
export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorTheme, setColorThemeState] =
    useState<ColorThemeId>(DEFAULT_COLOR_THEME);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fonction pour appliquer le thème
  const applyColorTheme = (themeId: ColorThemeId) => {
    if (!(themeId in COLOR_THEMES)) return;

    const theme = COLOR_THEMES[themeId];
    const root = document.documentElement;

    // Générer les palettes de couleurs
    const primaryPalette = generateColorPalette(theme.colors.primary);
    const secondaryPalette = generateColorPalette(theme.colors.secondary);
    const accentPalette = theme.colors.accent
      ? generateColorPalette(theme.colors.accent)
      : null;

    // Appliquer les variables CSS principales
    root.style.setProperty("--color-theme-primary", theme.colors.primary);
    root.style.setProperty("--color-theme-secondary", theme.colors.secondary);
    if (theme.colors.accent) {
      root.style.setProperty("--color-theme-accent", theme.colors.accent);
    }

    // Appliquer les palettes complètes pour HeroUI
    // Primary
    Object.entries(primaryPalette).forEach(([key, value]) => {
      if (key === "DEFAULT" || key === "foreground") {
        root.style.setProperty(`--color-theme-primary-${key}`, value);
      } else {
        root.style.setProperty(`--color-theme-primary-${key}`, value);
      }
    });

    // Secondary
    Object.entries(secondaryPalette).forEach(([key, value]) => {
      if (key === "DEFAULT" || key === "foreground") {
        root.style.setProperty(`--color-theme-secondary-${key}`, value);
      } else {
        root.style.setProperty(`--color-theme-secondary-${key}`, value);
      }
    });

    // Accent (si présent)
    if (accentPalette) {
      Object.entries(accentPalette).forEach(([key, value]) => {
        if (key === "DEFAULT" || key === "foreground") {
          root.style.setProperty(`--color-theme-accent-${key}`, value);
        } else {
          root.style.setProperty(`--color-theme-accent-${key}`, value);
        }
      });
    }

    // Appliquer l'attribut data pour le CSS
    root.setAttribute("data-color-theme", themeId);
  };

  // Charger le thème depuis le localStorage au montage
  useEffect(() => {
    const savedTheme = localStorage.getItem(COLOR_THEME_STORAGE_KEY);

    if (savedTheme && savedTheme in COLOR_THEMES) {
      setColorThemeState(savedTheme as ColorThemeId);
      applyColorTheme(savedTheme as ColorThemeId);
    } else {
      applyColorTheme(DEFAULT_COLOR_THEME);
    }
    setIsLoaded(true);
  }, []);

  // Fonction publique pour changer le thème
  const setColorTheme = (themeId: ColorThemeId) => {
    if (themeId in COLOR_THEMES) {
      setColorThemeState(themeId);
      localStorage.setItem(COLOR_THEME_STORAGE_KEY, themeId);
      applyColorTheme(themeId);
    }
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, isLoaded }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte du thème de couleur
 */
export function useColorThemeContext() {
  const context = useContext(ColorThemeContext);

  if (!context) {
    throw new Error(
      "useColorThemeContext must be used within ColorThemeProvider",
    );
  }

  return context;
}
