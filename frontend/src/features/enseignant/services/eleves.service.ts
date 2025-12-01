/**
 * Service API pour la gestion des élèves par les enseignants
 */
import axios from 'axios';
import type {
  EleveBase,
  EleveFilters,
  ElevesListResponse,
  EleveDetails,
} from '../types/eleves.types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const enseignantApi = axios.create({
  baseURL: `${API_URL}/api/enseignants`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const etudiantApi = axios.create({
  baseURL: `${API_URL}/api/etudiants`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
const addAuthToken = (config: any) => {
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
};

enseignantApi.interceptors.request.use(addAuthToken);
etudiantApi.interceptors.request.use(addAuthToken);

export const elevesService = {
  /**
   * Récupère les élèves liés à un enseignant
   */
  async getElevesLies(
    enseignantId: string,
    filters?: EleveFilters
  ): Promise<ElevesListResponse> {
    const params: Record<string, any> = {
      page: filters?.page || 1,
      per_page: filters?.per_page || 50,
    };

    if (filters?.matiere_id) {
      params.matiere_id = filters.matiere_id;
    }
    if (filters?.niveau_id) {
      params.niveau_id = filters.niveau_id;
    }
    if (filters?.parcours_id) {
      params.parcours_id = filters.parcours_id;
    }
    if (filters?.mention_id) {
      params.mention_id = filters.mention_id;
    }
    if (filters?.annee_scolaire) {
      params.annee_scolaire = filters.annee_scolaire;
    }

    const response = await enseignantApi.get<ElevesListResponse>(
      `/${enseignantId}/etudiants`,
      { params }
    );
    return response.data;
  },

  /**
   * Récupère les détails complets d'un élève avec évaluations
   */
  async getEleveDetails(eleveId: string): Promise<EleveDetails> {
    const response = await etudiantApi.get<EleveDetails>(
      `/${eleveId}/details-evaluations`
    );
    return response.data;
  },

  /**
   * Exporte les élèves en PDF
   */
  async exportElevesPDF(
    enseignantId: string,
    filters?: EleveFilters
  ): Promise<Blob> {
    const params: Record<string, any> = {};

    if (filters?.matiere_id) {
      params.matiere_id = filters.matiere_id;
    }
    if (filters?.niveau_id) {
      params.niveau_id = filters.niveau_id;
    }
    if (filters?.parcours_id) {
      params.parcours_id = filters.parcours_id;
    }
    if (filters?.mention_id) {
      params.mention_id = filters.mention_id;
    }
    if (filters?.annee_scolaire) {
      params.annee_scolaire = filters.annee_scolaire;
    }

    const response = await enseignantApi.get(
      `/${enseignantId}/etudiants/export-pdf`,
      {
        params,
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

