/**
 * Types pour les Classes
 */

export interface Classe {
  id: string;
  code: string;
  nom: string;
  niveauId: string;
  anneeScolaire: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClasseCreate {
  code: string;
  nom: string;
  niveauId: string;
  anneeScolaire: string;
  actif?: boolean;
}

export interface ClasseUpdate {
  code?: string;
  nom?: string;
  niveauId?: string;
  anneeScolaire?: string;
  actif?: boolean;
}
