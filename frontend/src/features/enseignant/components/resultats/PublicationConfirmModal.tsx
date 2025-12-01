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
import { AlertCircle, CheckCircle } from "lucide-react";

interface PublicationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nombreResultats: number;
  isLoading?: boolean;
}

export function PublicationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  nombreResultats,
  isLoading = false,
}: PublicationConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <span>Publier les résultats</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warning-800">
                  Attention
                </p>
                <p className="text-sm text-warning-700 mt-1">
                  Une fois publiés, les étudiants pourront voir leurs notes et
                  les corrections détaillées.
                </p>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="text-default-600">
                Vous êtes sur le point de publier
              </p>
              <p className="text-3xl font-bold text-primary my-2">
                {nombreResultats}
              </p>
              <p className="text-default-600">
                résultat{nombreResultats > 1 ? "s" : ""} terminé
                {nombreResultats > 1 ? "s" : ""}
              </p>
            </div>

            <p className="text-sm text-default-500 text-center">
              Les étudiants recevront une notification et pourront consulter
              leurs résultats immédiatement.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="flat" onPress={onClose}>
            Annuler
          </Button>
          <Button
            color="primary"
            isLoading={isLoading}
            onPress={onConfirm}
          >
            Confirmer la publication
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

