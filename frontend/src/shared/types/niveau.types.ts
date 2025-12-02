/**
 * Types pour les Niveaux
 */

export interface Niveau {
  id: string;
  code: string;
  nom: string;
  description?: string;
  ordre: number;
  cycle: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NiveauCreate {
  code: string;
  nom: string;
  description?: string;
  ordre: number;
  cycle: string;
  actif?: boolean;
}

export interface NiveauUpdate extends Partial<NiveauCreate> {}

/**
 * Liste statique des niveaux universitaires
 */
export const NIVEAUX_STATIQUES: Niveau[] = [
  {
    id: "L1",
    code: "L1",
    nom: "Licence 1",
    ordre: 1,
    cycle: "licence",
    actif: true,
  },
  {
    id: "L2",
    code: "L2",
    nom: "Licence 2",
    ordre: 2,
    cycle: "licence",
    actif: true,
  },
  {
    id: "L3",
    code: "L3",
    nom: "Licence 3",
    ordre: 3,
    cycle: "licence",
    actif: true,
  },
  {
    id: "M1",
    code: "M1",
    nom: "Master 1",
    ordre: 4,
    cycle: "master",
    actif: true,
  },
  {
    id: "M2",
    code: "M2",
    nom: "Master 2",
    ordre: 5,
    cycle: "master",
    actif: true,
  },
];
