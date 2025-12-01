import type {
  Examen,
  StartExamResponse,
  SubmitExamResponse,
} from "../types/examens.types";

import axios from "axios";

import {
  transformSessionToExamen,
  transformQuestionToQuestion,
} from "../utils/transformers";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const examensApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT aux requêtes
examensApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Essayer d'abord les cookies
    let token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    // Si pas dans les cookies, essayer localStorage
    if (!token) {
      token = localStorage.getItem("auth_token") || undefined;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Intercepteur pour logger les erreurs
examensApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas logger les erreurs 404/400 comme des erreurs critiques
    // (peut être normal si l'endpoint n'existe pas encore ou si userId est invalide)
    if (error.response?.status === 404 || error.response?.status === 400) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ API Warning:", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || "Ressource non trouvée",
      });
    } else {
      // eslint-disable-next-line no-console
      console.error("❌ API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  },
);

export const examensService = {
  /**
   * Récupère tous les examens disponibles pour l'étudiant
   */
  async getAll(userId: string): Promise<Examen[]> {
    // Récupérer les sessions disponibles formatées
    const response = await examensApi.get<any[]>(
      `/sessions/disponibles?format=examen`,
    );

    // Transformer en format Examen[]
    return response.data.map((session) => transformSessionToExamen(session));
  },

  /**
   * Récupère un examen par son ID (sessionId)
   */
  async getById(examId: string): Promise<Examen> {
    const response = await examensApi.get<any>(
      `/sessions/${examId}?format=examen`,
    );

    return transformSessionToExamen(response.data);
  },

  /**
   * Démarre un examen pour l'étudiant
   * Note: examId est en fait le sessionId
   */
  async startExam(examId: string, userId: string): Promise<StartExamResponse> {
    const response = await examensApi.post<any>(`/resultats/demarrer`, {
      sessionId: examId,
    });

    // Le backend retourne déjà le format StartExamResponse
    // Mais on doit s'assurer que les questions sont bien formatées
    const data = response.data;

    // Vérifier que les questions sont présentes
    if (
      !data.questions ||
      !Array.isArray(data.questions) ||
      data.questions.length === 0
    ) {
      // eslint-disable-next-line no-console
      console.error("Aucune question retournée par le backend:", data);
      throw new Error("Aucune question disponible pour cet examen");
    }

    return {
      session_id: data.session_id,
      examen: data.examen,
      duree_restante_secondes: data.duree_restante_secondes,
      date_debut_examen: data.date_debut_examen,
      duree_totale_secondes: data.duree_totale_secondes,
      questions: data.questions.map((q: any) => transformQuestionToQuestion(q)),
      reponses_sauvegardees: data.reponses_sauvegardees || {},
    };
  },

  /**
   * Sauvegarde les réponses de l'étudiant (auto-save)
   * Note: Cette fonctionnalité n'est pas encore implémentée côté backend
   * On peut la laisser vide ou créer un endpoint dédié plus tard
   */
  async saveAnswers(
    examId: string,
    sessionId: string,
    reponses: Record<string, any>,
  ): Promise<void> {
    // TODO: Implémenter un endpoint de sauvegarde automatique si nécessaire
    // Pour l'instant, on ne fait rien car les réponses sont soumises à la fin
    // eslint-disable-next-line no-console
    console.log("Auto-save non implémenté côté backend pour le moment");
  },

  /**
   * Récupère le temps restant pour un examen en cours (calculé côté serveur)
   * Note: examId est en fait le resultatId (session_id retourné par startExam)
   */
  async getTimeRemaining(examId: string): Promise<{
    duree_restante_secondes: number;
    date_debut_examen: string;
    duree_totale_secondes: number;
    temps_ecoule_secondes: number;
  }> {
    const response = await examensApi.get<any>(
      `/resultats/${examId}/temps-restant`,
    );

    return response.data;
  },

  /**
   * Soumet l'examen pour correction
   * Note: examId est en fait le resultatId (session_id retourné par startExam)
   */
  async submitExam(
    examId: string,
    userId: string,
    reponses: Record<string, any>,
    tempsTotal?: number,
  ): Promise<SubmitExamResponse> {
    // examId est en fait le resultatId (session_id du StartExamResponse)
    const response = await examensApi.post<any>(
      `/resultats/${examId}/soumettre`,
      { reponses },
    );

    const data = response.data;

    return {
      resultat_id: data.id,
      message: "Examen soumis avec succès",
      note: data.noteSur20,
      note_max: 20,
      pourcentage: data.pourcentage,
    };
  },
};
