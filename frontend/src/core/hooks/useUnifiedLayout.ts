"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { siteConfig } from "@/core/config/site";

export interface LayoutConfig {
  hasHeader: boolean;
  hasFooter: boolean;
  hasSidebar: boolean;
  isLoginPage: boolean;
  showSidebarToggle: boolean;
  layoutType: "default" | "sidebar" | "auth" | "minimal";
}

/**
 * Hook unifié pour déterminer la configuration de layout d'une page
 * @param pathname - Le chemin de la page (optionnel, utilise usePathname par défaut)
 * @returns Configuration de layout pour la page
 */
export const useUnifiedLayout = (pathname?: string): LayoutConfig => {
  const currentPathname = usePathname();
  const path = pathname || currentPathname;

  return useMemo(() => {
    // Pages d'authentification
    const isLoginPage =
      path === "/login" || path === "/signup" || path === "/register";

    // Pages avec sidebar
    const hasSidebar = siteConfig.sidebarPages.some((page) =>
      path.startsWith(page),
    );

    // Configuration par défaut
    const config: LayoutConfig = {
      hasHeader: !isLoginPage,
      hasFooter: !isLoginPage,
      hasSidebar,
      isLoginPage,
      showSidebarToggle: hasSidebar,
      layoutType: isLoginPage ? "auth" : hasSidebar ? "sidebar" : "default",
    };

    // Cas spéciaux
    if (path === "/") {
      config.layoutType = "default";
    }

    return config;
  }, [path]);
};

/**
 * Hook pour déterminer si une page doit utiliser la sidebar
 * @param pathname - Le chemin de la page (optionnel)
 * @returns true si la page doit utiliser la sidebar
 */
export const useSidebarLayout = (pathname?: string): boolean => {
  const config = useUnifiedLayout(pathname);

  return config.hasSidebar;
};

export default useUnifiedLayout;
