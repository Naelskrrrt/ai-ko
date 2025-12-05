"use client";

import type { User } from "@/shared/types/auth.types";

import React, { createContext, useContext, useEffect, useState } from "react";

import { authService } from "@/shared/services/api/auth.service";
import {
  setAuthToken,
  removeAuthToken,
} from "@/shared/lib/auth-token";

interface AuthResponse {
  user: User;
  token?: string;
  requiresOnboarding?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      // Ajouter un timeout pour éviter les chargements infinis
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000),
      );

      const userData = (await Promise.race([
        authService.getMe(),
        timeoutPromise,
      ])) as User;

      setUser(userData);
    } catch (_error: any) {
      // Si getMe échoue (401, 403, timeout, erreur réseau, etc.), on considère l'utilisateur comme non connecté
      setUser(null);
      // Nettoyer les tokens invalides avec l'utilitaire centralisé
      removeAuthToken();
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("onboarding_token");
      }
    } finally {
      // Toujours mettre loading à false, même en cas d'erreur
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    const response = await authService.login({ email, password });

    // Stocker le token avec l'utilitaire centralisé
    if (response.token) {
      setAuthToken(response.token);
    }
    setUser(response.user);

    return response;
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register({
      name,
      email,
      password,
      confirmPassword: password,
    });

    // Stocker le token avec l'utilitaire centralisé
    if (response.token) {
      setAuthToken(response.token);
      // Stocker aussi dans onboarding_token pour l'onboarding
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("onboarding_token", response.token);
      }
    }
    setUser(response.user);

    // Retourner la réponse complète pour le parcours d'onboarding
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignorer les erreurs de déconnexion (token expiré, etc.)
      // L'important est de supprimer le token côté client
      // eslint-disable-next-line no-console
      console.warn("Erreur lors de la déconnexion (ignorée):", error);
    } finally {
      // Toujours supprimer les tokens avec l'utilitaire centralisé
      removeAuthToken();
      setUser(null);
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;

    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
