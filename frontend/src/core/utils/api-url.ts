/**
 * Helper pour obtenir l'URL de l'API
 * Détecte automatiquement l'URL du frontend pour fonctionner avec ngrok
 */
export function getApiUrl(): string {
  // Si NEXT_PUBLIC_API_URL est défini explicitement, l'utiliser
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Côté serveur (SSR), utiliser localhost
  if (typeof window === "undefined") {
    return "http://localhost:5000";
  }

  // Côté client : utiliser l'URL actuelle du navigateur
  // Cela fonctionne automatiquement avec ngrok
  return window.location.origin;
}

/**
 * Helper pour obtenir l'URL complète d'un endpoint API
 */
export function getApiEndpoint(path: string): string {
  const baseUrl = getApiUrl();

  // Si l'URL de base est déjà le frontend, utiliser le proxy Next.js
  if (
    baseUrl.includes("localhost:3000") ||
    baseUrl.includes("ngrok-free.dev") ||
    baseUrl.includes("ngrok.io")
  ) {
    return `/api${path}`;
  }

  // Sinon, utiliser l'URL complète
  return `${baseUrl}/api${path}`;
}
