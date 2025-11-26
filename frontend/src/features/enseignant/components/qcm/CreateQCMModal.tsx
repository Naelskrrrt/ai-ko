'use client'

import * as React from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/modal'
import { Button } from '@heroui/button'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { QCMGenerateForm } from './QCMGenerateForm'

interface CreateQCMModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (qcmId: string) => void
}

export function CreateQCMModal({ isOpen, onClose, onSuccess }: CreateQCMModalProps) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isPolling, setIsPolling] = React.useState(false)

  const handleSuccess = (qcmId: string) => {
    if (onSuccess) {
      onSuccess(qcmId)
    }
    // Fermer le modal et rediriger vers la page de détails du QCM
    onClose()
    router.push(`/enseignant/qcm/${qcmId}`)
  }

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  const handleStateChange = (state: { isSubmitting: boolean; isPolling: boolean }) => {
    setIsSubmitting(state.isSubmitting)
    setIsPolling(state.isPolling)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting || isPolling ? undefined : onClose}
      size="4xl"
      scrollBehavior="inside"
      isDismissable={!isSubmitting && !isPolling}
      isKeyboardDismissDisabled={isSubmitting || isPolling}
      classNames={{
        base: 'bg-background',
        header: 'border-b border-divider',
        body: 'py-6',
        footer: 'border-t border-divider',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Générer un nouveau QCM</h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <QCMGenerateForm
            isModal={true}
            onClose={onClose}
            onSuccess={handleSuccess}
            formRef={formRef}
            onStateChange={handleStateChange}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isSubmitting || isPolling}
          >
            Annuler
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting || isPolling}
            isDisabled={isPolling}
            startContent={<Sparkles className="w-4 h-4" />}
          >
            {isPolling ? 'Génération en cours...' : 'Générer le QCM'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

