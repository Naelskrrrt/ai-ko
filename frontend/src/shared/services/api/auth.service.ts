import axios from 'axios'
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../../types/auth.types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT aux requêtes
authApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Essayer d'abord les cookies
    let token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
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

export const authService = {
  async register(data: RegisterCredentials): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>('/register', {
      name: data.name,
      email: data.email,
      password: data.password,
    })
    return response.data
  },

  async login(data: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>('/login', data)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await authApi.post('/logout')
    } catch (error: any) {
      // Si le token est expiré ou invalide, on ignore l'erreur
      // car l'objectif est juste de supprimer le cookie côté client
      if (error.response?.status !== 401 && error.response?.status !== 422) {
        throw error
      }
    }
  },

  async getMe(): Promise<User> {
    const response = await authApi.get<User>('/me')
    return response.data
  },

  async googleOAuth(): Promise<void> {
    window.location.href = `${API_URL}/api/auth/oauth/google`
  },
}


