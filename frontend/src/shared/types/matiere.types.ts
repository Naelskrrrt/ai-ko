/**
 * Types pour les Matières
 */

export interface Matiere {
  id: string;
  code: string;
  nom: string;
  description?: string;
  coefficient?: number;
  couleur?: string;
  icone?: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatiereCreate {
  code: string;
  nom: string;
  description?: string;
  coefficient?: number;
  couleur?: string;
  icone?: string;
  actif?: boolean;
}

export interface MatiereUpdate {
  code?: string;
  nom?: string;
  description?: string;
  coefficient?: number;
  couleur?: string;
  icone?: string;
  actif?: boolean;
}

