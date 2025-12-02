export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role?: "admin" | "enseignant" | "etudiant";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  telephone?: string | null;
  adresse?: string | null;
  dateNaissance?: string | null;
  etudiantProfil?: any; // Profil étudiant si existe
  enseignantProfil?: any; // Profil enseignant si existe
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface AuthError {
  message: string;
  field?: string;
}
