"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import clsx from "clsx";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

import { useUnifiedLayout } from "@/core/hooks/useUnifiedLayout";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export const ConditionalLayout = ({ children }: ConditionalLayoutProps) => {
  const pathname = usePathname();
  const layoutConfig = useUnifiedLayout(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ne rendre le layout conditionnel qu'après montage pour éviter hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fermer la sidebar sur mobile lors du changement de route
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
  useEffect(() => {
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

  const needsSidebar = layoutConfig.layoutType === "sidebar";

  // Page d'authentification - layout minimal (sans header/footer)
  if (mounted && layoutConfig.isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="layout-frame">
      {/* Header fixe en haut */}
      <Header
        showSidebarToggle={needsSidebar}
        onSidebarToggle={toggleSidebar}
      />

      {/* Zone principale avec sidebar et contenu */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar conditionnelle - partie du flux sur desktop, overlay sur mobile */}
        {mounted && needsSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        )}

        {/* Zone de contenu principal avec scroll */}
        <main
          className={clsx(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "layout-transition",
          )}
        >
          {children}
        </main>
      </div>

      {/* Footer fixe en bas */}
      <Footer />
    </div>
  );
};
