/**
 * Hook d'authentification - MODE DÉMO
 *
 * Version simplifiée pour le développement rapide sans backend
 * L'utilisateur est toujours considéré comme connecté
 *
 * ⚠️ À utiliser uniquement en développement
 * En production, utiliser useAuth.production.ts
 */

"use client";

import type {
  User,
  UseAuthReturn,
  LoginCredentials,
  RegisterCredentials,
} from "@/core/types/auth";

import { useRouter } from "next/navigation";

/**
 * Utilisateur démo par défaut
 */
const DEMO_USER: User = {
  id: "demo_user_123",
  username: "demo_user",
  email: "demo@example.com",
  firstName: "Demo",
  lastName: "User",
  role: "admin",
  avatar: undefined,
  createdAt: new Date().toISOString(),
};

/**
 * Hook d'authentification en mode démo
 * Toutes les opérations sont simulées instantanément
 */
export function useAuthDemo(): UseAuthReturn {
  const router = useRouter();

  return {
    // État - Toujours authentifié en mode démo
    isAuthenticated: true,
    isLoading: false,
    user: DEMO_USER,
    error: null,

    // Actions (simulées)
    login: async (credentials: LoginCredentials) => {
      console.log("🎭 [DEMO MODE] Login simulé avec:", credentials.username);
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/admin");

      return true;
    },

    register: async (credentials: RegisterCredentials) => {
      console.log("🎭 [DEMO MODE] Inscription simulée:", credentials.username);
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/login");

      return true;
    },

    logout: async () => {
      console.log("🎭 [DEMO MODE] Logout simulé");
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/");
    },

    refreshSession: async () => {
      console.log("🎭 [DEMO MODE] Refresh session simulé");

      return true;
    },

    // États de chargement (toujours false en démo)
    isLoggingIn: false,
    isLoggingOut: false,
    isRegistering: false,
  };
}
