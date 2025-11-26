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
import { Input } from '@heroui/input'
import { DatePicker } from '@heroui/date-picker'
import { Select, SelectItem } from '@heroui/select'
import { Switch } from '@heroui/switch'
import { Textarea } from '@heroui/input'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Calendar } from 'lucide-react'
import { parseZonedDateTime, getLocalTimeZone, ZonedDateTime } from '@internationalized/date'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { sessionService } from '../../services/session.service'
import { qcmService } from '../../services/qcm.service'
import type { SessionFormData } from '../../types/enseignant.types'
import { CreateQCMModal } from '../qcm/CreateQCMModal'

// Schéma de validation Zod
const sessionSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(200),
  description: z.string().optional(),
  dateDebut: z.string().min(1, 'La date de début est requise'),
  dateFin: z.string().min(1, 'La date de fin est requise'),
  dureeMinutes: z.number().min(5, 'La durée minimale est de 5 minutes').max(480, 'La durée maximale est de 480 minutes'),
  tentativesMax: z.number().min(1, 'Le nombre de tentatives doit être au moins 1').optional(),
  melangeQuestions: z.boolean().optional(),
  melangeOptions: z.boolean().optional(),
  afficherCorrection: z.boolean().optional(),
  notePassage: z.number().min(0, 'La note de passage doit être au moins 0').max(100, 'La note de passage ne peut pas dépasser 100').optional(),
  qcmId: z.string().min(1, 'Veuillez sélectionner un QCM'),
  classeId: z.string().optional(),
}).refine((data) => {
  const dateDebut = new Date(data.dateDebut)
  const dateFin = new Date(data.dateFin)
  return dateFin > dateDebut
}, {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['dateFin'],
})

type SessionFormDataInput = z.infer<typeof sessionSchema>

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  prefillQcmId?: string
}

