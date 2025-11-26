"use client";

import React from "react";
import clsx from "clsx";

// Types pour le composant ContentArea
interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
  enableScroll?: boolean;
  centerContent?: boolean;
}

// Mapping des tailles de padding
const paddingClasses = {
  none: "layout-padding-none",
  sm: "layout-padding-sm",
  md: "layout-padding-md",
  lg: "layout-padding-lg",
} as const;

// Mapping des largeurs maximales
const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
} as const;

/**
 * ContentArea - Zone de contenu avec scroll contrôlé
 *
 * Ce composant :
 * - Utilise l'espace disponible calculé par le layout frame
 * - Gère le scroll uniquement dans cette zone (pas de scroll global)
 * - Applique un padding configurable
 * - Permet de définir une largeur maximale
 * - Centre le contenu si demandé
 *
 * @param children - Contenu à afficher
 * @param className - Classes CSS additionnelles
 * @param padding - Niveau de padding ('none' | 'sm' | 'md' | 'lg')
 * @param maxWidth - Largeur maximale du contenu
 * @param enableScroll - Active/désactive le scroll (défaut: true)
 * @param centerContent - Centre le contenu horizontalement (défaut: false)
 */
export const ContentArea: React.FC<ContentAreaProps> = ({
  children,
  className,
  padding = "md",
  maxWidth = "full",
  enableScroll = true,
  centerContent = false,
}) => {
  return (
    <div
      className={clsx(
        "layout-content-area",
        !enableScroll && "no-scroll",
        className,
      )}
    >
      <div
        className={clsx(
          "w-full",
          enableScroll !== false ? "h-full" : "flex-1 flex flex-col",
          paddingClasses[padding],
          centerContent && "mx-auto",
          maxWidth === "full"
            ? "layout-container-full"
            : ["layout-unified-container", maxWidthClasses[maxWidth]],
        )}
      >
        {children}
      </div>
    </div>
  );
};

// Composant spécialisé pour les pages de dashboard
interface DashboardContentAreaProps
  extends Omit<ContentAreaProps, "padding" | "maxWidth"> {
  title?: string | React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  fullWidth?: boolean; // Nouvelle prop pour les pages comme la carte
}

export const DashboardContentArea: React.FC<DashboardContentAreaProps> = ({
  children,
  title,
  subtitle,
  actions,
  fullWidth = false,
  className,
  ...props
}) => {
  return (
    <ContentArea
      className={clsx(
        fullWidth && !props.enableScroll && "flex flex-col h-full",
        className,
      )}
      enableScroll={props.enableScroll}
      maxWidth={fullWidth ? "full" : "7xl"}
      padding={fullWidth ? "none" : "lg"}
      {...props}
    >
      {/* Header standard pour les pages non-fullWidth */}
      {(title || subtitle || actions) && !fullWidth && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-divider mb-6">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-foreground">
                {typeof title === "string" ? title : title}
              </h1>
            )}
            {subtitle && <p className="text-default-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Header pour les pages fullWidth avec padding interne */}
      {(title || subtitle || actions) && fullWidth && (
        <div
          className={clsx(
            "bg-background border-b border-divider z-10",
            props.enableScroll !== false && "sticky top-0",
          )}
        >
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold text-foreground">
                    {typeof title === "string" ? title : title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-default-500 mt-1">{subtitle}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenu avec espacement conditionnel */}
      <div
        className={clsx(
          !fullWidth && "space-y-6 pb-6",
          fullWidth && !props.enableScroll && "flex-1 flex flex-col min-h-0",
          fullWidth && props.enableScroll && "flex-1",
        )}
      >
        {children}
      </div>
    </ContentArea>
  );
};

// Composant spécialisé pour les pages de contenu simple
interface SimpleContentAreaProps
  extends Omit<ContentAreaProps, "padding" | "maxWidth" | "centerContent"> {
  title?: string;
  subtitle?: string;
}

export const SimpleContentArea: React.FC<SimpleContentAreaProps> = ({
  children,
  title,
  subtitle,
  className,
  ...props
}) => {
  return (
    <ContentArea
      centerContent={true}
      className={clsx("space-y-8", className)}
      maxWidth="4xl"
      padding="lg"
      {...props}
    >
      {(title || subtitle) && (
        <div className="text-center space-y-2">
          {title && (
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          )}
          {subtitle && <p className="text-lg text-default-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </ContentArea>
  );
};

export default ContentArea;
