/**
 * Service API pour les Mentions
 */
import axios from 'axios';
import type { Mention, MentionCreate, MentionUpdate } from '../../types/mention.types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const mentionApi = axios.create({
  baseURL: `${API_URL}/api/mentions`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
mentionApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    let token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='))
      ?.split('=')[1];
    
    if (!token) {
      token = localStorage.getItem('auth_token') || undefined;
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const mentionService = {
  /**
   * Récupère toutes les mentions
   */
  async getMentions(activesSeulement = false): Promise<Mention[]> {
    const response = await mentionApi.get('', {
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
    const response = await mentionApi.post('', data);
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

