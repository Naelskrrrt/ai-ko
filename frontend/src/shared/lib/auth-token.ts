/**
 * Utilitaire centralisé pour la gestion du token d'authentification
 * 
 * IMPORTANT: En production cross-domain (frontend Vercel → backend Railway),
 * les cookies ne sont pas partagés à cause de SameSite policy.
 * On utilise donc localStorage en PRIORITÉ, puis les cookies en fallback.
 */

/**
 * Récupère le token d'authentification
 * Priorité: localStorage > onboarding_token > cookie (pour cross-domain compatibility)
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  // 1. Priorité: localStorage auth_token (fonctionne en cross-domain)
  const localStorageToken = localStorage.getItem("auth_token");
  if (localStorageToken) {
    return localStorageToken;
  }

  // 2. onboarding_token (utilisé pendant l'onboarding)
  const onboardingToken = localStorage.getItem("onboarding_token");
  if (onboardingToken) {
    return onboardingToken;
  }

  // 3. Fallback: cookie auth_token (pour same-domain uniquement)
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
  if (cookieToken) {
    return cookieToken;
  }

  // 4. Fallback: cookie access_token_cookie (Flask-JWT-Extended)
  const flaskCookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token_cookie="))
    ?.split("=")[1];

  return flaskCookieToken || null;
}

/**
 * Stocke le token d'authentification
 * Stocke dans localStorage ET cookie pour compatibilité maximale
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  // Stocker dans localStorage (prioritaire)
  localStorage.setItem("auth_token", token);

  // Stocker aussi dans un cookie (fallback pour same-domain)
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

/**
 * Supprime le token d'authentification
 */
export function removeAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Supprimer de localStorage
  localStorage.removeItem("auth_token");

  // Supprimer le cookie
  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
}

/**
 * Ajoute le header Authorization à une config Axios si un token existe
 */
export function addAuthHeader(config: any): any {
  const token = getAuthToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}
