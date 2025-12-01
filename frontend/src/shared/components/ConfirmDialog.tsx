"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  confirmColor = "danger",
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          iconBg: "bg-warning-50",
          iconColor: "text-warning",
          borderColor: "border-warning-200",
          textColor: "text-warning-700",
        };
      case "info":
        return {
          iconBg: "bg-primary-50",
          iconColor: "text-primary",
          borderColor: "border-primary-200",
          textColor: "text-primary-700",
        };
      default: // danger
        return {
          iconBg: "bg-danger-50",
          iconColor: "text-danger",
          borderColor: "border-danger-200",
          textColor: "text-danger-700",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal
      hideCloseButton={isLoading}
      isDismissable={!isLoading}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>{title || "Confirmation"}</ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <p>{message}</p>
            <div
              className={`${styles.iconBg} border ${styles.borderColor} rounded-lg p-3`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`h-5 w-5 ${styles.iconColor} mt-0.5`}
                />
                <div className={`text-sm ${styles.textColor}`}>
                  <p className="font-semibold">Attention :</p>
                  <p className="mt-1">Cette action est irréversible.</p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={isLoading} variant="flat" onPress={onClose}>
            {cancelLabel}
          </Button>
          <Button
            color={confirmColor}
            isLoading={isLoading}
            onPress={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
