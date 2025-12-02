import type { Resultat, HistoriqueNotes } from "../types/notes.types";

import axios from "axios";

import { transformResultatToResultat } from "../utils/transformers";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const notesApi = axios.create({
  baseURL: `${API_URL}/api/resultats`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT aux requêtes
notesApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Essayer d'abord les cookies
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

// Intercepteur pour logger les erreurs
notesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas logger les erreurs 404/400 comme des erreurs critiques
    if (error.response?.status === 404 || error.response?.status === 400) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ API Warning:", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || "Ressource non trouvée",
      });
    } else {
      // eslint-disable-next-line no-console
      console.error("❌ API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  },
);

export const notesService = {
  /**
   * Récupère le résultat d'un examen spécifique
   * examId peut être soit l'ID du résultat, soit l'ID de la session
   */
  async getResultat(examId: string, userId: string): Promise<Resultat> {
    try {
      // D'abord, essayer de récupérer par ID de résultat (cas après soumission)
      const response = await notesApi.get<any>(
        `/${examId}?include_details=true`,
      );

      return transformResultatToResultat(response.data);
    } catch (error: any) {
      // Si erreur 404, c'est probablement un ID de session, essayer par session
      if (error.response?.status === 404) {
        const response = await notesApi.get<any>(
          `/session/${examId}/etudiant?include_details=true`,
        );

        return transformResultatToResultat(response.data);
      }
      throw error;
    }
  },

  /**
   * Récupère l'historique complet des notes d'un étudiant
   */
  async getHistorique(userId: string): Promise<HistoriqueNotes> {
    const response = await notesApi.get<HistoriqueNotes>(
      `/etudiant/${userId}/historique`,
    );

    return response.data;
  },
};
