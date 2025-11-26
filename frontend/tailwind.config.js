import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      // Ajouter des variantes de couleurs personnalisées pour le dark mode
      colors: {
        // Couleurs neutres compatibles dark mode
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      // Support des transitions de theme plus lisses
      transitionDuration: {
        300: "300ms",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            // Couleurs de base professionnelles Capt IA
            background: "#0f172a", // Bleu très foncé professionnel
            foreground: "#f1f5f9", // Gris très clair pour le texte
            
            // Les couleurs primaires et secondaires sont gérées dynamiquement
            // par le système de thèmes dans color-theme-provider.tsx
            // Elles utilisent des variables CSS qui changent selon le thème sélectionné
            
            // Success - palette de verts complémentaires
            success: {
              50: "#ecfdf5",
              100: "#d1fae5",
              200: "#a7f3d0",
              300: "#6ee7b7", 
              400: "#34d399",
              500: "#10b981",
              600: "#059669",
              700: "#047857",
              800: "#065f46",
              900: "#064e3b",
              950: "#022c22",
              DEFAULT: "#10b981",
              foreground: "#ffffff",
            },
            
            // Warning - tons ambrés/dorés naturels
            warning: {
              50: "#fffbeb",
              100: "#fef3c7",
              200: "#fde68a",
              300: "#fcd34d",
              400: "#fbbf24",
              500: "#f59e0b",
              600: "#d97706",
              700: "#b45309",
              800: "#92400e",
              900: "#78350f",
              950: "#451a03",
              DEFAULT: "#f59e0b",
              foreground: "#000000",
            },
            
            // Danger - rouge terre naturel
            danger: {
              50: "#fef2f2",
              100: "#fee2e2",
              200: "#fecaca", 
              300: "#fca5a5",
              400: "#f87171",
              500: "#ef4444",
              600: "#dc2626",
              700: "#b91c1c",
              800: "#991b1b",
              900: "#7f1d1d",
              950: "#450a0a",
              DEFAULT: "#dc2626",
              foreground: "#ffffff",
            },
            
            // Couleurs de contenu
            content1: "#111827", // Vert très foncé pour les cartes
            content2: "#1f2937", // Vert foncé moyen 
            content3: "#374151", // Vert foncé clair
            content4: "#4b5563", // Vert grisé
            
            // Bordures et dividers
            divider: "#374151",
            border: "#4b5563",
            
            // Overlay
            overlay: "rgba(10, 15, 10, 0.5)",
            
            // Couleurs par défaut
            default: {
              50: "#f9fafb",
              100: "#f3f4f6",
              200: "#e5e7eb",
              300: "#d1d5db", 
              400: "#9ca3af",
              500: "#6b7280",
              600: "#4b5563",
              700: "#374151",
              800: "#1f2937",
              900: "#111827",
              950: "#030712",
              DEFAULT: "#374151",
              foreground: "#f9fafb",
            },
          },
        },
        light: {
          colors: {
            // Mode clair professionnel Capt IA
            background: "#ffffff", // Blanc pur professionnel
            foreground: "#0f172a", // Texte foncé
            
            // Les couleurs primaires et secondaires sont gérées dynamiquement
            // par le système de thèmes dans color-theme-provider.tsx
            // Elles utilisent des variables CSS qui changent selon le thème sélectionné
            
            // Success - palette de verts complémentaires
            success: {
              50: "#ecfdf5",
              100: "#d1fae5",
              200: "#a7f3d0",
              300: "#6ee7b7",
              400: "#34d399",
              500: "#10b981",
              600: "#059669",
              700: "#047857",
              800: "#065f46",
              900: "#064e3b",
              950: "#022c22",
              DEFAULT: "#10b981",
              foreground: "#ffffff",
            },
            
            // Warning
            warning: {
              50: "#fffbeb",
              100: "#fef3c7",
              200: "#fde68a",
              300: "#fcd34d",
              400: "#fbbf24",
              500: "#f59e0b",
              600: "#d97706",
              700: "#b45309",
              800: "#92400e",
              900: "#78350f",
              950: "#451a03",
              DEFAULT: "#f59e0b",
              foreground: "#000000",
            },
            
            // Danger
            danger: {
              50: "#fef2f2", 
              100: "#fee2e2",
              200: "#fecaca",
              300: "#fca5a5",
              400: "#f87171",
              500: "#ef4444",
              600: "#dc2626",
              700: "#b91c1c",
              800: "#991b1b",
              900: "#7f1d1d",
              950: "#450a0a",
              DEFAULT: "#dc2626",
              foreground: "#ffffff",
            },
            
            // Couleurs de contenu - tons clairs naturels
            content1: "#ffffff",
            content2: "#f8fafc",
            content3: "#f1f5f9", 
            content4: "#e2e8f0",
            
            // Bordures et dividers
            divider: "#e2e8f0",
            border: "#d1d5db",
            
            // Overlay
            overlay: "rgba(0, 0, 0, 0.15)",
            
            // Couleurs par défaut
            default: {
              50: "#f9fafb",
              100: "#f3f4f6",
              200: "#e5e7eb",
              300: "#d1d5db",
              400: "#9ca3af",
              500: "#6b7280",
              600: "#4b5563", 
              700: "#374151",
              800: "#1f2937",
              900: "#111827",
              950: "#030712",
              DEFAULT: "#f1f5f9",
              foreground: "#0f172a",
            },
          },
        },
      },
    }),
  ],
}

export default config;
