/**
 * Hook d'authentification - MODE PRODUCTION
 *
 * Gestion complète de l'authentification avec JWT et refresh tokens
 * ⚠️ Actuellement mocké - À connecter avec votre API backend
 *
 * Fonctionnalités :
 * - Login/Logout avec JWT
 * - Refresh automatique des tokens
 * - Gestion de session persistante
 * - Protection contre les attaques
 */

"use client";

import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  UseAuthReturn,
  LoginResponse,
  LogoutResponse,
} from "@/core/types/auth";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  saveUser,
  getStoredUser,
  isTokenExpired,
  getTokenTimeToExpiry,
  validateLoginCredentials,
} from "@/core/lib/auth-utils";

/**
 * ⚠️ DONNÉES MOCKÉES - À REMPLACER PAR VOTRE API
 */
const MOCK_USER: User = {
  id: "user_123",
  username: "demo",
  email: "demo@example.com",
  firstName: "Demo",
  lastName: "User",
  role: "admin",
  avatar: undefined,
  createdAt: new Date().toISOString(),
};

const MOCK_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInVzZXJuYW1lIjoiZGVtbyIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY5OTAwMDAwMCwiZXhwIjoxNjk5MDAwOTAwfQ.demo-signature";
const MOCK_REFRESH_TOKEN =
  "refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-refresh";

/**
 * Simule un appel API de login
 * 🔗 À REMPLACER : POST vers /api/auth/login avec votre backend
 */
async function mockLoginAPI(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  // Simulation d'un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Validation basique
  const validation = validateLoginCredentials(
    credentials.username,
    credentials.password,
  );

  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  // ⚠️ EN PRODUCTION : Remplacer par un vrai appel API
  // const response = await fetch('/api/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(credentials)
  // });
  // return response.json();

  // Simulation de credentials invalides
  if (credentials.password === "wrong") {
    throw new Error("Identifiants incorrects");
  }

  return {
    success: true,
    user: MOCK_USER,
    tokens: {
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
      tokenType: "Bearer",
      expiresIn: 900, // 15 minutes
    },
    message: "Connexion réussie",
  };
}

/**
 * Simule un appel API de logout
 * 🔗 À REMPLACER : POST vers /api/auth/logout
 */
async function mockLogoutAPI(): Promise<LogoutResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  // ⚠️ EN PRODUCTION : Remplacer par un vrai appel API
  // const response = await fetch('/api/auth/logout', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${getAccessToken()}`
  //   }
  // });
  // return response.json();

  return {
    success: true,
    message: "Déconnexion réussie",
  };
}

/**
 * Simule un refresh de token
 * 🔗 À REMPLACER : POST vers /api/auth/refresh
 */
async function mockRefreshTokenAPI(): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // ⚠️ EN PRODUCTION : Remplacer par un vrai appel API
  // const response = await fetch('/api/auth/refresh', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ refreshToken })
  // });
  // return response.json();

  return {
    success: true,
    user: MOCK_USER,
    tokens: {
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
      tokenType: "Bearer",
      expiresIn: 900,
    },
  };
}

/**
 * Hook d'authentification production
 */
export function useAuthProduction(): UseAuthReturn {
  const router = useRouter();

  // États
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États de chargement des actions
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  /**
   * Vérifie la session au chargement
   */
  const checkSession = useCallback(async () => {
    try {
      const token = getAccessToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        setIsAuthenticated(false);
        setUser(null);

        return;
      }

      // Vérifier si le token est expiré
      if (isTokenExpired(token)) {
        console.log("Token expired, attempting refresh...");
        const refreshed = await refreshSession();

        if (!refreshed) {
          // Échec du refresh, déconnexion
          clearTokens();
          setIsAuthenticated(false);
          setUser(null);

          return;
        }
      }

      // Session valide
      setIsAuthenticated(true);
      setUser(storedUser);
    } catch (error) {
      console.error("Session check error:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialisation : vérifier la session
   */
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Auto-refresh du token avant expiration
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAccessToken();

    if (!token) return;

    const timeToExpiry = getTokenTimeToExpiry(token);

    // Programmer un refresh 2 minutes avant expiration
    const refreshTime = Math.max(0, timeToExpiry - 120000);

    const refreshTimer = setTimeout(() => {
      console.log("Auto-refreshing token...");
      refreshSession();
    }, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [isAuthenticated, user]);

  /**
   * Login
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      setIsLoggingIn(true);
      setError(null);

      try {
        const response = await mockLoginAPI(credentials);

        if (!response.success || !response.user || !response.tokens) {
          throw new Error(response.message || "Échec de la connexion");
        }

        // Sauvegarder les tokens et l'utilisateur
        saveTokens(response.tokens);
        saveUser(response.user);

        setIsAuthenticated(true);
        setUser(response.user);

        // Redirection selon le rôle
        if (response.user.role === 'admin') {
          router.push("/admin");
        } else {
          // Pour l'instant, seuls les admins ont accès
          router.push("/");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur de connexion";

        setError(errorMessage);
        console.error("Login error:", err);

        return false;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [router],
  );

  /**
   * Register (inscription)
   */
  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<boolean> => {
      setIsRegistering(true);
      setError(null);

      try {
        // ⚠️ À IMPLÉMENTER : Appel API d'inscription
        // const response = await fetch('/api/auth/register', {
        //   method: 'POST',
        //   body: JSON.stringify(credentials)
        // });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock response
        const newUser: User = {
          id: `user_${Date.now()}`,
          username: credentials.username,
          email: credentials.email,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          role: "user",
          createdAt: new Date().toISOString(),
        };

        // Auto-login après inscription
        return await login({
          username: credentials.username,
          password: credentials.password,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur d'inscription";

        setError(errorMessage);

        return false;
      } finally {
        setIsRegistering(false);
      }
    },
    [login],
  );

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoggingOut(true);

    try {
      // Appel API de logout
      await mockLogoutAPI();

      // Nettoyer les tokens et l'état
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);

      // Redirection
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Même en cas d'erreur, on nettoie localement
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  /**
   * Refresh de la session
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await mockRefreshTokenAPI();

      if (!response.success || !response.tokens) {
        return false;
      }

      // Mettre à jour les tokens
      saveTokens(response.tokens);

      if (response.user) {
        saveUser(response.user);
        setUser(response.user);
      }

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);

      return false;
    }
  }, []);

  return {
    // État
    isAuthenticated,
    isLoading,
    user,
    error,

    // Actions
    login,
    register,
    logout,
    refreshSession,

    // États de chargement
    isLoggingIn,
    isLoggingOut,
    isRegistering,
  };
}
