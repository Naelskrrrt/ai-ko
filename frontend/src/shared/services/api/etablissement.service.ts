/**
 * Service API pour les Établissements
 */
import type {
  Etablissement,
  EtablissementCreate,
  EtablissementUpdate,
} from "../../types/etablissement.types";

import axios from "axios";

import { addAuthHeader } from "@/shared/lib/auth-token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const etablissementApi = axios.create({
  baseURL: `${API_URL}/api/etablissements`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
// Utilise l'utilitaire centralisé qui priorise localStorage (cross-domain compatible)
etablissementApi.interceptors.request.use((config) => addAuthHeader(config));

export const etablissementService = {
  /**
   * Récupère tous les établissements
   */
  async getEtablissements(actifsSeulement = false): Promise<Etablissement[]> {
    const response = await etablissementApi.get("", {
      params: { actifs_seulement: actifsSeulement },
    });

    return response.data;
  },

  /**
   * Récupère un établissement par son ID
   */
  async getEtablissementById(id: string): Promise<Etablissement> {
    const response = await etablissementApi.get(`/${id}`);

    return response.data;
  },

  /**
   * Crée un nouvel établissement
   */
  async createEtablissement(data: EtablissementCreate): Promise<Etablissement> {
    const response = await etablissementApi.post("", data);

    return response.data;
  },

  /**
   * Met à jour un établissement
   */
  async updateEtablissement(
    id: string,
    data: EtablissementUpdate,
  ): Promise<Etablissement> {
    const response = await etablissementApi.put(`/${id}`, data);

    return response.data;
  },

  /**
   * Supprime un établissement
   */
  async deleteEtablissement(id: string): Promise<void> {
    await etablissementApi.delete(`/${id}`);
  },

  /**
   * Récupère les établissements par type
   */
  async getByType(
    type: "université" | "école" | "institut",
  ): Promise<Etablissement[]> {
    const response = await etablissementApi.get(`/type/${type}`);

    return response.data;
  },
};
