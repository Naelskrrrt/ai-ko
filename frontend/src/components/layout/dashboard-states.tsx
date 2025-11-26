"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

import { DashboardContentArea } from "./content-area";

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  message?: string;
  showSpinner?: boolean;
}

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  error?: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
}

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Composant d'état de chargement unifié pour les pages avec sidebar
 */
export const DashboardLoadingState: React.FC<LoadingStateProps> = ({
  title = "Chargement...",
  subtitle = "Récupération des données en cours",
  message = "Veuillez patienter quelques instants",
  showSpinner = true,
}) => {
  return (
    <DashboardContentArea subtitle={subtitle} title={title}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          {showSpinner && (
            <div className="relative mb-6">
              <Loader2 className="w-12 h-12 text-theme-primary animate-spin mx-auto" />
            </div>
          )}
          <p className="text-default-600">{message}</p>
        </div>
      </div>
    </DashboardContentArea>
  );
};

/**
 * Composant d'état d'erreur unifié pour les pages avec sidebar
 */
export const DashboardErrorState: React.FC<ErrorStateProps> = ({
  title = "Erreur de chargement",
  subtitle = "Une erreur est survenue",
  error,
  onRetry,
  retryLabel = "Réessayer",
}) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : error || "Une erreur inattendue s'est produite";

  return (
    <DashboardContentArea subtitle={subtitle} title={title}>
      <Card className="border-danger-200 bg-danger-50/50">
        <CardBody className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-danger-700 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-danger-600 mb-4">{errorMessage}</p>
              {onRetry && (
                <Button
                  color="danger"
                  startContent={<RefreshCw className="w-4 h-4" />}
                  variant="flat"
                  onPress={onRetry}
                >
                  {retryLabel}
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </DashboardContentArea>
  );
};

/**
 * Composant d'état vide unifié pour les pages avec sidebar
 */
export const DashboardEmptyState: React.FC<EmptyStateProps> = ({
  title = "Aucun élément",
  subtitle = "Il n'y a rien à afficher pour le moment",
  message = "Commencez par ajouter du contenu",
  action,
  icon,
}) => {
  const defaultIcon = (
    <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-default-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );

  return (
    <DashboardContentArea subtitle={subtitle} title={title}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          {icon || defaultIcon}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-default-600 mb-4">{message}</p>
          {action && action}
        </div>
      </div>
    </DashboardContentArea>
  );
};

/**
 * Hook pour gérer les états de page de manière uniforme
 */
export const useDashboardState = () => {
  const LoadingState = (props: LoadingStateProps) => (
    <DashboardLoadingState {...props} />
  );
  const ErrorState = (props: ErrorStateProps) => (
    <DashboardErrorState {...props} />
  );
  const EmptyState = (props: EmptyStateProps) => (
    <DashboardEmptyState {...props} />
  );

  return { LoadingState, ErrorState, EmptyState };
};

export default {
  LoadingState: DashboardLoadingState,
  ErrorState: DashboardErrorState,
  EmptyState: DashboardEmptyState,
  useDashboardState,
};
