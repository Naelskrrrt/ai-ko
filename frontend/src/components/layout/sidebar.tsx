"use client";

import { Button } from "@heroui/button";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useMemo } from "react";

import { siteConfig } from "@/core/config/site";
import {
  DashboardIcon,
  TeamIcon,
  CalendarIcon,
  SettingsIcon,
  ProfileIcon,
  BookOpenIcon,
  FileTextIcon,
  ClipboardListIcon,
} from "@/components/icons";
import { useAuth } from "@/core/providers/AuthProvider";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const iconMap = {
  dashboard: DashboardIcon,
  team: TeamIcon,
  calendar: CalendarIcon,
  settings: SettingsIcon,
  profile: ProfileIcon,
  book: BookOpenIcon,
  file: FileTextIcon,
  clipboard: ClipboardListIcon,
};

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Déterminer les items de navigation selon la page actuelle et le rôle
  const navigationItems = useMemo(() => {
    // Si on est sur une page admin, utiliser la navigation admin
    if (pathname.startsWith("/admin")) {
      return siteConfig.adminSidebarNavItems || [];
    }
    
    // Si on est sur une page étudiant, utiliser la navigation étudiant
    if (pathname.startsWith("/etudiant")) {
      return siteConfig.etudiantSidebarNavItems || [];
    }
    
    // Si on est sur une page enseignant, utiliser la navigation enseignant (à créer)
    if (pathname.startsWith("/enseignant")) {
      return siteConfig.enseignantSidebarNavItems || [];
    }
    
    // Sinon, filtrer les items selon le rôle de l'utilisateur
    if (!user || !user.role) return [];
    
    return siteConfig.sidebarNavItems.filter((item: any) => {
      if (!item.roles) return true;
      return item.roles.includes(user.role);
    });
  }, [pathname, user]);

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 lg:hidden bg-black/50 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-background border-r border-divider",
          // Desktop: position relative, visible par défaut
          "lg:relative lg:z-30 lg:translate-x-0 lg:flex-shrink-0 lg:h-full lg:w-64 lg:block",
          // Mobile: position fixe en overlay
          "fixed inset-y-0 left-0 w-[80vw] max-w-xs z-50 h-full",
          // Transition
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* En-tête */}
          <div className="p-4 border-b border-divider">
            <div className="bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10 dark:from-theme-primary/20 dark:to-theme-secondary/20 rounded-lg p-3">
              <p className="text-sm font-medium text-theme-primary">
                {pathname.startsWith("/admin")
                  ? "Administration"
                  : pathname.startsWith("/etudiant")
                    ? "Espace Étudiant"
                    : pathname.startsWith("/enseignant")
                      ? "Espace Enseignant"
                      : "Dashboard Principal"}
              </p>
              <p className="text-xs text-default-500 dark:text-default-400">
                {pathname.startsWith("/admin")
                  ? "Gestion du système"
                  : pathname.startsWith("/etudiant")
                    ? "Examens et résultats"
                    : pathname.startsWith("/enseignant")
                      ? "Gestion des QCM"
                      : "Navigation générale"}
              </p>
            </div>
          </div>

          {/* Navigation principale */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.length > 0 ? (
                navigationItems.map((item) => {
                  const IconComponent =
                    item.icon ? iconMap[item.icon as keyof typeof iconMap] : null;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Button
                      key={item.href}
                      as={NextLink}
                      className={clsx(
                        "w-full justify-start gap-3 h-12",
                        isActive
                          ? "bg-theme-primary/10 dark:bg-theme-primary/20 text-theme-primary border-theme-primary/20"
                          : "text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-50",
                        // Mettre en évidence les éléments principaux
                        item.primary && "font-semibold",
                      )}
                      href={item.href}
                      startContent={
                        IconComponent ? <IconComponent className="w-5 h-5" /> : null
                      }
                      variant={isActive ? "flat" : "light"}
                      onClick={onClose}
                    >
                      {item.label}
                    </Button>
                  );
                })
              ) : (
                <div className="text-center text-default-400 dark:text-default-500 text-sm py-8">
                  Aucune navigation configurée
                </div>
              )}
            </div>
          </nav>

          {/* Footer de la sidebar */}
          <div className="p-4 border-t border-divider">
            <div className="bg-gradient-to-br from-theme-primary/10 to-theme-secondary/10 dark:from-theme-primary/20 dark:to-theme-secondary/20 rounded-lg p-3">
              <p className="text-xs font-medium text-default-700 dark:text-default-200 mb-1">
                Version 1.0.0
              </p>
              <p className="text-xs text-default-500 dark:text-default-400">
                Plateforme AI-KO
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
