/**
 * Service API pour les Mentions
 */
import type {
  Mention,
  MentionCreate,
  MentionUpdate,
} from "../../types/mention.types";

import axios from "axios";

import { addAuthHeader } from "@/shared/lib/auth-token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const mentionApi = axios.create({
  baseURL: `${API_URL}/api/mentions`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
// Utilise l'utilitaire centralisé qui priorise localStorage (cross-domain compatible)
mentionApi.interceptors.request.use((config) => addAuthHeader(config));

export const mentionService = {
  /**
   * Récupère toutes les mentions
   */
  async getMentions(activesSeulement = false): Promise<Mention[]> {
    const response = await mentionApi.get("", {
      params: { actives_seulement: activesSeulement },
    });

    return response.data;
  },

  /**
   * Récupère une mention par son ID
   */
  async getMentionById(id: string): Promise<Mention> {
    const response = await mentionApi.get(`/${id}`);

    return response.data;
  },

  /**
   * Crée une nouvelle mention
   */
  async createMention(data: MentionCreate): Promise<Mention> {
    const response = await mentionApi.post("", data);

    return response.data;
  },

  /**
   * Met à jour une mention
   */
  async updateMention(id: string, data: MentionUpdate): Promise<Mention> {
    const response = await mentionApi.put(`/${id}`, data);

    return response.data;
  },

  /**
   * Supprime une mention
   */
  async deleteMention(id: string): Promise<void> {
    await mentionApi.delete(`/${id}`);
  },

  /**
   * Récupère les mentions d'un établissement
   */
  async getByEtablissement(etablissementId: string): Promise<Mention[]> {
    const response = await mentionApi.get(`/etablissement/${etablissementId}`);

    return response.data;
  },
};
