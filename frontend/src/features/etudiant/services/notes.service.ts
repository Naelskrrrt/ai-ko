import axios from 'axios'
import type {
  Resultat,
  HistoriqueNotes,
} from '../types/notes.types'
import { transformResultatToResultat } from '../utils/transformers'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const notesApi = axios.create({
  baseURL: `${API_URL}/api/resultats`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT aux requêtes
notesApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Essayer d'abord les cookies
    let token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='))
      ?.split('=')[1]

    // Si pas dans les cookies, essayer localStorage
    if (!token) {
      token = localStorage.getItem('auth_token')
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Intercepteur pour logger les erreurs
notesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas logger les erreurs 404/400 comme des erreurs critiques
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

export const notesService = {
  /**
   * Récupère le résultat d'un examen spécifique
   * examId est l'ID de la session/examen
   */
  async getResultat(examId: string, userId: string): Promise<Resultat> {
    // Utiliser le nouvel endpoint qui récupère par session_id et user_id
    const response = await notesApi.get<any>(
      `/session/${examId}/etudiant?include_details=true`
    )
    return transformResultatToResultat(response.data)
  },

  /**
   * Récupère l'historique complet des notes d'un étudiant
   */
  async getHistorique(userId: string): Promise<HistoriqueNotes> {
    const response = await notesApi.get<HistoriqueNotes>(
      `/etudiant/${userId}/historique`
    )
    return response.data
  },
}