export function CreateSessionModal({ isOpen, onClose, onSuccess, prefillQcmId }: CreateSessionModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { isOpen: isQCMOpen, onOpen: onQCMOpen, onClose: onQCMClose } = useDisclosure()

  // Récupérer les QCMs (publiés + le QCM pré-rempli si fourni)
  const { data: qcmsData, mutate: mutateQCMs } = useSWR(
    ['qcms-for-session', prefillQcmId],
    async () => {
      const published = await qcmService.getQCMs({ status: 'published', limit: 100 })
      // Si un QCM est pré-rempli, s'assurer qu'il est dans la liste
      if (prefillQcmId) {
        try {
          const prefilledQcm = await qcmService.getQCMById(prefillQcmId)
          // Vérifier si le QCM pré-rempli est déjà dans la liste
          const exists = published.data.some(q => q.id === prefillQcmId)
          if (!exists && prefilledQcm) {
            // Ajouter le QCM pré-rempli à la liste même s'il n'est pas publié
            return {
              data: [prefilledQcm, ...published.data],
              total: published.total + 1
            }
          }
        } catch (error) {
          console.warn('Impossible de charger le QCM pré-rempli:', error)
        }
      }
      return published
    }
  )
  const qcms = qcmsData?.data || []

  // Formulaire avec React Hook Form + Zod
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SessionFormDataInput>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      melangeQuestions: false,
      melangeOptions: false,
      afficherCorrection: false,
      tentativesMax: 1,
      notePassage: 50,
      dureeMinutes: 60,
      qcmId: prefillQcmId || '',
    },
  })

  // Pré-remplir le QCM si fourni
  React.useEffect(() => {
    if (prefillQcmId && isOpen) {
      setValue('qcmId', prefillQcmId)
    }
  }, [prefillQcmId, isOpen, setValue])


  const onSubmit = async (data: SessionFormDataInput) => {
    setIsSubmitting(true)
    try {
      const sessionData: SessionFormData = {
        titre: data.titre,
        description: data.description,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        dureeMinutes: data.dureeMinutes,
        tentativesMax: data.tentativesMax,
        melangeQuestions: data.melangeQuestions ?? false,
        melangeOptions: data.melangeOptions ?? false,
        afficherCorrection: data.afficherCorrection ?? false,
        notePassage: data.notePassage ?? 50,
        qcmId: data.qcmId,
        classeId: data.classeId,
        status: 'programmee',
      }

      await sessionService.createSession(sessionData)
      reset()
      if (onSuccess) {
        onSuccess()
      } else {
        onClose()
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session:', error)
      alert(error.response?.data?.message || 'Erreur lors de la création de la session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleCreateNewQuiz = () => {
    onQCMOpen()
  }

  const handleQCMCreated = (qcmId: string) => {
    // Mettre à jour la liste des QCMs
    mutateQCMs()
    // Sélectionner automatiquement le QCM créé
    setValue('qcmId', qcmId)
    onQCMClose()
  }

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
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
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Créer une nouvelle session</h2>
          </div>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <Input
                  label="Titre de la session"
                  placeholder="Ex: Examen de Mathématiques - Session 1"
                  {...register('titre')}
                  isInvalid={!!errors.titre}
                  errorMessage={errors.titre?.message as string}
                  isRequired
                />

                <Textarea
                  label="Description"
                  placeholder="Description de la session (optionnel)"
                  {...register('description')}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message as string}
                  minRows={2}
                />

                {/* Sélection du QCM */}
                <div className="space-y-2">
                  <Controller
                    name="qcmId"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Select
                          label="QCM"
                          placeholder="Sélectionner un QCM"
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string
                            field.onChange(selectedKey || undefined)
                          }}
                          isInvalid={!!errors.qcmId}
                          errorMessage={errors.qcmId?.message as string}
                          isRequired
                        >
                          {qcms.map((qcm) => (
                            <SelectItem key={qcm.id}>
                              {qcm.titre}
                            </SelectItem>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          startContent={<Plus className="w-3 h-3" />}
                          onPress={handleCreateNewQuiz}
                          className="w-full"
                        >
                          Créer un nouveau quiz
                        </Button>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Dates et durée */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="dateDebut"
                  control={control}
                  render={({ field }) => {
                    // Convertir la chaîne datetime-local en ZonedDateTime
                    const getValue = () => {
                      if (!field.value) return null
                      try {
                        // Format attendu: YYYY-MM-DDTHH:mm
                        // Convertir en format ISO avec timezone pour parseZonedDateTime
                        const timeZone = getLocalTimeZone()
                        const isoString = `${field.value}:00[${timeZone}]`
                        return parseZonedDateTime(isoString)
                      } catch {
                        return null
                      }
                    }

                    return (
                      <DatePicker
                        label="Date et heure de début"
                        granularity="minute"
                        value={getValue()}
                        onChange={(value: ZonedDateTime | null) => {
                          if (value) {
                            // Format: YYYY-MM-DDTHH:mm
                            const formatted = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}T${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
                            field.onChange(formatted)
                          } else {
                            field.onChange('')
                          }
                        }}
                        isInvalid={!!errors.dateDebut}
                        errorMessage={errors.dateDebut?.message as string}
                        isRequired
                        selectorIcon={<Calendar className="w-4 h-4" />}
                      />
                    )
                  }}
                />
                <Controller
                  name="dateFin"
                  control={control}
                  render={({ field }) => {
                    // Convertir la chaîne datetime-local en ZonedDateTime
                    const getValue = () => {
                      if (!field.value) return null
                      try {
                        // Format attendu: YYYY-MM-DDTHH:mm
                        // Convertir en format ISO avec timezone pour parseZonedDateTime
                        const timeZone = getLocalTimeZone()
                        const isoString = `${field.value}:00[${timeZone}]`
                        return parseZonedDateTime(isoString)
                      } catch {
                        return null
                      }
                    }

                    return (
                      <DatePicker
                        label="Date et heure de fin"
                        granularity="minute"
                        value={getValue()}
                        onChange={(value: ZonedDateTime | null) => {
                          if (value) {
                            // Format: YYYY-MM-DDTHH:mm
                            const formatted = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}T${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
                            field.onChange(formatted)
                          } else {
                            field.onChange('')
                          }
                        }}
                        isInvalid={!!errors.dateFin}
                        errorMessage={errors.dateFin?.message as string}
                        isRequired
                        selectorIcon={<Calendar className="w-4 h-4" />}
                      />
                    )
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Durée (minutes)"
                  type="number"
                  placeholder="60"
                  min={5}
                  max={480}
                  {...register('dureeMinutes', { valueAsNumber: true })}
                  isInvalid={!!errors.dureeMinutes}
                  errorMessage={errors.dureeMinutes?.message as string}
                  isRequired
                />

                <Input
                  label="Nombre de tentatives maximum"
                  type="number"
                  placeholder="1"
                  min={1}
                  {...register('tentativesMax', { valueAsNumber: true })}
                  isInvalid={!!errors.tentativesMax}
                  errorMessage={errors.tentativesMax?.message as string}
                />
              </div>

              {/* Options de configuration */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-default-700">Options de configuration</h3>
                <div className="flex items-center gap-2">
                <Controller
                  name="melangeQuestions"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    >
                      Mélanger les questions
                    </Switch>
                  )}
                />

                <Controller
                  name="melangeOptions"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    >
                      Mélanger les options de réponse
                    </Switch>
                  )}
                />

                <Controller
                  name="afficherCorrection"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    >
                      Afficher la correction après la session
                    </Switch>
                  )}
                />
                </div>
                
              </div>

              {/* Note de passage */}
              <Input
                label="Note de passage (%)"
                type="number"
                placeholder="50"
                min={0}
                max={100}
                {...register('notePassage', { valueAsNumber: true })}
                isInvalid={!!errors.notePassage}
                errorMessage={errors.notePassage?.message as string}
                description="Note minimale requise pour réussir la session (en pourcentage)"
              />
            </div>
            <div className="flex justify-end">
            <Button
              variant="light"
              onPress={handleClose}
              isDisabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting}
              startContent={<Plus className="w-4 h-4" />}
            >
              Créer la session
            </Button>
            </div>
          </ModalBody>

          <ModalFooter className="pt-4 pb-4">
           
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>

    {/* Modal de création de QCM */}
    <CreateQCMModal
      isOpen={isQCMOpen}
      onClose={onQCMClose}
      onSuccess={handleQCMCreated}
    />
    </>
  )
}

