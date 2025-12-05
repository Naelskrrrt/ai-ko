import type {
  EnseignantStats,
  Matiere,
  Niveau,
  Classe,
} from "../types/enseignant.types";

import axios from "axios";

import { addAuthHeader } from "@/shared/lib/auth-token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const enseignantApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT aux requêtes
// Utilise l'utilitaire centralisé qui priorise localStorage (cross-domain compatible)
enseignantApi.interceptors.request.use((config) => addAuthHeader(config));

// Intercepteur pour gérer les erreurs
enseignantApi.interceptors.response.use(
  (response) => response,
  (error) => {
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

export const enseignantService = {
  /**
   * Récupère le profil de l'enseignant connecté
   */
  async getMe(): Promise<any> {
    const response = await enseignantApi.get("/enseignants/me");

    return response.data;
  },

  /**
   * Récupère les statistiques de l'enseignant
   */
  async getStats(enseignantId: string): Promise<EnseignantStats> {
    try {
      const response = await enseignantApi.get(
        `/enseignants/${enseignantId}/statistiques`,
      );

      // Mapper la réponse backend vers le format frontend
      const data = response.data;

      return {
        total_qcms: data.total_qcms || 0,
        qcms_publies: data.qcms_publies || 0,
        qcms_brouillon: data.qcms_brouillon || 0,
        total_sessions: data.total_sessions || 0,
        sessions_actives: data.sessions_actives || 0,
        total_etudiants: data.total_etudiants || 0,
        moyenne_reussite: data.taux_reussite || 0,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur récupération stats enseignant:", error);
      throw error;
    }
  },

  /**
   * Récupère toutes les matières
   */
  async getMatieres(): Promise<Matiere[]> {
    const response = await enseignantApi.get("/matieres");

    return response.data;
  },

  /**
   * Récupère tous les niveaux
   */
  async getNiveaux(): Promise<Niveau[]> {
    const response = await enseignantApi.get("/niveaux");

    return response.data;
  },

  /**
   * Récupère toutes les classes
   */
  async getClasses(params?: { niveauId?: string }): Promise<Classe[]> {
    const response = await enseignantApi.get("/classes", { params });

    return response.data;
  },
};
