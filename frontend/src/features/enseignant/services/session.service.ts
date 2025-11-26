import axios from 'axios'
import type {
  SessionExamen,
  SessionFormData,
  ResultatEtudiant,
} from '../types/enseignant.types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const sessionApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT aux requêtes
sessionApi.interceptors.request.use((config) => {
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
sessionApi.interceptors.response.use(
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

/**
 * Convertit un objet camelCase en snake_case pour l'API backend
 */
function convertToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase)
  }

  if (typeof obj !== 'object') {
    return obj
  }

  const converted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Ignorer les valeurs undefined (elles ne seront pas envoyées dans le JSON)
    if (value === undefined) {
      continue
    }

    // Convertir camelCase en snake_case
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    
    // Convertir les dates au format ISO avec timezone si nécessaire
    if ((key === 'dateDebut' || key === 'dateFin') && typeof value === 'string' && value) {
      // Format reçu: YYYY-MM-DDTHH:mm
      // Convertir en format ISO avec timezone (YYYY-MM-DDTHH:mm:00Z)
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        converted[snakeKey] = `${value}:00Z`
      } else {
        // Si déjà au format ISO, utiliser tel quel
        converted[snakeKey] = value
      }
    } else if (key === 'notePassage' && typeof value === 'number' && !isNaN(value)) {
      // Convertir le pourcentage (0-100) en note sur 20 (0-20)
      // Le backend attend une note sur 20, mais le frontend envoie un pourcentage
      converted[snakeKey] = (value / 100) * 20
    } else {
      converted[snakeKey] = convertToSnakeCase(value)
    }
  }
  return converted
}

export const sessionService = {
  /**
   * Récupère toutes les sessions avec filtres et pagination
   */
  async getSessions(params?: {
    skip?: number
    limit?: number
    status?: string
    qcm_id?: string
    classe_id?: string
  }): Promise<{ data: SessionExamen[]; total: number }> {
    const response = await sessionApi.get('/sessions', { params })
    return response.data
  },

  /**
   * Récupère une session par son ID
   */
  async getSessionById(id: string): Promise<SessionExamen> {
    const response = await sessionApi.get(`/sessions/${id}`)
    return response.data
  },

  /**
   * Crée une nouvelle session
   */
  async createSession(data: SessionFormData): Promise<SessionExamen> {
    // Convertir les données de camelCase en snake_case pour le backend
    const convertedData = convertToSnakeCase(data)
    const response = await sessionApi.post('/sessions', convertedData)
    return response.data
  },

  /**
   * Met à jour une session
   */
  async updateSession(id: string, data: Partial<SessionFormData>): Promise<SessionExamen> {
    // Convertir les données de camelCase en snake_case pour le backend
    const convertedData = convertToSnakeCase(data)
    const response = await sessionApi.put(`/sessions/${id}`, convertedData)
    return response.data
  },

  /**
   * Supprime une session
   */
  async deleteSession(id: string): Promise<void> {
    await sessionApi.delete(`/sessions/${id}`)
  },

  /**
   * Démarre une session (change le statut en 'en_cours')
   */
  async demarrerSession(id: string): Promise<SessionExamen> {
    const response = await sessionApi.patch(`/sessions/${id}/demarrer`)
    return response.data
  },

  /**
   * Termine une session (change le statut en 'terminee')
   */
  async terminerSession(id: string): Promise<SessionExamen> {
    const response = await sessionApi.patch(`/sessions/${id}/terminer`)
    return response.data
  },

  /**
   * Récupère les résultats d'une session
   */
  async getResultatsSession(sessionId: string): Promise<ResultatEtudiant[]> {
    const response = await sessionApi.get(`/resultats/session/${sessionId}`)
    return response.data
  },

  /**
   * Récupère les statistiques d'une session
   */
  async getSessionStatistics(sessionId: string): Promise<{
    nombre_participants: number
    moyenne: number
    note_min: number
    note_max: number
    taux_reussite: number
  }> {
    const response = await sessionApi.get(`/resultats/session/${sessionId}/statistiques`)
    return response.data
  },
}
