/**
 * Configuration API générique pour le template frontend
 * À adapter selon les besoins de votre projet
 */

/**
 * Détermine l'URL de base de l'API selon l'environnement
 */
function getBaseURL(): string {
  const environment = process.env.NODE_ENV || "development";

  // En production, utiliser la variable d'environnement
  if (environment === "production" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Côté serveur (SSR/SSG)
  if (typeof window === "undefined") {
    return (
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000"
    );
  }

  // Côté client
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  // Production avec domaine personnalisé
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return process.env.NEXT_PUBLIC_API_URL || `${protocol}//${hostname}/api`;
  }

  // Développement local
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

/**
 * Valide une URL d'API
 */
function validateApiUrl(url: string): boolean {
  try {
    new URL(url);

    return true;
  } catch {
    console.warn(`Invalid API URL: ${url}`);

    return false;
  }
}

const BASE_URL = getBaseURL();

// Validation au chargement
if (!validateApiUrl(BASE_URL)) {
  console.error(`Invalid API configuration. Base URL: ${BASE_URL}`);
}

/**
 * Fonction utilitaire pour diagnostiquer la configuration API
 */
export function getApiDiagnostics() {
  const environment = process.env.NODE_ENV || "development";
  const isServer = typeof window === "undefined";

  return {
    environment,
    isServer,
    baseURL: BASE_URL,
    envVars: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL,
    },
    clientInfo: !isServer
      ? {
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port,
        }
      : null,
    isValidUrl: validateApiUrl(BASE_URL),
  };
}

/**
 * Endpoints API de base - À personnaliser selon votre projet
 */
export const API_ENDPOINTS = {
  // Endpoints système
  root: "/",
  health: "/health",

  // Exemple d'endpoints métier (à adapter)
  // users: "/users",
  // profile: "/profile",
  // settings: "/settings",
} as const;

/**
 * Configuration par défaut pour les requêtes API
 */
export const API_CONFIG = {
  baseURL: BASE_URL,
  timeout: 30000, // 30 secondes
  headers: {
    "Content-Type": "application/json",
  },
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS;
