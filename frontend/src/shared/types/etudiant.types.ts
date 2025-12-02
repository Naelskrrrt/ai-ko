import type { Etablissement } from "./etablissement.types";
import type { Mention } from "./mention.types";
import type { Parcours } from "./parcours.types";
import type { Niveau } from "./niveau.types";
import type { Classe } from "./admin.types";
import type { Matiere } from "./matiere.types";

/**
 * Types pour les �tudiants
 */

export interface Etudiant {
  id: string;
  userId: string;
  numeroEtudiant?: string;
  telephone?: string;
  dateNaissance?: string;
  adresse?: string;
  etablissementId: string;
  mentionId?: string;
  parcoursId?: string;
  niveauId?: string;
  anneeAdmission?: string;
  actif?: boolean;
  createdAt: string;
  updatedAt?: string;

  // Relations depuis User
  email?: string;
  name?: string;
  role?: "etudiant";
}

export interface EtudiantWithRelations extends Etudiant {
  etablissement?: Etablissement;
  mention?: Mention;
  parcours?: Parcours;
  niveau?: Niveau;
  niveaux?: Niveau[];
  classes?: Classe[];
  matieres?: Matiere[];
}

export interface EtudiantCreate {
  userId: string;
  numeroEtudiant?: string;
  telephone?: string;
  dateNaissance?: string;
  adresse?: string;
  etablissementId: string;
  mentionId?: string;
  parcoursId?: string;
  niveauActuel?: string;
  anneeScolaire?: string;
}

export interface EtudiantUpdate {
  numeroEtudiant?: string;
  telephone?: string;
  dateNaissance?: string;
  adresse?: string;
  etablissementId?: string;
  mentionId?: string;
  parcoursId?: string;
  niveauActuel?: string;
  anneeScolaire?: string;
}

export interface EtudiantsListResponse {
  items: Etudiant[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
