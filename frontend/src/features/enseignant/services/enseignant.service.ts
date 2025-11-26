import axios from 'axios'
import type {
  EnseignantStats,
  Matiere,
  Niveau,
  Classe,
} from '../types/enseignant.types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const enseignantApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT aux requêtes
enseignantApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    let token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='))
      ?.split('=')[1]

    if (!token) {
      token = localStorage.getItem('auth_token')
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Intercepteur pour gérer les erreurs
enseignantApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404 || error.response?.status === 400) {
      console.warn('⚠️ API Warning:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || 'Ressource non trouvée',
      })
    } else {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    }
    return Promise.reject(error)
  }
)

export const enseignantService = {
  /**
   * Récupère les statistiques de l'enseignant
   */
  async getStats(userId: string): Promise<EnseignantStats> {
    try {
      // TODO: Implémenter l'endpoint backend /api/enseignant/:id/stats
      // Pour l'instant, retourner des données mock
      return {
        total_qcms: 0,
        qcms_publies: 0,
        qcms_brouillon: 0,
        total_sessions: 0,
        sessions_actives: 0,
        total_etudiants: 0,
        moyenne_reussite: 0,
      }
    } catch (error) {
      console.error('Erreur récupération stats enseignant:', error)
      throw error
    }
  },

  /**
   * Récupère toutes les matières
   */
  async getMatieres(): Promise<Matiere[]> {
    const response = await enseignantApi.get('/matieres')
    return response.data
  },

  /**
   * Récupère tous les niveaux
   */
  async getNiveaux(): Promise<Niveau[]> {
    const response = await enseignantApi.get('/niveaux')
    return response.data
  },

  /**
   * Récupère toutes les classes
   */
  async getClasses(params?: {
    niveauId?: string
  }): Promise<Classe[]> {
    const response = await enseignantApi.get('/classes', { params })
    return response.data
  },
}
