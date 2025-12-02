/**
 * Utilitaires centralisés pour la gestion des fuseaux horaires
 *
 * Ce module fournit des fonctions pour convertir les dates UTC du backend
 * vers l'heure française (Europe/Paris) avec gestion automatique du changement
 * d'heure été/hiver.
 */

import { FRENCH_TIMEZONE_CONFIG } from "../config/timezone";

/**
 * Types pour les options de formatage personnalisées
 */
export interface DateTimeFormatOptions {
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  day?: "numeric" | "2-digit";
  hour?: "numeric" | "2-digit";
  minute?: "numeric" | "2-digit";
  second?: "numeric" | "2-digit";
  weekday?: "long" | "short" | "narrow";
  hour12?: boolean;
}

/**
 * Interface pour le résultat de formatage complet
 */
export interface FormattedDateTime {
  date: string;
  time: string;
  full: string;
}

/**
 * Convertit une date UTC vers l'heure française (Europe/Paris)
 *
 * @param utcDate - Date en UTC (string ISO ou objet Date)
 * @returns Date convertie au fuseau horaire français
 */
export function convertUTCToFrenchTime(utcDate: string | Date): Date {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

  // Vérification de validité de la date
  if (isNaN(date.getTime())) {
    throw new Error(`Date invalide: ${utcDate}`);
  }

  return date; // L'objet Date JavaScript gère automatiquement les fuseaux horaires
}

/**
 * Formate une date en français avec le fuseau horaire Europe/Paris
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @param options - Options de formatage personnalisées
 * @returns Date formatée en français
 */
export function formatFrenchDate(
  date: string | Date,
  options?: Partial<DateTimeFormatOptions>,
): string {
  const dateObj = convertUTCToFrenchTime(date);

  const formatOptions = {
    ...FRENCH_TIMEZONE_CONFIG.defaultDateOptions,
    ...options,
    timeZone: FRENCH_TIMEZONE_CONFIG.timezone,
  };

  return new Intl.DateTimeFormat(
    FRENCH_TIMEZONE_CONFIG.locale,
    formatOptions,
  ).format(dateObj);
}

/**
 * Formate une heure en français avec le fuseau horaire Europe/Paris
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @param options - Options de formatage personnalisées
 * @returns Heure formatée en français
 */
export function formatFrenchTime(
  date: string | Date,
  options?: Partial<DateTimeFormatOptions>,
): string {
  const dateObj = convertUTCToFrenchTime(date);

  const formatOptions = {
    ...FRENCH_TIMEZONE_CONFIG.defaultTimeOptions,
    ...options,
    timeZone: FRENCH_TIMEZONE_CONFIG.timezone,
  };

  return new Intl.DateTimeFormat(
    FRENCH_TIMEZONE_CONFIG.locale,
    formatOptions,
  ).format(dateObj);
}

/**
 * Formate une date et heure complète en français
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @param options - Options de formatage personnalisées
 * @returns Objet contenant date, heure et formatage complet
 */
export function formatFrenchDateTime(
  date: string | Date,
  options?: Partial<DateTimeFormatOptions>,
): FormattedDateTime {
  const dateObj = convertUTCToFrenchTime(date);

  const formatOptions = {
    ...FRENCH_TIMEZONE_CONFIG.defaultDateTimeOptions,
    ...options,
    timeZone: FRENCH_TIMEZONE_CONFIG.timezone,
  };

  const formatter = new Intl.DateTimeFormat(
    FRENCH_TIMEZONE_CONFIG.locale,
    formatOptions,
  );
  const fullFormatted = formatter.format(dateObj);

  // Formatage séparé pour date et heure
  const dateFormatted = formatFrenchDate(date, options);
  const timeFormatted = formatFrenchTime(date, options);

  return {
    date: dateFormatted,
    time: timeFormatted,
    full: fullFormatted,
  };
}

/**
 * Retourne le fuseau horaire français configuré
 *
 * @returns Fuseau horaire 'Europe/Paris'
 */
export function getFrenchTimezone(): string {
  return FRENCH_TIMEZONE_CONFIG.timezone;
}

/**
 * Vérifie si une date donnée est en heure d'été française (DST)
 *
 * @param date - Date à vérifier
 * @returns true si la date est en heure d'été, false sinon
 */
export function isFrenchDST(date: Date): boolean {
  // Créer deux dates de référence pour la même année
  const january = new Date(date.getFullYear(), 0, 1); // 1er janvier
  const july = new Date(date.getFullYear(), 6, 1); // 1er juillet

  // Obtenir les offsets UTC pour ces dates en Europe/Paris
  const januaryOffset = january.getTimezoneOffset();
  const julyOffset = july.getTimezoneOffset();

  // L'heure d'été a un offset plus petit (plus proche de UTC)
  const dstOffset = Math.min(januaryOffset, julyOffset);
  const currentOffset = date.getTimezoneOffset();

  return currentOffset === dstOffset;
}

/**
 * Formate une date avec le nom du jour de la semaine en français
 *
 * @param date - Date à formater
 * @returns Jour de la semaine en français (ex: "lundi")
 */
export function formatFrenchWeekday(date: string | Date): string {
  const dateObj = convertUTCToFrenchTime(date);

  const formatOptions = {
    ...FRENCH_TIMEZONE_CONFIG.weekdayOptions,
    timeZone: FRENCH_TIMEZONE_CONFIG.timezone,
  };

  return new Intl.DateTimeFormat(
    FRENCH_TIMEZONE_CONFIG.locale,
    formatOptions,
  ).format(dateObj);
}

/**
 * Formate une date avec le nom du mois en français
 *
 * @param date - Date à formater
 * @returns Mois et année en français (ex: "janvier 2024")
 */
export function formatFrenchMonth(date: string | Date): string {
  const dateObj = convertUTCToFrenchTime(date);

  const formatOptions = {
    ...FRENCH_TIMEZONE_CONFIG.monthOptions,
    timeZone: FRENCH_TIMEZONE_CONFIG.timezone,
  };

  return new Intl.DateTimeFormat(
    FRENCH_TIMEZONE_CONFIG.locale,
    formatOptions,
  ).format(dateObj);
}

/**
 * Utilitaire pour formater une date avec des options de style prédéfinies
 *
 * @param date - Date à formater
 * @param style - Style de formatage ('short', 'medium', 'long', 'full')
 * @returns Date formatée selon le style choisi
 */
export function formatFrenchDateWithStyle(
  date: string | Date,
  style: "short" | "medium" | "long" | "full" = "medium",
): string {
  const dateObj = convertUTCToFrenchTime(date);

  const formatOptions = {
    dateStyle: style,
    timeZone: FRENCH_TIMEZONE_CONFIG.timezone,
  };

  return new Intl.DateTimeFormat(
    FRENCH_TIMEZONE_CONFIG.locale,
    formatOptions,
  ).format(dateObj);
}

/**
 * Utilitaire pour formater une heure avec des options de style prédéfinies
 *
 * @param date - Date à formater
 * @param style - Style de formatage ('short', 'medium', 'long', 'full')
 * @returns Heure formatée selon le style choisi
 */
export function formatFrenchTimeWithStyle(
  date: string | Date,
  style: "short" | "medium" | "long" | "full" = "short",
): string {
  const dateObj = convertUTCToFrenchTime(date);

  const formatOptions = {
    timeStyle: style,
    timeZone: FRENCH_TIMEZONE_CONFIG.timezone,
  };

  return new Intl.DateTimeFormat(
    FRENCH_TIMEZONE_CONFIG.locale,
    formatOptions,
  ).format(dateObj);
}
