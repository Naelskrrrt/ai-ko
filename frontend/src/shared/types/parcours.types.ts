/**
 * Types pour les Parcours
 */

export interface Parcours {
  id: string;
  code: string;
  nom: string;
  description?: string;
  mentionId: string;
  mention?: {
    id: string;
    code: string;
    nom: string;
  };
  dureeAnnees?: number;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParcoursCreate {
  code: string;
  nom: string;
  description?: string;
  mentionId: string;
  dureeAnnees?: number;
  actif?: boolean;
}

export interface ParcoursUpdate extends Partial<ParcoursCreate> {}


