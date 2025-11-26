"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/core/providers/AuthProvider";
import { redirect } from "next/navigation";
import { useEffect } from "react";

/**
 * Layout Admin - Version ULTRA SAFE
 * Cette version utilise redirect() de Next.js au lieu de router.replace()
 * pour éviter les erreurs de React lors des redirections
 */
export default function AdminLayoutSafe({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, hasRole } = useAuth();

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
          <p className="text-default-500">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, rediriger vers login
  if (!user) {
    console.log("[AdminLayout] Pas d'utilisateur, redirection vers /login");
    redirect("/login");
  }

  // Si utilisateur connecté mais pas admin, rediriger vers home
  if (!hasRole("admin")) {
    console.log("[AdminLayout] Utilisateur n'est pas admin, redirection vers /");
    redirect("/");
  }

  // Utilisateur admin authentifié, afficher le contenu
  return <DashboardLayout>{children}</DashboardLayout>;
}
