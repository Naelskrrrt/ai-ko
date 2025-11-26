/**
 * Constantes et configuration du système de layout unifié
 * Valeurs importantes synchronisées avec layout.css
 */

// Pages qui utilisent le layout avec sidebar - désormais importées depuis site.ts
// Ce fichier est maintenu pour la compatibilité mais la source de vérité est siteConfig.sidebarPages

// Types de layout disponibles
export const LAYOUT_TYPES = {
  DEFAULT: "default",
  SIDEBAR: "sidebar",
  AUTH: "auth",
  MINIMAL: "minimal",
} as const;

// Types de content area
export const CONTENT_AREA_TYPES = {
  DASHBOARD: "dashboard",
  SIMPLE: "simple",
  FULLWIDTH: "fullwidth",
  CUSTOM: "custom",
} as const;

// Export des types pour TypeScript
export type LayoutType = (typeof LAYOUT_TYPES)[keyof typeof LAYOUT_TYPES];
export type ContentAreaType =
  (typeof CONTENT_AREA_TYPES)[keyof typeof CONTENT_AREA_TYPES];

export default {
  LAYOUT_TYPES,
  CONTENT_AREA_TYPES,
};
