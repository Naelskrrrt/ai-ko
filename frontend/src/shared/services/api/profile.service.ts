import { enseignantService } from "./enseignant.service";
import { etudiantService } from "./etudiant.service";
import type { EnseignantWithRelations } from "../../types/enseignant.types";
import type { EtudiantWithRelations } from "../../types/etudiant.types";
import type { User } from "../../types/auth.types";

export type ProfileData =
  | (EnseignantWithRelations & { role: "enseignant" })
  | (EtudiantWithRelations & { role: "etudiant" })
  | (User & { role: "admin" });

export const profileService = {
  /**
   * Récupère le profil complet de l'utilisateur connecté selon son rôle
   */
  async getMyProfile(role?: string): Promise<ProfileData> {
    if (role === "enseignant") {
      // Récupérer le profil avec les relations directement
      const enseignantWithRelations = await enseignantService.getMe(true);

      return {
        ...enseignantWithRelations,
        role: "enseignant",
      } as ProfileData;
    }

    if (role === "etudiant") {
      // Récupérer le profil avec les relations
      const etudiant = await etudiantService.getMe();
      const etudiantWithRelations = await etudiantService.getEtudiantById(
        etudiant.id,
        true,
      );

      return {
        ...etudiantWithRelations,
        role: "etudiant",
      } as ProfileData;
    }

    // Pour admin, on retourne les données de base de User
    // Cette fonction ne devrait pas être appelée pour admin
    throw new Error("Profil non disponible pour ce rôle");
  },
};

