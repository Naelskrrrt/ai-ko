/**
 * Service API pour les Parcours
 */
import type {
  Parcours,
  ParcoursCreate,
  ParcoursUpdate,
} from "../../types/parcours.types";

import axios from "axios";

import { addAuthHeader } from "@/shared/lib/auth-token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const parcoursApi = axios.create({
  baseURL: `${API_URL}/api/parcours`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
// Utilise l'utilitaire centralisé qui priorise localStorage (cross-domain compatible)
parcoursApi.interceptors.request.use((config) => addAuthHeader(config));

export const parcoursService = {
  /**
   * Récupère tous les parcours
   */
  async getParcours(actifsSeulement = false): Promise<Parcours[]> {
    const response = await parcoursApi.get("", {
      params: { actifs_seulement: actifsSeulement },
    });

    return response.data;
  },

  /**
   * Récupère un parcours par son ID
   */
  async getParcoursById(id: string): Promise<Parcours> {
    const response = await parcoursApi.get(`/${id}`);

    return response.data;
  },

  /**
   * Crée un nouveau parcours
   */
  async createParcours(data: ParcoursCreate): Promise<Parcours> {
    const response = await parcoursApi.post("", data);

    return response.data;
  },

  /**
   * Met à jour un parcours
   */
  async updateParcours(id: string, data: ParcoursUpdate): Promise<Parcours> {
    const response = await parcoursApi.put(`/${id}`, data);

    return response.data;
  },

  /**
   * Supprime un parcours
   */
  async deleteParcours(id: string): Promise<void> {
    await parcoursApi.delete(`/${id}`);
  },

  /**
   * Récupère les parcours d'une mention
   */
  async getByMention(mentionId: string): Promise<Parcours[]> {
    const response = await parcoursApi.get(`/mention/${mentionId}`);

    return response.data;
  },
};
