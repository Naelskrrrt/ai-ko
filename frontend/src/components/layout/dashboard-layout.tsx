"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

import { useAuth } from "@/core/providers/AuthProvider";
import { useSocket } from "@/core/hooks/useSocket";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();

  // Initialiser WebSocket pour les admins (gestion automatique des notifications)
  useSocket({
    onPendingUser: (_notification) => {
      // Les notifications sont gérées par PendingUsersNotification
      // Ce hook assure simplement que la connexion WebSocket est active
    },
  });

  // Déterminer le titre et sous-titre selon le rôle
  const getTitle = () => {
    if (title) return title;
    switch (user?.role) {
      case "admin":
        return "Administration";
      case "enseignant":
        return "Espace Enseignant";
      case "etudiant":
        return "Espace Étudiant";
      default:
        return "Tableau de bord";
    }
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    switch (user?.role) {
      case "admin":
        return "Gestion du système";
      case "enseignant":
        return "Gestion de vos QCM et étudiants";
      case "etudiant":
        return "Accédez à vos examens et résultats";
      default:
        return "Gestion de votre espace";
    }
  };

  // Fermer la sidebar sur mobile lors du changement de route
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-default-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="layout-frame">
      {/* Header fixe en haut */}
      <Header
        showSidebarToggle={true}
        subtitle={getSubtitle()}
        title={getTitle()}
        onSidebarToggle={toggleSidebar}
      />

      {/* Zone principale avec sidebar et contenu */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar conditionnelle */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Zone de contenu principal avec scroll */}
        <main
          className={clsx(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "layout-transition",
          )}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
