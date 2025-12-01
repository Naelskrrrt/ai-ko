"use client";

import * as React from "react";
import useSWR from "swr";

import { useAuth } from "@/core/providers/AuthProvider";
import { ElevesList } from "@/features/enseignant/components/eleves/ElevesList";
import { profileService } from "@/shared/services/api/profile.service";

export default function ElevesPage() {
  const { user } = useAuth();

  // Récupérer le profil enseignant pour obtenir l'ID
  const { data: profileData, isLoading } = useSWR(
    user?.role === "enseignant" ? ["profile-enseignant-page", "enseignant"] : null,
    async () => {
      return await profileService.getMyProfile("enseignant");
    },
  );

  const enseignantId = profileData?.id || null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!enseignantId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-default-500">Profil enseignant non trouvé</p>
      </div>
    );
  }

  return <ElevesList enseignantId={enseignantId} />;
}

