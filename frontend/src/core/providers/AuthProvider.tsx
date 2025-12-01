"use client";

import type { User } from "@/shared/types/auth.types";

import React, { createContext, useContext, useEffect, useState } from "react";

import { authService } from "@/shared/services/api/auth.service";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
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
      const userData = await authService.getMe();

      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    // Stocker le token dans un cookie ET localStorage
    if (response.token && typeof document !== "undefined") {
      document.cookie = `auth_token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      localStorage.setItem("auth_token", response.token);
    }
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register({
      name,
      email,
      password,
      confirmPassword: password,
    });

    // Stocker le token dans un cookie ET localStorage
    if (response.token && typeof document !== "undefined") {
      document.cookie = `auth_token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      localStorage.setItem("auth_token", response.token);
    }
    setUser(response.user);
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
      // Toujours supprimer le cookie ET localStorage et réinitialiser l'utilisateur
      if (typeof document !== "undefined") {
        document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
        localStorage.removeItem("auth_token");
      }
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
