/**
 * Service API pour les Matières
 */
import type { Matiere } from "../../types/matiere.types";

import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const matiereApi = axios.create({
  baseURL: `${API_URL}/api/matieres`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT (optionnel)
matiereApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    // Essayer aussi access_token_cookie (Flask-JWT-Extended)
    if (!token) {
      token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token_cookie="))
        ?.split("=")[1];
    }

    // Si pas dans les cookies, essayer localStorage
    if (!token) {
      token = localStorage.getItem("auth_token") || undefined;
    }

    // Si toujours pas de token, essayer onboarding_token (pendant l'onboarding)
    if (!token) {
      token = localStorage.getItem("onboarding_token") || undefined;
    }

    // Ajouter le token seulement s'il existe (authentification optionnelle)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export interface CreateMatiereData {
  code: string;
  nom: string;
  description?: string;
  coefficient?: number;
  couleur?: string;
  actif?: boolean;
}

export const matiereService = {
  /**
   * Récupère toutes les matières
   */
  async getMatieres(actifsSeulement = false): Promise<Matiere[]> {
    const response = await matiereApi.get("", {
      params: { actifs_seulement: actifsSeulement },
    });

    return response.data;
  },

  /**
   * Récupère une matière par son ID
   */
  async getMatiereById(id: string): Promise<Matiere> {
    const response = await matiereApi.get(`/${id}`);

    return response.data;
  },

  /**
   * Crée une nouvelle matière
   */
  async createMatiere(data: CreateMatiereData): Promise<Matiere> {
    const response = await matiereApi.post("", data);

    return response.data;
  },
};
