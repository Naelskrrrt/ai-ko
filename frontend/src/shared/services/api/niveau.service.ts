/**
 * Service API pour les Niveaux
 */
import axios from 'axios';
import type { Niveau } from '../../types/niveau.types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const niveauApi = axios.create({
  baseURL: `${API_URL}/api/niveaux`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
niveauApi.interceptors.request.use((config) => {
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

export const niveauService = {
  /**
   * Récupère tous les niveaux
   */
  async getNiveaux(actifsSeulement = false): Promise<Niveau[]> {
    const response = await niveauApi.get('', {
      params: { actifs_seulement: actifsSeulement ? 'true' : 'false' },
    });
    return response.data;
  },

  /**
   * Récupère un niveau par son ID
   */
  async getNiveauById(id: string): Promise<Niveau> {
    const response = await niveauApi.get(`/${id}`);
    return response.data;
  },
};

