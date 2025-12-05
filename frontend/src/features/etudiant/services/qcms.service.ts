import type { QCMDisponible, AccesQCMResponse } from "../types/qcms.types";

import axios from "axios";

import { addAuthHeader } from "@/shared/lib/auth-token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const qcmsApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
// Utilise l'utilitaire centralisé qui priorise localStorage (cross-domain compatible)
qcmsApi.interceptors.request.use((config) => addAuthHeader(config));

// Intercepteur pour logger les erreurs
qcmsApi.interceptors.response.use(
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

export interface Matiere {
  id: string;
  code: string;
  nom: string;
  description?: string;
  couleur?: string;
  icone?: string;
}

export const qcmsService = {
  /**
   * Récupère tous les QCMs disponibles pour l'étudiant
   */
  async getDisponibles(): Promise<QCMDisponible[]> {
    const response = await qcmsApi.get<QCMDisponible[]>(
      "/qcm-etudiant/disponibles",
    );

    return response.data;
  },

  /**
   * Vérifie si l'étudiant peut accéder à un QCM
   */
  async verifierAcces(qcmId: string): Promise<boolean> {
    const response = await qcmsApi.get<AccesQCMResponse>(
      `/qcm-etudiant/${qcmId}/acces`,
    );

    return response.data.canAccess;
  },

  /**
   * Récupère toutes les matières disponibles
   */
  async getMatieresDisponibles(): Promise<Matiere[]> {
    const response = await qcmsApi.get<Matiere[]>("/qcm-etudiant/matieres");

    return response.data;
  },

  /**
   * Récupère les matières suivies par l'étudiant
   */
  async getMesMatieres(): Promise<Matiere[]> {
    const response = await qcmsApi.get<Matiere[]>(
      "/qcm-etudiant/matieres/mes-matieres",
    );

    return response.data;
  },

  /**
   * Met à jour les matières suivies par l'étudiant
   */
  async updateMesMatieres(
    matieresIds: string[],
    anneeScolaire?: string,
  ): Promise<Matiere[]> {
    const response = await qcmsApi.put<Matiere[]>(
      "/qcm-etudiant/matieres/mes-matieres",
      {
        matieres_ids: matieresIds,
        annee_scolaire: anneeScolaire || "2024-2025",
      },
    );

    return response.data;
  },

  /**
   * Récupère un QCM par son ID
   */
  async getQCMById(qcmId: string): Promise<any> {
    const response = await qcmsApi.get(`/qcm-etudiant/${qcmId}`);

    return response.data;
  },

  /**
   * Démarre un QCM libre
   */
  async startQCM(qcmId: string): Promise<{
    questions: any[];
    duree_restante_secondes: number;
    resultat_id: string;
    date_debut: string;
  }> {
    const response = await qcmsApi.post(`/qcm-etudiant/${qcmId}/demarrer`);

    return response.data;
  },

  /**
   * Soumet les réponses d'un QCM libre
   */
  async submitQCM(
    qcmId: string,
    resultatId: string,
    reponses: Record<string, any>,
  ): Promise<{
    resultat_id: string;
    score_total: number;
    score_maximum: number;
    pourcentage: number;
    questions_correctes: number;
    questions_total: number;
  }> {
    const response = await qcmsApi.post(`/qcm-etudiant/${qcmId}/soumettre`, {
      resultat_id: resultatId,
      reponses,
    });

    return response.data;
  },

  /**
   * Récupère le résultat détaillé d'un QCM libre
   */
  async getResultat(resultatId: string): Promise<any> {
    const response = await qcmsApi.get(`/qcm-etudiant/resultat/${resultatId}`);

    return response.data;
  },
};
