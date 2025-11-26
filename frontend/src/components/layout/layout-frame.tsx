"use client";

import React, { useMemo } from "react";
import clsx from "clsx";

// Types pour le composant LayoutFrame
interface LayoutFrameProps {
  children: React.ReactNode;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasSidebar?: boolean;
  className?: string;
}

// Constantes de layout (synchronisées avec les variables CSS)
export const LAYOUT_CONSTANTS = {
  HEADER_HEIGHT: "clamp(3.5rem, 8vh, 5rem)", // Hauteur relative avec contraintes
  FOOTER_HEIGHT: "clamp(2.5rem, 6vh, 4rem)", // Hauteur relative avec contraintes
  SIDEBAR_WIDTH: "clamp(240px, 18vw, 320px)", // Largeur relative avec contraintes
  SIDEBAR_WIDTH_MOBILE: "80vw", // 80% de la largeur sur mobile
} as const;

// Hook pour calculer les dimensions de layout
export const useLayoutDimensions = (
  hasHeader: boolean = true,
  hasFooter: boolean = true,
  hasSidebar: boolean = false,
) => {
  return useMemo(() => {
    const dimensions = {
      headerHeight: hasHeader ? LAYOUT_CONSTANTS.HEADER_HEIGHT : "0px",
      footerHeight: hasFooter ? LAYOUT_CONSTANTS.FOOTER_HEIGHT : "0px",
      sidebarWidth: hasSidebar ? LAYOUT_CONSTANTS.SIDEBAR_WIDTH : "0px",
      sidebarWidthMobile: hasSidebar
        ? LAYOUT_CONSTANTS.SIDEBAR_WIDTH_MOBILE
        : "0px",
    };

    // Calcul de la hauteur disponible pour le contenu
    const contentHeight = `calc(100vh - ${dimensions.headerHeight} - ${dimensions.footerHeight})`;

    return {
      ...dimensions,
      contentHeight,
    };
  }, [hasHeader, hasFooter, hasSidebar]);
};

/**
 * LayoutFrame - Composant conteneur principal qui gère l'espace disponible
 *
 * Ce composant :
 * - Définit une frame de 100vh sans scroll global
 * - Réserve l'espace pour header, footer et sidebar selon les props
 * - Calcule automatiquement l'espace disponible pour le contenu
 * - Fournit une structure cohérente pour toutes les vues
 *
 * @param children - Contenu à afficher dans la frame
 * @param hasHeader - Si true, réserve l'espace pour le header (défaut: true)
 * @param hasFooter - Si true, réserve l'espace pour le footer (défaut: true)
 * @param hasSidebar - Si true, réserve l'espace pour la sidebar (défaut: false)
 * @param className - Classes CSS additionnelles
 */
export const LayoutFrame: React.FC<LayoutFrameProps> = ({
  children,
  hasHeader = true,
  hasFooter = true,
  hasSidebar = false,
  className,
}) => {
  const dimensions = useLayoutDimensions(hasHeader, hasFooter, hasSidebar);

  return (
    <div
      className={clsx(
        "layout-frame", // Classe CSS définie dans layout.css
        className,
      )}
      style={
        {
          "--computed-content-height": dimensions.contentHeight,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export default LayoutFrame;
