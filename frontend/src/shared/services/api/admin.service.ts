import axios from 'axios'
import type {
  User,
  UserCreate,
  UserUpdate,
  PaginatedResponse,
  DashboardStats,
  UsersFilters,
} from '../../types/admin.types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT aux requêtes
adminApi.interceptors.request.use((config) => {
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

    console.log('🔑 Request interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenSource: token ? (document.cookie.includes('auth_token=') ? 'cookie' : 'localStorage') : 'none',
      token: token ? `${token.substring(0, 20)}...` : 'none',
      allCookies: document.cookie
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('⚠️ No auth token found in cookies OR localStorage');
      console.warn('Available cookies:', document.cookie);
      console.warn('LocalStorage keys:', Object.keys(localStorage));
    }
  }
  return config
})

// Intercepteur pour logger les erreurs
adminApi.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
)

export const adminService = {
  // Utilisateurs
  async getUsers(params: UsersFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await adminApi.get<{ users: User[]; pagination: any }>('/users', {
      params,
    })
    return {
      data: response.data.users,
      pagination: response.data.pagination,
    }
  },

  async getUserById(id: string): Promise<User> {
    const response = await adminApi.get<User>(`/users/${id}`)
    return response.data
  },

  async createUser(data: UserCreate): Promise<User> {
    const response = await adminApi.post<User>('/users', data)
    return response.data
  },

  async updateUser(id: string, data: UserUpdate): Promise<User> {
    // Convertir emailVerified (camelCase) en email_verified (snake_case) pour le backend
    const backendData: any = { ...data }
    if ('emailVerified' in backendData) {
      backendData.email_verified = backendData.emailVerified
      delete backendData.emailVerified
    }
    // Ne pas envoyer role dans la mise à jour (géré séparément via changeUserRole)
    delete backendData.role
    
    const response = await adminApi.put<User>(`/users/${id}`, backendData)
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await adminApi.delete(`/users/${id}`)
  },

  async changeUserRole(id: string, role: string): Promise<User> {
    const response = await adminApi.patch<User>(`/users/${id}/role`, { role })
    return response.data
  },

  async toggleUserStatus(id: string): Promise<User> {
    const response = await adminApi.patch<User>(`/users/${id}/status`)
    return response.data
  },

  // Statistiques
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await adminApi.get<DashboardStats>('/statistics/dashboard')
    return response.data
  },
}
