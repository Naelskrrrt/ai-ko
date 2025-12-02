export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "enseignant" | "etudiant";
  emailVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserCreate {
  email: string;
  name: string;
  role: "admin" | "enseignant" | "etudiant";
  password: string;
  emailVerified?: boolean;
}

export interface UserUpdate {
  email?: string;
  name?: string;
  role?: "admin" | "enseignant" | "etudiant";
  password?: string;
  emailVerified?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

export interface QCM {
  id: string;
  titre: string;
  description?: string;
  status: string;
  nombreQuestions: number;
  createur?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface DashboardStats {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalQcms: number;
    totalQuestions: number;
  };
  usersByRole: Record<string, number>;
  qcmsByStatus: Record<string, number>;
  recentUsers: User[];
  recentQcms: QCM[];
}

export interface UsersFilters {
  page?: number;
  per_page?: number;
  role?: string;
  search?: string;
  active?: boolean;
  sort_by?: "email" | "name" | "created_at" | "role";
  sort_order?: "asc" | "desc";
}

// Nouveaux types pour les entités

export interface Niveau {
  id: string;
  code: string;
  nom: string;
  cycle: string;
  ordre: number;
  actif: boolean;
}

export interface Matiere {
  id: string;
  code: string;
  nom: string;
  coefficient: number;
  actif: boolean;
}

export interface Classe {
  id: string;
  code: string;
  nom: string;
  niveauId: string;
  anneeScolaire: string;
  actif: boolean;
}

export interface Etudiant extends User {
  numeroEtudiant?: string;
  telephone?: string;
  dateNaissance?: string;
  niveaux?: Niveau[];
  classes?: Classe[];
  matieres?: Matiere[];
}

export interface Professeur extends User {
  numeroEnseignant?: string;
  telephone?: string;
  matieresEnseignees?: Matiere[];
  niveauxEnseignes?: Niveau[];
  classesEnseignees?: Classe[];
}

export interface AIModelConfig {
  id: string;
  nom: string;
  provider: "huggingface" | "openai" | "anthropic" | "local";
  modelId: string;
  description?: string;
  apiUrl?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  timeoutSeconds: number;
  actif: boolean;
  estDefaut: boolean;
  ordrePriorite: number;
  createdAt: string;
  updatedAt: string;
}

export interface UrgentAction {
  id: string;
  type: "critical" | "warning" | "info";
  category: "professeur" | "etudiant" | "session" | "ai_config";
  message: string;
  targetId?: string;
  timestamp: string;
  actionUrl?: string;
}

export interface EtudiantCreate {
  email: string;
  name: string;
  password: string;
  numeroEtudiant?: string;
  telephone?: string;
  dateNaissance?: string;
  niveauIds?: string[];
  classeIds?: string[];
  matiereIds?: string[];
  anneeScolaire?: string;
}

export interface EtudiantUpdate {
  name?: string;
  email?: string;
  password?: string;
  numeroEtudiant?: string;
  telephone?: string;
  dateNaissance?: string;
}

export interface ProfesseurCreate {
  email: string;
  name: string;
  password: string;
  numeroEnseignant?: string;
  telephone?: string;
  matiereIds?: string[];
  niveauIds?: string[];
  classeIds?: string[];
  anneeScolaire?: string;
}

export interface ProfesseurUpdate {
  name?: string;
  email?: string;
  password?: string;
  numeroEnseignant?: string;
  telephone?: string;
}

export interface AIModelConfigCreate {
  nom: string;
  provider: "huggingface" | "openai" | "anthropic" | "local";
  modelId: string;
  description?: string;
  apiUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeoutSeconds?: number;
  actif?: boolean;
  estDefaut?: boolean;
  ordrePriorite?: number;
}

export interface AIModelConfigUpdate {
  nom?: string;
  provider?: "huggingface" | "openai" | "anthropic" | "local";
  modelId?: string;
  description?: string;
  apiUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeoutSeconds?: number;
  actif?: boolean;
  estDefaut?: boolean;
  ordrePriorite?: number;
}
