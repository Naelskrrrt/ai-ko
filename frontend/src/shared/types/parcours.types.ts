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

/**
 * Liste statique des parcours disponibles
 */
export const PARCOURS_STATIQUES: Omit<Parcours, "mentionId" | "mention">[] = [
  {
    id: "INFO",
    code: "INFO",
    nom: "Informatique",
    description: "Parcours en informatique générale et développement logiciel",
    actif: true,
  },
  {
    id: "IA",
    code: "IA",
    nom: "Intelligence Artificielle",
    description:
      "Parcours spécialisé en intelligence artificielle et machine learning",
    actif: true,
  },
  {
    id: "MM",
    code: "MM",
    nom: "Multimédia",
    description:
      "Parcours en conception multimédia, design et technologies web",
    actif: true,
  },
];
