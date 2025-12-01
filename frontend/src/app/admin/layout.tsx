"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/core/providers/AuthProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

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
        "[AdminLayout] Pas d'utilisateur, préparation redirection vers /login",
      );
      setShouldRedirect("/login");

      return;
    }

    // Si utilisateur connecté mais pas admin, marquer pour redirection vers home
    if (!hasRole("admin")) {
      // eslint-disable-next-line no-console
      console.log(
        "[AdminLayout] Utilisateur n'est pas admin, préparation redirection vers /",
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
      console.log(`[AdminLayout] Redirection vers ${shouldRedirect}`);
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

  // Si pas d'utilisateur ou pas admin, afficher loader (ne devrait pas arriver ici normalement)
  if (!user || !hasRole("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">Accès en cours...</p>
        </div>
      </div>
    );
  }

  // Utilisateur admin authentifié, afficher le contenu
  return <DashboardLayout>{children}</DashboardLayout>;
}
