"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

import { useAuth } from "@/core/providers/AuthProvider";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Composant qui bloque l'accès à son contenu tant que l'onboarding n'est pas complet
 * Utiliser ce composant pour wrapper TOUTES les pages protégées
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");

      return;
    }

    // Admins exemptés
    if (user.role === "admin") {
      setIsChecking(false);

      return;
    }

    // Vérifier si l'utilisateur a un profil complet
    const hasProfile = user?.etudiantProfil || user?.enseignantProfil;

    if (!hasProfile) {
      // ⛔ BLOQUER L'ACCÈS - Rediriger vers l'onboarding
      router.push("/onboarding/role-selection");

      return;
    }

    // Profil complet - autoriser l'accès
    setIsChecking(false);
  }, [user, loading, router]);

  // Afficher un loader pendant la vérification
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-default-500">Vérification de votre profil...</p>
        </div>
      </div>
    );
  }

  // Afficher le contenu uniquement si l'onboarding est complet
  return <>{children}</>;
}
