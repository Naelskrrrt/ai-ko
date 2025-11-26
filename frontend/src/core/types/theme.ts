/**
 * Types pour la gestion des thèmes de couleur
 */

export interface ColorTheme {
  id: string;
  name: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  badgeColor: string; // Couleur de la pastille dans la navbar
}

/**
 * Génère une palette complète de couleurs à partir d'une couleur de base
 * Utilisé pour créer les variantes de 50 à 950 pour HeroUI
 */
export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
  DEFAULT: string;
  foreground: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  emerald: {
    id: "emerald",
    name: "Vert Émeraude",
    description: "Thème vert émeraude naturel et apaisant (par défaut)",
    colors: {
      primary: "#059669", // vert émeraude profond
      secondary: "#047857", // vert émeraude foncé
      accent: "#10b981", // vert émeraude
    },
    badgeColor: "#059669",
  },
  redOrange: {
    id: "redOrange",
    name: "Rouge Orangé",
    description: "Thème rouge orangé chaleureux",
    colors: {
      primary: "#ff6347", // tomato
      secondary: "#ff4500", // orangered
      accent: "#ff7f50", // coral
    },
    badgeColor: "#ff6347",
  },
  darkBlue: {
    id: "darkBlue",
    name: "Bleu Indigo",
    description: "Thème bleu indigo profond et élégant",
    colors: {
      primary: "#4f46e5", // indigo profond
      secondary: "#6366f1", // indigo clair
      accent: "#818cf8", // indigo accent
    },
    badgeColor: "#4f46e5",
  },
  hotPink: {
    id: "hotPink",
    name: "Rose Bonbon",
    description: "Thème rose bonbon vif et dynamique",
    colors: {
      primary: "#ec4899", // rose bonbon
      secondary: "#db2777", // rose foncé
      accent: "#f9a8d4", // rose clair
    },
    badgeColor: "#ec4899",
  },
};

export type ColorThemeId = keyof typeof COLOR_THEMES;

/**
 * Génère une palette de couleurs complète pour HeroUI à partir d'une couleur hex
 * Basé sur les besoins de HeroUI (50-950 + DEFAULT + foreground)
 */
export function generateColorPalette(baseColor: string): ColorPalette {
  // Fonction helper pour convertir hex en RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Fonction helper pour convertir RGB en hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);

          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  };

  // Fonction pour éclaircir/assombrir une couleur
  const adjustColor = (
    hex: string,
    percent: number,
  ): string => {
    const { r, g, b } = hexToRgb(hex);

    if (percent > 0) {
      // Éclaircir
      const nr = r + (255 - r) * percent;
      const ng = g + (255 - g) * percent;
      const nb = b + (255 - b) * percent;

      return rgbToHex(nr, ng, nb);
    } else {
      // Assombrir
      const nr = r * (1 + percent);
      const ng = g * (1 + percent);
      const nb = b * (1 + percent);

      return rgbToHex(nr, ng, nb);
    }
  };

  // Calculer la luminosité pour déterminer la couleur du texte
  const getLuminance = (hex: string): number => {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const channel = c / 255;

      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const foregroundColor =
    getLuminance(baseColor) > 0.5 ? "#000000" : "#ffffff";

  return {
    50: adjustColor(baseColor, 0.95),
    100: adjustColor(baseColor, 0.9),
    200: adjustColor(baseColor, 0.75),
    300: adjustColor(baseColor, 0.5),
    400: adjustColor(baseColor, 0.25),
    500: baseColor,
    600: adjustColor(baseColor, -0.15),
    700: adjustColor(baseColor, -0.3),
    800: adjustColor(baseColor, -0.45),
    900: adjustColor(baseColor, -0.6),
    950: adjustColor(baseColor, -0.75),
    DEFAULT: baseColor,
    foreground: foregroundColor,
  };
}
