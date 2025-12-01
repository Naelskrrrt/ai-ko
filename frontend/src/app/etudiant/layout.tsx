"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/core/providers/AuthProvider";
import { SelectMatieresModal } from "@/features/etudiant/components/SelectMatieresModal";
import { qcmsService } from "@/features/etudiant/services/qcms.service";

export default function EtudiantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  const [showMatieresModal, setShowMatieresModal] = useState(false);
  const [hasCheckedMatieres, setHasCheckedMatieres] = useState(false);

  // Vérifier si l'étudiant a des matières au premier chargement
  useEffect(() => {
    const checkMatieres = async () => {
      if (loading || !user || !hasRole("etudiant")) return;

      try {
        const mesMatieres = await qcmsService.getMesMatieres();

        // Si pas de matières, afficher le modal (premier sign-in)
        if (mesMatieres.length === 0 && !hasCheckedMatieres) {
          setShowMatieresModal(true);
          setHasCheckedMatieres(true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Erreur vérification matières:", error);
      }
    };

    checkMatieres();
  }, [user, loading, hasRole, hasCheckedMatieres]);

  // Écouter l'événement pour ouvrir le modal depuis le Header
  useEffect(() => {
    const handleOpenModal = () => {
      setShowMatieresModal(true);
    };

    window.addEventListener("open-matieres-modal", handleOpenModal);

    return () => {
      window.removeEventListener("open-matieres-modal", handleOpenModal);
    };
  }, []);

  // Gérer les redirections UNIQUEMENT via useEffect
  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (loading) {
      setShouldRedirect(null);

      return;
    }

    // Si pas d'utilisateur, marquer pour redirection vers login
    if (!user) {
      // eslint-disable-next-line no-console
      console.log(
        "[EtudiantLayout] Pas d'utilisateur, préparation redirection vers /login",
      );
      setShouldRedirect("/login");

      return;
    }

    // Si utilisateur connecté mais pas étudiant, marquer pour redirection
    if (!hasRole("etudiant") && !hasRole("admin")) {
      // eslint-disable-next-line no-console
      console.log(
        "[EtudiantLayout] Utilisateur n'est pas étudiant, préparation redirection vers /",
      );
      setShouldRedirect("/");

      return;
    }

    // Tout est OK, pas de redirection
    setShouldRedirect(null);
  }, [user, loading, hasRole]);

  // Effectuer la redirection dans un useEffect séparé
  useEffect(() => {
    if (shouldRedirect) {
      // eslint-disable-next-line no-console
      console.log(`[EtudiantLayout] Redirection vers ${shouldRedirect}`);
      router.replace(shouldRedirect);
    }
  }, [shouldRedirect, router]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Si redirection en cours, afficher un loader
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

  // Si pas d'utilisateur ou pas étudiant, afficher loader (ne devrait pas arriver ici normalement)
  if (!user || (!hasRole("etudiant") && !hasRole("admin"))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">Accès en cours...</p>
        </div>
      </div>
    );
  }

  // Utilisateur étudiant authentifié, afficher le contenu avec le même layout que admin
  return (
    <>
      <DashboardLayout>{children}</DashboardLayout>
      <SelectMatieresModal
        isOpen={showMatieresModal}
        isRequired={!hasCheckedMatieres} // Obligatoire au premier sign-in
        onClose={() => setShowMatieresModal(false)}
        onSuccess={() => {
          // Recharger les données si nécessaire
          window.dispatchEvent(new CustomEvent("matieres-updated"));
          setHasCheckedMatieres(true);
        }}
      />
    </>
  );
}
