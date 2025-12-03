/**
 * Service API pour les Enseignants
 */
import type {
  Enseignant,
  EnseignantWithRelations,
  EnseignantCreate,
  EnseignantUpdate,
  EnseignantsListResponse,
} from "../../types/enseignant.types";

import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const enseignantApi = axios.create({
  baseURL: `${API_URL}/api/enseignants`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
enseignantApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      token = localStorage.getItem("auth_token") || undefined;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export const enseignantService = {
  /**
   * Récupère tous les enseignants (avec pagination)
   */
  async getEnseignants(
    page = 1,
    perPage = 50,
  ): Promise<EnseignantsListResponse> {
    const response = await enseignantApi.get("", {
      params: { page, per_page: perPage },
    });

    return response.data;
  },

  /**
   * Récupère le profil de l'enseignant connecté
   */
  async getMe(
    includeRelations = false,
  ): Promise<Enseignant | EnseignantWithRelations> {
    const response = await enseignantApi.get("/me", {
      params: { include_relations: includeRelations ? "true" : "false" },
    });

    return response.data;
  },

  /**
   * Récupère un enseignant par son ID
   */
  async getEnseignantById(
    id: string,
    includeRelations = false,
  ): Promise<Enseignant | EnseignantWithRelations> {
    const response = await enseignantApi.get(`/${id}`, {
      params: { include_relations: includeRelations ? "true" : "false" },
    });

    return response.data;
  },

  /**
   * Crée un nouvel enseignant
   */
  async createEnseignant(data: EnseignantCreate): Promise<Enseignant> {
    const response = await enseignantApi.post("", data);

    return response.data;
  },

  /**
   * Met à jour un enseignant
   */
  async updateEnseignant(
    id: string,
    data: EnseignantUpdate,
  ): Promise<Enseignant> {
    const response = await enseignantApi.put(`/${id}`, data);

    return response.data;
  },

  /**
   * Supprime un enseignant
   */
  async deleteEnseignant(id: string): Promise<void> {
    await enseignantApi.delete(`/${id}`);
  },

  /**
   * Récupère les matières d'un enseignant
   */
  async getMatieres(enseignantId: string): Promise<any[]> {
    const response = await enseignantApi.get(`/${enseignantId}/matieres`);

    return response.data;
  },

  /**
   * Assigne une matière à un enseignant
   */
  async assignMatiere(enseignantId: string, matiereId: string): Promise<void> {
    await enseignantApi.post(`/${enseignantId}/matieres/${matiereId}`);
  },

  /**
   * Retire une matière d'un enseignant
   */
  async unassignMatiere(
    enseignantId: string,
    matiereId: string,
  ): Promise<void> {
    await enseignantApi.delete(`/${enseignantId}/matieres/${matiereId}`);
  },

  /**
   * Récupère les niveaux d'un enseignant
   */
  async getNiveaux(enseignantId: string): Promise<any[]> {
    const response = await enseignantApi.get(`/${enseignantId}/niveaux`);

    return response.data;
  },

  /**
   * Assigne un niveau à un enseignant
   */
  async assignNiveau(enseignantId: string, niveauId: string): Promise<void> {
    await enseignantApi.post(`/${enseignantId}/niveaux/${niveauId}`);
  },

  /**
   * Récupère les parcours d'un enseignant
   */
  async getParcours(enseignantId: string): Promise<any[]> {
    const response = await enseignantApi.get(`/${enseignantId}/parcours`);

    return response.data;
  },

  /**
   * Assigne un parcours à un enseignant
   */
  async assignParcours(
    enseignantId: string,
    parcoursId: string,
  ): Promise<void> {
    await enseignantApi.post(`/${enseignantId}/parcours/${parcoursId}`);
  },

  /**
   * Récupère les mentions d'un enseignant
   */
  async getMentions(enseignantId: string): Promise<any[]> {
    const response = await enseignantApi.get(`/${enseignantId}/mentions`);

    return response.data;
  },

  /**
   * Récupère les enseignants d'un établissement
   */
  async getByEtablissement(etablissementId: string): Promise<Enseignant[]> {
    const response = await enseignantApi.get(
      `/etablissement/${etablissementId}`,
    );

    return response.data;
  },

  /**
   * Récupère les élèves liés à l'enseignant connecté
   */
  async getMyEtudiants(params: {
    page?: number;
    per_page?: number;
    niveau_id?: string;
    matiere_id?: string;
    parcours_id?: string;
  }): Promise<{ items: any[]; total: number; page: number; per_page: number; total_pages: number }> {
    // Récupérer d'abord l'ID de l'enseignant connecté
    const enseignant = await this.getMe();
    const enseignantId = enseignant.id;

    const response = await enseignantApi.get(`/${enseignantId}/etudiants`, {
      params: {
        page: params.page || 1,
        per_page: params.per_page || 50,
        niveau_id: params.niveau_id,
        matiere_id: params.matiere_id,
        parcours_id: params.parcours_id,
      },
    });

    return response.data;
  },

  /**
   * Exporte les élèves liés à l'enseignant connecté en PDF
   */
  async exportMyEtudiantsPDF(params: {
    niveau_id?: string;
    matiere_id?: string;
    parcours_id?: string;
  }): Promise<Blob> {
    // Récupérer d'abord l'ID de l'enseignant connecté
    const enseignant = await this.getMe();
    const enseignantId = enseignant.id;

    const response = await enseignantApi.get(
      `/${enseignantId}/etudiants/export-pdf`,
      {
        params: {
          niveau_id: params.niveau_id,
          matiere_id: params.matiere_id,
          parcours_id: params.parcours_id,
        },
        responseType: "blob",
      },
    );

    return response.data;
  },
};
