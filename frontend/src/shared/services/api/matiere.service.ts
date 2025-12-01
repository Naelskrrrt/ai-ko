/**
 * Service API pour les Matières
 */
import axios from "axios";
import type { Matiere } from "../../types/matiere.types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const matiereApi = axios.create({
  baseURL: `${API_URL}/api/matieres`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
matiereApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    // Si pas dans les cookies, essayer localStorage
    if (!token) {
      token = localStorage.getItem("auth_token") || undefined;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

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
};

