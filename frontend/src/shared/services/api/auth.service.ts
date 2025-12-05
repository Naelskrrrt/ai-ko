import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from "../../types/auth.types";

import axios from "axios";

import { addAuthHeader } from "@/shared/lib/auth-token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000, // 10 secondes de timeout
});

// Intercepteur pour ajouter le token JWT aux requêtes
// Utilise l'utilitaire centralisé qui priorise localStorage (cross-domain compatible)
authApi.interceptors.request.use((config) => addAuthHeader(config));

export const authService = {
  async register(data: RegisterCredentials): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>("/register", {
      name: data.name,
      email: data.email,
      password: data.password,
    });

    return response.data;
  },

  async login(data: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>("/login", data);

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await authApi.post("/logout");
    } catch (error: any) {
      // Si le token est expiré ou invalide, on ignore l'erreur
      // car l'objectif est juste de supprimer le cookie côté client
      if (error.response?.status !== 401 && error.response?.status !== 422) {
        throw error;
      }
    }
  },

  async getMe(): Promise<User> {
    const response = await authApi.get<{ user: User }>("/me");

    // Le backend retourne { user: {...}, onboardingComplete: ..., requiresOnboarding: ... }
    // On extrait seulement l'objet user
    return response.data.user;
  },

  async updateMyProfile(data: Partial<User>): Promise<User> {
    const response = await authApi.put<User>("/me", data);

    return response.data;
  },

  async googleOAuth(): Promise<void> {
    window.location.href = `${API_URL}/api/auth/oauth/google`;
  },
};
