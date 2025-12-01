/**
 * Types pour les Enseignants
 */

import { Matiere } from './matiere.types';
import { Niveau } from './niveau.types';
import { Parcours } from './parcours.types';
import { Mention } from './mention.types';
import { Etablissement } from './etablissement.types';

export interface Enseignant {
  id: string;
  userId: string;
  numeroEnseignant: string;
  grade?: string;
  specialite?: string;
  departement?: string;
  bureau?: string;
  horairesDisponibilite?: string;
  etablissementId: string;
  etablissement?: Etablissement;
  dateEmbauche?: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Infos user
  email?: string;
  name?: string;
  avatar?: string;
  telephone?: string;
  adresse?: string;
}

export interface EnseignantWithRelations extends Enseignant {
  matieres?: Matiere[];
  niveaux?: Niveau[];
  parcours?: Parcours[];
  mentions?: Mention[];
}

export interface EnseignantCreate {
  userId: string;
  numeroEnseignant: string;
  grade?: string;
  specialite?: string | string[]; // Support texte legacy ou liste d'IDs matières
  departement?: string;
  bureau?: string;
  horairesDisponibilite?: string;
  etablissementId: string;
  dateEmbauche?: string;
  actif?: boolean;
}

export interface EnseignantUpdate extends Partial<EnseignantCreate> {}

export interface EnseignantsListResponse {
  items: Enseignant[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

