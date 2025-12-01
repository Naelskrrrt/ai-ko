/**
 * Types pour les Étudiants
 */

import { Matiere } from './matiere.types';
import { Classe } from './classe.types';
import { Niveau } from './niveau.types';
import { Parcours } from './parcours.types';
import { Mention } from './mention.types';
import { Etablissement } from './etablissement.types';

export interface Etudiant {
  id: string;
  userId: string;
  numeroEtudiant: string;
  anneeAdmission?: string;
  etablissementId: string;
  etablissement?: Etablissement;
  mentionId?: string;
  mention?: Mention;
  parcoursId?: string;
  parcours?: Parcours;
  niveauId?: string;
  niveau?: Niveau;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Infos user
  email?: string;
  name?: string;
  avatar?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
}

export interface EtudiantWithRelations extends Etudiant {
  matieres?: Matiere[];
  classes?: Classe[];
}

export interface EtudiantCreate {
  userId: string;
  numeroEtudiant: string;
  anneeAdmission?: string;
  etablissementId: string;
  mentionId?: string;
  parcoursId?: string;
  niveauId?: string;
  actif?: boolean;
}

export interface EtudiantUpdate extends Partial<EtudiantCreate> {
  matieres?: string[]; // IDs des matières
}

export interface EtudiantsListResponse {
  items: Etudiant[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface EtudiantProgression {
  etudiant: Etudiant;
  nombre_matieres: number;
  nombre_classes: number;
  matieres: Matiere[];
  classes: Classe[];
}

