import type { EnseignantWithRelations } from "./enseignant.types";
import type { EtudiantWithRelations } from "./etudiant.types";
import type { User } from "./auth.types";
import type { EnseignantUpdate } from "./enseignant.types";
import type { EtudiantUpdate } from "./etudiant.types";

/**
 * Types pour les profils utilisateurs complets
 */

export interface ProfileEnseignant extends EnseignantWithRelations {
  role: "enseignant";
}

export interface ProfileEtudiant extends EtudiantWithRelations {
  role: "etudiant";
}

export interface ProfileAdmin extends User {
  role: "admin";
}

export type ProfileData = ProfileEnseignant | ProfileEtudiant | ProfileAdmin;

/**
 * Types pour les mises à jour de profil
 */

export interface UserUpdateData {
  name?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
}

export interface ProfileUpdateData {
  user?: UserUpdateData;
  enseignant?: EnseignantUpdate;
  etudiant?: EtudiantUpdate;
}

