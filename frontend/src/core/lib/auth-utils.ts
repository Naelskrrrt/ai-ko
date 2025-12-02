/**
 * Utilitaires pour la gestion de l'authentification
 * Compatible avec les modes demo et production
 */

import type { JWTPayload, User, AuthTokens } from "@/core/types/auth";

// ================================================
// STOCKAGE DES TOKENS
// ================================================

const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const USER_STORAGE_KEY = "auth_user";

/**
 * Sauvegarde les tokens dans le localStorage
 */
export function saveTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error saving tokens:", error);
  }
}

/**
 * Récupère le token d'accès
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error getting access token:", error);

    return null;
  }
}

/**
 * Récupère le refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error getting refresh token:", error);

    return null;
  }
}

/**
 * Supprime tous les tokens
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error clearing tokens:", error);
  }
}

// ================================================
// GESTION DE L'UTILISATEUR
// ================================================

/**
 * Sauvegarde l'utilisateur dans le localStorage
 */
export function saveUser(user: User): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error saving user:", error);
  }
}

/**
 * Récupère l'utilisateur depuis le localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);

    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error getting stored user:", error);

    return null;
  }
}

// ================================================
// JWT UTILITIES
// ================================================

/**
 * Décode un token JWT (sans vérification - côté client)
 * ⚠️ À utiliser uniquement pour lire les données, pas pour valider
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));

    return decoded as JWTPayload;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error decoding JWT:", error);

    return null;
  }
}

/**
 * Vérifie si un token JWT est expiré
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    return true;
  }

  // Ajouter une marge de 60 secondes pour éviter les race conditions
  const expirationTime = payload.exp * 1000 - 60000;

  return Date.now() >= expirationTime;
}

/**
 * Calcule le temps restant avant expiration (en millisecondes)
 */
export function getTokenTimeToExpiry(token: string): number {
  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    return 0;
  }

  const expirationTime = payload.exp * 1000;
  const timeLeft = expirationTime - Date.now();

  return Math.max(0, timeLeft);
}

// ================================================
// VALIDATION
// ================================================

/**
 * Vérifie si les credentials sont valides
 */
export function validateLoginCredentials(
  username: string,
  password: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push("Le nom d'utilisateur est requis");
  }

  if (!password || password.length === 0) {
    errors.push("Le mot de passe est requis");
  }

  if (password && password.length < 6) {
    errors.push("Le mot de passe doit contenir au moins 6 caractères");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Vérifie si un email est valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

// ================================================
// HELPERS
// ================================================

/**
 * Formate le token pour l'en-tête Authorization
 */
export function formatAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Extrait le token depuis l'en-tête Authorization
 */
export function extractTokenFromHeader(header: string): string | null {
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.substring(7);
}

/**
 * Génère un ID de session temporaire (pour mode démo)
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
