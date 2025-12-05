/**
 * Service API pour les Matières
 */
import type {
  Matiere,
  MatiereCreate,
  MatiereUpdate,
} from "../../types/matiere.types";

import axios from "axios";

import { addAuthHeader } from "@/shared/lib/auth-token";

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
// Utilise l'utilitaire centralisé qui priorise localStorage (cross-domain compatible)
matiereApi.interceptors.request.use((config) => addAuthHeader(config));

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
  async createMatiere(data: MatiereCreate): Promise<Matiere> {
    const response = await matiereApi.post("", data);

    return response.data;
  },

  /**
   * Met à jour une matière
   */
  async updateMatiere(id: string, data: MatiereUpdate): Promise<Matiere> {
    const response = await matiereApi.put(`/${id}`, data);

    return response.data;
  },

  /**
   * Supprime une matière
   */
  async deleteMatiere(id: string): Promise<void> {
    await matiereApi.delete(`/${id}`);
  },
};
