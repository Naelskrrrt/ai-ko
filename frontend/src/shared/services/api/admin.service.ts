import type {
  User,
  UserCreate,
  UserUpdate,
  PaginatedResponse,
  DashboardStats,
  UsersFilters,
  Etudiant,
  EtudiantCreate,
  EtudiantUpdate,
  Professeur,
  ProfesseurCreate,
  ProfesseurUpdate,
  AIModelConfig,
  AIModelConfigCreate,
  AIModelConfigUpdate,
  UrgentAction,
} from "../../types/admin.types";

import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT aux requêtes
adminApi.interceptors.request.use((config) => {
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

    // eslint-disable-next-line no-console
    console.log("🔑 Request interceptor:", {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenSource: token
        ? document.cookie.includes("auth_token=")
          ? "cookie"
          : "localStorage"
        : "none",
      token: token ? `${token.substring(0, 20)}...` : "none",
      allCookies: document.cookie,
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // eslint-disable-next-line no-console
      console.warn("⚠️ No auth token found in cookies OR localStorage");
      // eslint-disable-next-line no-console
      console.warn("Available cookies:", document.cookie);
      // eslint-disable-next-line no-console
      console.warn("LocalStorage keys:", Object.keys(localStorage));
    }
  }

  return config;
});

// Intercepteur pour logger les erreurs
adminApi.interceptors.response.use(
  (response) => {
    // eslint-disable-next-line no-console
    console.log("✅ API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });

    return response;
  },
  (error) => {
    // eslint-disable-next-line no-console
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  },
);

export const adminService = {
  // Utilisateurs
  async getUsers(params: UsersFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await adminApi.get<{ users: User[]; pagination: any }>(
      "/users",
      {
        params,
      },
    );

    return {
      data: response.data.users,
      pagination: response.data.pagination,
    };
  },

  async getUserById(id: string): Promise<User> {
    const response = await adminApi.get<User>(`/users/${id}`);

    return response.data;
  },

  async createUser(data: UserCreate): Promise<User> {
    const response = await adminApi.post<User>("/users", data);

    return response.data;
  },

  async updateUser(id: string, data: UserUpdate): Promise<User> {
    // Convertir emailVerified (camelCase) en email_verified (snake_case) pour le backend
    const backendData: any = { ...data };

    if ("emailVerified" in backendData) {
      backendData.email_verified = backendData.emailVerified;
      delete backendData.emailVerified;
    }
    // Ne pas envoyer role dans la mise à jour (géré séparément via changeUserRole)
    delete backendData.role;

    const response = await adminApi.put<User>(`/users/${id}`, backendData);

    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await adminApi.delete(`/users/${id}`);
  },

  async changeUserRole(id: string, role: string): Promise<User> {
    const response = await adminApi.patch<User>(`/users/${id}/role`, { role });

    return response.data;
  },

  async toggleUserStatus(id: string): Promise<User> {
    const response = await adminApi.patch<User>(`/users/${id}/status`);

    return response.data;
  },

  // Statistiques
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await adminApi.get<DashboardStats>(
      "/statistics/dashboard",
    );

    return response.data;
  },

  // Étudiants
  async getEtudiants(params: UsersFilters = {}): Promise<PaginatedResponse<Etudiant>> {
    const response = await adminApi.get<{ etudiants: Etudiant[]; pagination: any }>(
      "/etudiants",
      { params },
    );

    return {
      data: response.data.etudiants,
      pagination: response.data.pagination,
    };
  },

  async getEtudiantById(id: string): Promise<Etudiant> {
    const response = await adminApi.get<Etudiant>(`/etudiants/${id}`);

    return response.data;
  },

  async createEtudiant(data: EtudiantCreate): Promise<Etudiant> {
    const response = await adminApi.post<Etudiant>("/etudiants", data);

    return response.data;
  },

  async updateEtudiant(id: string, data: EtudiantUpdate): Promise<Etudiant> {
    const response = await adminApi.put<Etudiant>(`/etudiants/${id}`, data);

    return response.data;
  },

  async deleteEtudiant(id: string): Promise<void> {
    await adminApi.delete(`/etudiants/${id}`);
  },

  async assignEtudiant(id: string, data: {
    niveauIds?: string[];
    classeIds?: string[];
    matiereIds?: string[];
    anneeScolaire: string;
  }): Promise<Etudiant> {
    const response = await adminApi.post<Etudiant>(`/etudiants/${id}/assign`, data);

    return response.data;
  },

  // Professeurs
  async getProfesseurs(params: UsersFilters = {}): Promise<PaginatedResponse<Professeur>> {
    const response = await adminApi.get<{ professeurs: Professeur[]; pagination: any }>(
      "/professeurs",
      { params },
    );

    return {
      data: response.data.professeurs,
      pagination: response.data.pagination,
    };
  },

  async getProfesseurById(id: string): Promise<Professeur> {
    const response = await adminApi.get<Professeur>(`/professeurs/${id}`);

    return response.data;
  },

  async createProfesseur(data: ProfesseurCreate): Promise<Professeur> {
    const response = await adminApi.post<Professeur>("/professeurs", data);

    return response.data;
  },

  async updateProfesseur(id: string, data: ProfesseurUpdate): Promise<Professeur> {
    const response = await adminApi.put<Professeur>(`/professeurs/${id}`, data);

    return response.data;
  },

  async deleteProfesseur(id: string): Promise<void> {
    await adminApi.delete(`/professeurs/${id}`);
  },

  async assignProfesseur(id: string, data: {
    matiereIds?: string[];
    niveauIds?: string[];
    classeIds?: string[];
    anneeScolaire: string;
  }): Promise<Professeur> {
    const response = await adminApi.post<Professeur>(`/professeurs/${id}/assign`, data);

    return response.data;
  },

  // Configurations IA
  async getAIConfigs(): Promise<AIModelConfig[]> {
    const response = await adminApi.get<{ configs: AIModelConfig[] }>("/ai-configs");

    return response.data.configs;
  },

  async getAIConfigById(id: string): Promise<AIModelConfig> {
    const response = await adminApi.get<AIModelConfig>(`/ai-configs/${id}`);

    return response.data;
  },

  async getDefaultAIConfig(): Promise<AIModelConfig> {
    const response = await adminApi.get<AIModelConfig>("/ai-configs/default");

    return response.data;
  },

  async createAIConfig(data: AIModelConfigCreate): Promise<AIModelConfig> {
    const response = await adminApi.post<AIModelConfig>("/ai-configs", data);

    return response.data;
  },

  async updateAIConfig(id: string, data: AIModelConfigUpdate): Promise<AIModelConfig> {
    const response = await adminApi.put<AIModelConfig>(`/ai-configs/${id}`, data);

    return response.data;
  },

  async deleteAIConfig(id: string): Promise<void> {
    await adminApi.delete(`/ai-configs/${id}`);
  },

  async setDefaultAIConfig(id: string): Promise<AIModelConfig> {
    const response = await adminApi.post<AIModelConfig>(`/ai-configs/${id}/set-default`);

    return response.data;
  },

  async applyAIConfig(id: string): Promise<{ message: string }> {
    const response = await adminApi.post<{ message: string }>(`/ai-configs/${id}/apply`);

    return response.data;
  },

  async initDefaultAIConfigs(): Promise<{ configs: AIModelConfig[] }> {
    const response = await adminApi.post<{ configs: AIModelConfig[] }>("/ai-configs/init-defaults");

    return response.data;
  },

  // Actions urgentes (calcul côté frontend pour l'instant)
  async getUrgentActions(): Promise<UrgentAction[]> {
    // Pour l'instant, on génère les actions côté frontend
    // Plus tard, on pourra créer un endpoint backend dédié
    const actions: UrgentAction[] = [];

    try {
      // Récupérer les professeurs
      const profData = await this.getProfesseurs({ per_page: 1000 });
      const professeurs = profData.data;

      // Récupérer les étudiants
      const etudData = await this.getEtudiants({ per_page: 1000 });
      const etudiants = etudData.data;

      // TODO: Ajouter logique pour détecter les professeurs inactifs
      // TODO: Ajouter logique pour détecter les étudiants en difficulté
      // Pour l'instant on retourne un tableau vide

      return actions;
    } catch (error) {
      console.error("Erreur lors de la récupération des actions urgentes:", error);

      return [];
    }
  },
};
