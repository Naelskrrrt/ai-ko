/**
 * Hook d'authentification unifié - Switch automatique demo/prod
 *
 * Bascule automatiquement entre le mode démo et production
 * selon la variable d'environnement NEXT_PUBLIC_DEMO_MODE
 *
 * MODE DÉMO (NEXT_PUBLIC_DEMO_MODE=true) :
 * - Utilisateur toujours connecté
 * - Pas de backend requis
 * - Parfait pour le développement rapide
 *
 * MODE PRODUCTION (NEXT_PUBLIC_DEMO_MODE=false) :
 * - Authentification JWT complète
 * - Gestion de session réelle
 * - Refresh automatique des tokens
 * - Nécessite un backend
 */

import type { UseAuthReturn } from "@/core/types/auth";

import { useAuthDemo } from "./useAuth.demo";
import { useAuthProduction } from "./useAuth.production";

/**
 * Détermine si on est en mode démo
 */
const isDemoMode = (): boolean => {
  // Par défaut en mode démo si la variable n'est pas définie
  if (typeof process.env.NEXT_PUBLIC_DEMO_MODE === "undefined") {
    return true;
  }

  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
};

/**
 * Hook d'authentification qui switche automatiquement
 * entre demo et production
 */
export function useAuth(): UseAuthReturn {
  const isDemo = isDemoMode();

  // Afficher le mode au premier appel
  if (typeof window !== "undefined" && !window.__authModeLogged) {
    // eslint-disable-next-line no-console
    console.log(
      `🔐 Mode d'authentification : ${isDemo ? "🎭 DÉMO" : "🔒 PRODUCTION"}`,
    );
    window.__authModeLogged = true;
  }

  // Retourner le hook approprié
  if (isDemo) {
    return useAuthDemo();
  }

  return useAuthProduction();
}

// Type augmentation pour window
declare global {
  interface Window {
    __authModeLogged?: boolean;
  }
}

/**
 * Exemple d'utilisation :
 *
 * const {
 *   isAuthenticated,
 *   user,
 *   login,
 *   logout,
 *   isLoggingIn
 * } = useAuth();
 *
 * // Connexion
 * const handleLogin = async (credentials) => {
 *   const success = await login(credentials);
 *   if (!success) {
 *     // Gérer l'erreur
 *   }
 * };
 *
 * // Déconnexion
 * const handleLogout = () => logout();
 *
 * // Vérification
 * if (isAuthenticated) {
 *   console.log("Utilisateur:", user);
 * }
 */
