/**
 * Types pour l'authentification - Compatible demo/prod
 */

// ================================================
// UTILISATEUR
// ================================================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "admin" | "user" | "guest";

// ================================================
// AUTHENTIFICATION
// ================================================

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// ================================================
// TOKENS & SESSION
// ================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number; // en secondes
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  expiresAt: string; // ISO date string
  issuedAt: string; // ISO date string
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ================================================
// RÉPONSES API
// ================================================

export interface LoginResponse {
  success: boolean;
  user: User;
  tokens: AuthTokens;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export interface AuthErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  errors?: string[];
}

// ================================================
// ÉTAT D'AUTHENTIFICATION
// ================================================

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

// ================================================
// JWT PAYLOAD
// ================================================

export interface JWTPayload {
  sub: string; // User ID
  username: string;
  email: string;
  role: UserRole;
  iat: number; // Issued at
  exp: number; // Expiration
  jti?: string; // JWT ID (optionnel)
}

// ================================================
// HOOKS RETURN TYPES
// ================================================

export interface UseAuthReturn {
  // État
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;

  // États de chargement
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isRegistering: boolean;
}
