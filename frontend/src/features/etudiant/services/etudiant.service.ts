import axios from 'axios'
import type {
  EtudiantStats,
  UpcomingExam,
  RecentResult,
} from '../types/etudiant.types'
import { transformSessionToExamen } from '../utils/transformers'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const etudiantApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT aux requêtes
etudiantApi.interceptors.request.use((config) => {
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
etudiantApi.interceptors.response.use(
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

export const etudiantService = {
  /**
   * Récupère les statistiques de l'étudiant
   */
  async getStats(userId: string): Promise<EtudiantStats> {
    const response = await etudiantApi.get<EtudiantStats>(
      `/resultats/etudiant/${userId}/stats`
    )
    return response.data
  },

  /**
   * Récupère les examens à venir pour l'étudiant
   */
  async getUpcomingExams(userId: string): Promise<UpcomingExam[]> {
    // Récupérer les sessions disponibles formatées
    const response = await etudiantApi.get<any[]>(
      `/sessions/disponibles?format=examen`
    )
    
    // Transformer en format UpcomingExam
    const examens = response.data.map((session) => {
      const examen = transformSessionToExamen(session)
      return {
        id: examen.id,
        titre: examen.titre,
        matiere: examen.matiere,
        date_debut: examen.date_debut,
        date_fin: examen.date_fin,
        duree_minutes: examen.duree_minutes,
        niveau: examen.niveau,
        est_commence: examen.statut === 'en_cours',
        nombre_questions: examen.nombre_questions,
      }
    })
    
    return examens
  },

  /**
   * Récupère les résultats récents de l'étudiant
   */
  async getRecentResults(userId: string): Promise<RecentResult[]> {
    const response = await etudiantApi.get<RecentResult[]>(
      `/resultats/etudiant/${userId}/recent`
    )
    return response.data
  },
}
