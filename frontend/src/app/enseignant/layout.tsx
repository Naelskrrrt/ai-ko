"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CompleteProfileModal } from "@/components/modals/CompleteProfileModal";
import { useAuth } from "@/core/providers/AuthProvider";

export default function EnseignantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Calculer les champs manquants du profil
  const missingFields = useMemo(() => {
    if (!user) return [];
    
    const missing: string[] = [];
    const enseignantProfil = (user as any).enseignantProfil;
    
    // Vérifier les champs utilisateur de base
    if (!user.telephone) missing.push("telephone");
    if (!user.adresse) missing.push("adresse");
    
    // Vérifier les champs du profil enseignant
    if (enseignantProfil) {
      if (!enseignantProfil.grade) missing.push("grade");
      if (!enseignantProfil.specialite) missing.push("specialite");
      if (!enseignantProfil.departement) missing.push("departement");
    }
    
    return missing;
  }, [user]);

  // Gérer les redirections
  useEffect(() => {
    if (loading) return;

    // Si pas d'utilisateur, rediriger vers login
    if (!user) {
      setShouldRedirect("/login");
      return;
    }

    // Si pas enseignant ni admin, rediriger vers l'accueil
    if (!hasRole("enseignant") && !hasRole("admin")) {
      setShouldRedirect("/");
      return;
    }

    // Afficher le modal si des champs manquent (une seule fois)
    if (missingFields.length > 0 && !hasShownModal) {
      const timer = setTimeout(() => {
        setShowCompleteProfileModal(true);
        setHasShownModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, hasRole, missingFields, hasShownModal]);

  // Effectuer la redirection
  useEffect(() => {
    if (shouldRedirect) {
      router.replace(shouldRedirect);
    }
  }, [shouldRedirect, router]);

  // Loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Loader si redirection en cours
  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">Redirection...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur autorisé
  if (!user || (!hasRole("enseignant") && !hasRole("admin"))) {
    return null;
  }

  return (
    <>
      <DashboardLayout>{children}</DashboardLayout>
      
      <CompleteProfileModal
        isOpen={showCompleteProfileModal}
        onClose={() => setShowCompleteProfileModal(false)}
        onComplete={() => setShowCompleteProfileModal(false)}
        missingFields={missingFields}
      />
    </>
  );
}
