import { useSWRConfig } from "swr";
import { authService } from "@/shared/services/api/auth.service";
import { enseignantService } from "@/shared/services/api/enseignant.service";
import { etudiantService } from "@/shared/services/api/etudiant.service";
import type { ProfileUpdateData } from "@/shared/types/profile.types";
import { useToast } from "@/hooks/use-toast";

export function useUpdateProfile(role?: string) {
  const { mutate: mutateProfile } = useSWRConfig();
  const { toast } = useToast();

  const updateProfile = async (data: ProfileUpdateData) => {
    try {
      // 1. Mettre à jour User de base si des données sont fournies
      if (data.user) {
        await authService.updateMyProfile(data.user);
      }

      // 2. Mettre à jour profil spécifique selon rôle
      if (role === "enseignant" && data.enseignant) {
        // Récupérer l'ID de l'enseignant depuis le profil
        const enseignant = await enseignantService.getMe();
        await enseignantService.updateEnseignant(enseignant.id, data.enseignant);
      } else if (role === "etudiant" && data.etudiant) {
        // Récupérer l'ID de l'étudiant depuis le profil
        const etudiant = await etudiantService.getMe();
        await etudiantService.updateEtudiant(etudiant.id, data.etudiant);
      }

      // 3. Revalider le cache
      if (role && role !== "admin") {
        mutateProfile([`profile-${role}`, role]);
      }
      mutateProfile("/api/auth/me");

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
        variant: "success",
      });

      return true;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Une erreur est survenue lors de la mise à jour du profil";

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "error",
      });

      throw error;
    }
  };

  return { updateProfile };
}

