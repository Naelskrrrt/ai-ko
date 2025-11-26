/**
 * Configuration du fuseau horaire français pour l'application Capt IA
 *
 * Cette configuration centralise les paramètres de fuseau horaire pour garantir
 * un affichage cohérent de l'heure française (Europe/Paris) dans toute l'application,
 * avec gestion automatique du changement d'heure été/hiver.
 */

export const FRENCH_TIMEZONE_CONFIG = {
  /** Fuseau horaire français avec gestion automatique été/hiver */
  timezone: "Europe/Paris",

  /** Locale française pour le formatage */
  locale: "fr-FR",

  /** Options par défaut pour le formatage des dates */
  defaultDateOptions: {
    year: "numeric" as const,
    month: "2-digit" as const,
    day: "2-digit" as const,
  },

  /** Options par défaut pour le formatage des heures */
  defaultTimeOptions: {
    hour: "2-digit" as const,
    minute: "2-digit" as const,
    hour12: false, // Format 24h
  },

  /** Options par défaut pour le formatage complet date + heure */
  defaultDateTimeOptions: {
    year: "numeric" as const,
    month: "2-digit" as const,
    day: "2-digit" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
    hour12: false, // Format 24h
  },

  /** Options pour l'affichage des jours de la semaine */
  weekdayOptions: {
    weekday: "long" as const,
  },

  /** Options pour l'affichage des mois */
  monthOptions: {
    month: "long" as const,
    year: "numeric" as const,
  },
} as const;

/**
 * Types dérivés de la configuration
 */
export type FrenchTimezoneConfig = typeof FRENCH_TIMEZONE_CONFIG;
export type DateFormatOptions =
  typeof FRENCH_TIMEZONE_CONFIG.defaultDateOptions;
export type TimeFormatOptions =
  typeof FRENCH_TIMEZONE_CONFIG.defaultTimeOptions;
export type DateTimeFormatOptions =
  typeof FRENCH_TIMEZONE_CONFIG.defaultDateTimeOptions;
