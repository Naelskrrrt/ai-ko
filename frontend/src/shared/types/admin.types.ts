export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'enseignant' | 'etudiant'
  emailVerified: boolean
  createdAt: string
  updatedAt?: string
}

export interface UserCreate {
  email: string
  name: string
  role: 'admin' | 'enseignant' | 'etudiant'
  password: string
  emailVerified?: boolean
}

export interface UserUpdate {
  email?: string
  name?: string
  role?: 'admin' | 'enseignant' | 'etudiant'
  password?: string
  emailVerified?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface QCM {
  id: string
  titre: string
  description?: string
  status: string
  nombreQuestions: number
  createur?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

export interface DashboardStats {
  metrics: {
    totalUsers: number
    activeUsers: number
    totalQcms: number
    totalQuestions: number
  }
  usersByRole: Record<string, number>
  qcmsByStatus: Record<string, number>
  recentUsers: User[]
  recentQcms: QCM[]
}

export interface UsersFilters {
  page?: number
  per_page?: number
  role?: string
  search?: string
  active?: boolean
  sort_by?: 'email' | 'name' | 'created_at' | 'role'
  sort_order?: 'asc' | 'desc'
}


