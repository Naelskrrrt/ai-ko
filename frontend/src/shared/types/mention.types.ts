/**
 * Types pour les Mentions
 */

export interface Mention {
  id: string;
  code: string;
  nom: string;
  description?: string;
  etablissementId: string;
  etablissement?: {
    id: string;
    code: string;
    nom: string;
  };
  couleur?: string;
  icone?: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentionCreate {
  code: string;
  nom: string;
  description?: string;
  etablissementId: string;
  couleur?: string;
  icone?: string;
  actif?: boolean;
}

export interface MentionUpdate extends Partial<MentionCreate> {}


