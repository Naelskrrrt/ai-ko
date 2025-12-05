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
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { QCMGenerateForm } from "./QCMGenerateForm";

interface CreateQCMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (qcmId: string) => void;
}

export function CreateQCMModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateQCMModalProps) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);

  const handleSuccess = (qcmId: string) => {
    if (onSuccess) {
      onSuccess(qcmId);
    }
    // Fermer le modal et rediriger vers la page de détails du QCM
    onClose();
    router.push(`/enseignant/qcm/${qcmId}`);
  };

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleStateChange = (state: {
    isSubmitting: boolean;
    isPolling: boolean;
  }) => {
    setIsSubmitting(state.isSubmitting);
    setIsPolling(state.isPolling);
  };

  return (
    <Modal
      classNames={{
        base: "bg-background max-h-[90vh]",
        header: "border-b border-divider flex-shrink-0",
        body: "py-6 overflow-y-auto",
        footer: "border-t border-divider flex-shrink-0",
      }}
      isDismissable={!isSubmitting && !isPolling}
      isKeyboardDismissDisabled={isSubmitting || isPolling}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="4xl"
      onClose={isSubmitting || isPolling ? undefined : onClose}
    >
      <ModalContent className="max-h-[90vh] flex flex-col">
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Générer un nouveau QCM</h2>
          </div>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto">
          <QCMGenerateForm
            formRef={formRef}
            isModal={true}
            onClose={onClose}
            onStateChange={handleStateChange}
            onSuccess={handleSuccess}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={isSubmitting || isPolling}
            variant="light"
            onPress={onClose}
          >
            Annuler
          </Button>
          <Button
            color="primary"
            isDisabled={isPolling}
            isLoading={isSubmitting || isPolling}
            startContent={<Sparkles className="w-4 h-4" />}
            onPress={handleSubmit}
          >
            {isPolling ? "Génération en cours..." : "Générer le QCM"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
