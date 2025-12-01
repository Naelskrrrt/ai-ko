/**
 * Types pour les Établissements
 */

export interface Etablissement {
  id: string;
  code: string;
  nom: string;
  nomCourt?: string;
  description?: string;
  typeEtablissement: 'université' | 'école' | 'institut';
  adresse?: string;
  ville?: string;
  pays: string;
  codePostal?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  logo?: string;
  couleurPrimaire?: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EtablissementCreate {
  code: string;
  nom: string;
  nomCourt?: string;
  description?: string;
  typeEtablissement: 'université' | 'école' | 'institut';
  adresse?: string;
  ville?: string;
  pays?: string;
  codePostal?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  logo?: string;
  couleurPrimaire?: string;
  actif?: boolean;
}

export interface EtablissementUpdate extends Partial<EtablissementCreate> {}

