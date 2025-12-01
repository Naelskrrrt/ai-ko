"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

import { useToast, type Toast as ToastType } from "@/hooks/use-toast";
import { cn } from "@/shared/lib/utils";

const ToastIcon = ({ variant }: { variant: ToastType["variant"] }) => {
  const iconClass = "w-5 h-5";

  switch (variant) {
    case "success":
      return <CheckCircle2 className={cn(iconClass, "text-success")} />;
    case "error":
      return <AlertCircle className={cn(iconClass, "text-danger")} />;
    case "warning":
      return <AlertTriangle className={cn(iconClass, "text-warning")} />;
    case "info":
    default:
      return <Info className={cn(iconClass, "text-theme-primary")} />;
  }
};

const Toast = ({ toast }: { toast: ToastType }) => {
  const { dismiss } = useToast();

  const handleDismiss = () => {
    dismiss(toast.id);
  };

  const getVariantStyles = (variant: ToastType["variant"]) => {
    switch (variant) {
      case "success":
        return "border-success/30";
      case "error":
        return "border-danger/30";
      case "warning":
        return "border-warning/30";
      case "info":
      default:
        return "border-theme-primary/30";
    }
  };

  return (
    <Card
      className={cn(
        "min-w-[320px] max-w-[420px] shadow-2xl border",
        "bg-background/95 backdrop-blur-xl backdrop-saturate-150",
        "dark:bg-background/90",
        getVariantStyles(toast.variant),
      )}
      style={{
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <ToastIcon variant={toast.variant} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{toast.title}</p>
            {toast.description && (
              <p className="text-sm text-default-600 mt-1">
                {toast.description}
              </p>
            )}
          </div>
          <button
            aria-label="Fermer"
            className="flex-shrink-0 p-1 rounded-md hover:bg-default-100 transition-colors"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
