/**
 * Service API pour les Étudiants
 */
import type {
  Etudiant,
  EtudiantWithRelations,
  EtudiantCreate,
  EtudiantUpdate,
  EtudiantsListResponse,
} from "../../types/etudiant.types";

import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const etudiantApi = axios.create({
  baseURL: `${API_URL}/api/etudiants`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
etudiantApi.interceptors.request.use((config) => {
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

export const etudiantService = {
  /**
   * Récupère tous les étudiants (avec pagination)
   */
  async getEtudiants(page = 1, perPage = 50): Promise<EtudiantsListResponse> {
    const response = await etudiantApi.get("", {
      params: { page, per_page: perPage },
    });

    return response.data;
  },

  /**
   * Récupère le profil de l'étudiant connecté
   */
  async getMe(): Promise<Etudiant> {
    const response = await etudiantApi.get("/me");

    return response.data;
  },

  /**
   * Récupère un étudiant par son ID
   */
  async getEtudiantById(
    id: string,
    includeRelations = false,
  ): Promise<Etudiant | EtudiantWithRelations> {
    const response = await etudiantApi.get(`/${id}`, {
      params: { include_relations: includeRelations },
    });

    return response.data;
  },

  /**
   * Crée un nouvel étudiant
   */
  async createEtudiant(data: EtudiantCreate): Promise<Etudiant> {
    const response = await etudiantApi.post("", data);

    return response.data;
  },

  /**
   * Met à jour un étudiant
   */
  async updateEtudiant(id: string, data: EtudiantUpdate): Promise<Etudiant> {
    const response = await etudiantApi.put(`/${id}`, data);

    return response.data;
  },

  /**
   * Supprime un étudiant
   */
  async deleteEtudiant(id: string): Promise<void> {
    await etudiantApi.delete(`/${id}`);
  },

  /**
   * Récupère les matières d'un étudiant
   */
  async getMatieres(etudiantId: string): Promise<any[]> {
    const response = await etudiantApi.get(`/${etudiantId}/matieres`);

    return response.data;
  },

  /**
   * Inscrit un étudiant à une matière
   */
  async enrollMatiere(etudiantId: string, matiereId: string): Promise<void> {
    await etudiantApi.post(`/${etudiantId}/matieres/${matiereId}`);
  },

  /**
   * Désinscrit un étudiant d'une matière
   */
  async unenrollMatiere(etudiantId: string, matiereId: string): Promise<void> {
    await etudiantApi.delete(`/${etudiantId}/matieres/${matiereId}`);
  },

  /**
   * Récupère les classes d'un étudiant
   */
  async getClasses(etudiantId: string): Promise<any[]> {
    const response = await etudiantApi.get(`/${etudiantId}/classes`);

    return response.data;
  },

  /**
   * Assigne un étudiant à une classe
   */
  async assignClasse(etudiantId: string, classeId: string): Promise<void> {
    await etudiantApi.post(`/${etudiantId}/classes/${classeId}`);
  },

  /**
   * Récupère les étudiants d'une mention
   */
  async getByMention(mentionId: string): Promise<Etudiant[]> {
    const response = await etudiantApi.get(`/mention/${mentionId}`);

    return response.data;
  },

  /**
   * Récupère les étudiants d'un parcours
   */
  async getByParcours(parcoursId: string): Promise<Etudiant[]> {
    const response = await etudiantApi.get(`/parcours/${parcoursId}`);

    return response.data;
  },

  /**
   * Récupère les étudiants d'un niveau
   */
  async getByNiveau(niveauId: string): Promise<Etudiant[]> {
    const response = await etudiantApi.get(`/niveau/${niveauId}`);

    return response.data;
  },
};


