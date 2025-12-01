import type {
  QCM,
  QCMFormData,
  Question,
  TaskStatus,
  GenerateFromTextParams,
  GenerateFromDocumentParams,
  QCMStatistics,
} from "../types/enseignant.types";

import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const qcmApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT aux requêtes
qcmApi.interceptors.request.use((config) => {
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
      // Nettoyer le token (enlever les espaces, guillemets, etc.)
      token = token.trim().replace(/^["']|["']$/g, "");
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Intercepteur pour gérer les erreurs
qcmApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 (non autorisé) et pas déjà retenté
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Essayer de rafraîchir le token ou rediriger vers login
      if (typeof window !== "undefined") {
        // Supprimer le token expiré
        document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
        localStorage.removeItem("auth_token");

        // Rediriger vers la page de login
        window.location.href = "/login";

        return Promise.reject(error);
      }
    }

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

export const qcmService = {
  /**
   * Récupère tous les QCMs avec filtres et pagination
   */
  async getQCMs(params?: {
    skip?: number;
    limit?: number;
    status?: "draft" | "published" | "archived";
    matiere?: string;
  }): Promise<{ data: QCM[]; total: number }> {
    const response = await qcmApi.get("/qcm", { params });

    return response.data;
  },

  /**
   * Récupère un QCM par son ID
   */
  async getQCMById(id: string): Promise<QCM> {
    const response = await qcmApi.get(`/qcm/${id}`);

    return response.data;
  },

  /**
   * Crée un nouveau QCM
   */
  async createQCM(data: QCMFormData): Promise<QCM> {
    const response = await qcmApi.post("/qcm", data);

    return response.data;
  },

  /**
   * Met à jour un QCM
   */
  async updateQCM(id: string, data: Partial<QCMFormData>): Promise<QCM> {
    const response = await qcmApi.put(`/qcm/${id}`, data);

    return response.data;
  },

  /**
   * Supprime un QCM
   */
  async deleteQCM(id: string): Promise<void> {
    await qcmApi.delete(`/qcm/${id}`);
  },

  /**
   * Publie un QCM (change le statut en 'published')
   */
  async publishQCM(id: string): Promise<QCM> {
    const response = await qcmApi.patch(`/qcm/${id}/publish`);

    return response.data;
  },

  /**
   * Envoie le QCM à tous les élèves qui suivent la matière
   */
  async envoyerAuxEleves(
    id: string,
  ): Promise<{ qcm_id: string; nombre_etudiants: number; matiere: string }> {
    const response = await qcmApi.post(`/qcm/${id}/envoyer_aux_eleves`, {});

    return response.data;
  },

  /**
   * Récupère les questions d'un QCM
   */
  async getQuestions(
    qcmId: string,
  ): Promise<{ questions: Question[]; total: number }> {
    const response = await qcmApi.get(`/qcm/${qcmId}/questions`);

    return response.data;
  },

  /**
   * Crée une nouvelle question pour un QCM
   */
  async createQuestion(
    qcmId: string,
    data: Partial<Question>,
  ): Promise<Question> {
    const response = await qcmApi.post(`/qcm/${qcmId}/questions`, data);

    return response.data;
  },

  /**
   * Met à jour une question
   */
  async updateQuestion(
    qcmId: string,
    questionId: string,
    data: Partial<Question>,
  ): Promise<Question> {
    const response = await qcmApi.put(
      `/qcm/${qcmId}/questions/${questionId}`,
      data,
    );

    return response.data;
  },

  /**
   * Supprime une question
   */
  async deleteQuestion(qcmId: string, questionId: string): Promise<void> {
    await qcmApi.delete(`/qcm/${qcmId}/questions/${questionId}`);
  },

  /**
   * Génère un QCM à partir de texte brut (asynchrone)
   */
  async generateFromText(params: GenerateFromTextParams): Promise<TaskStatus> {
    const response = await qcmApi.post("/qcm/generate/text", params);

    return response.data;
  },

  /**
   * Génère un QCM à partir d'un document PDF/DOCX (asynchrone)
   */
  async generateFromDocument(
    params: GenerateFromDocumentParams,
  ): Promise<TaskStatus> {
    const response = await qcmApi.post("/qcm/generate/document", params);

    return response.data;
  },

  /**
   * Récupère le statut d'une tâche de génération
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await qcmApi.get(`/qcm/tasks/${taskId}`);

    return response.data;
  },

  /**
   * Convertit un fichier en base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Retirer le préfixe "data:*/*;base64,"
        const base64Content = base64.split(",")[1];

        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });
  },

  /**
   * Génère le lien partageable pour un QCM
   */
  getShareableLink(qcmId: string): string {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/share/qcm/${qcmId}`;
  },

  /**
   * Récupère les statistiques complètes d'un QCM
   */
  async getQCMStatistics(qcmId: string): Promise<QCMStatistics> {
    const response = await qcmApi.get(`/qcm/${qcmId}/statistiques`);

    return response.data;
  },
};
