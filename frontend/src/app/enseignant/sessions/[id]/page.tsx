'use client'

import * as React from 'react'
import { use } from 'react'
import { ArrowLeft, Calendar, Save, Trash2, Play, Square, RefreshCw, Edit2, Eye, Link as LinkIcon } from 'lucide-react'
import { Button } from '@heroui/button'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Input, Textarea } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { Switch } from '@heroui/switch'
import { DatePicker } from '@heroui/date-picker'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/providers/AuthProvider'
import { sessionService } from '@/features/enseignant/services/session.service'
import { qcmService } from '@/features/enseignant/services/qcm.service'
import { enseignantService } from '@/features/enseignant/services/enseignant.service'
import { useToast } from '@/hooks/use-toast'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SessionExamen, SessionFormData } from '@/features/enseignant/types/enseignant.types'
import { SessionStatsSummary } from '@/features/enseignant/components/sessions/SessionStatsSummary'
import { SessionStatisticsModal } from '@/features/enseignant/components/sessions/SessionStatisticsModal'
import { useDisclosure } from '@heroui/modal'
import { parseZonedDateTime, getLocalTimeZone, ZonedDateTime } from '@internationalized/date'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

interface SessionDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Schéma de validation Zod pour l'édition
const sessionEditSchema = z.object({
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

type SessionEditFormData = z.infer<typeof sessionEditSchema>

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const { isOpen: isStatsModalOpen, onOpen: onStatsModalOpen, onClose: onStatsModalClose } = useDisclosure()
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure()
  const { isOpen: isTerminerConfirmOpen, onOpen: onTerminerConfirmOpen, onClose: onTerminerConfirmClose } = useDisclosure()

  // Charger la session
  const { data: session, isLoading, error, mutate, isValidating: isValidatingSession } = useSWR<SessionExamen>(
    ['session-detail', id],
    () => sessionService.getSessionById(id),
    {
      revalidateOnFocus: false,
    }
  )

  // Charger les QCMs (publiés)
  const { data: qcmsData } = useSWR(
    ['qcms-for-session-edit'],
    async () => {
      const published = await qcmService.getQCMs({ status: 'published', limit: 100 })
      return published
    }
  )
  const qcms = qcmsData?.data || []

  // Charger les classes
  const { data: classesData } = useSWR('classes', () => enseignantService.getClasses())
  const classes = classesData || []

  // Fonction pour rafraîchir les données
  const handleRefresh = async () => {
    await mutate()
    toast({
      title: 'Données rafraîchies',
      description: 'Les informations de la session ont été mises à jour',
      variant: 'success',
    })
  }

  const isRefreshing = isValidatingSession

  // Formulaire d'édition
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<SessionEditFormData>({
    resolver: zodResolver(sessionEditSchema),
    defaultValues: session
      ? {
          titre: session.titre,
          description: session.description || '',
          dateDebut: session.dateDebut,
          dateFin: session.dateFin,
          dureeMinutes: session.dureeMinutes,
          tentativesMax: session.tentativesMax,
          melangeQuestions: session.melangeQuestions ?? false,
          melangeOptions: session.melangeOptions ?? false,
          afficherCorrection: session.afficherCorrection ?? false,
          notePassage: (session.notePassage / 20) * 100, // Convertir de note sur 20 en pourcentage
          qcmId: session.qcmId,
          classeId: session.classeId,
        }
      : undefined,
  })

  // Réinitialiser le formulaire quand la session est chargée
  React.useEffect(() => {
    if (session && !isEditing) {
      reset({
        titre: session.titre,
        description: session.description || '',
        dateDebut: session.dateDebut,
        dateFin: session.dateFin,
        dureeMinutes: session.dureeMinutes,
        tentativesMax: session.tentativesMax,
        melangeQuestions: session.melangeQuestions ?? false,
        melangeOptions: session.melangeOptions ?? false,
        afficherCorrection: session.afficherCorrection ?? false,
        notePassage: (session.notePassage / 20) * 100,
        qcmId: session.qcmId,
        classeId: session.classeId,
      })
    }
  }, [session, reset, isEditing])

  const onSubmit = async (data: SessionEditFormData) => {
    if (!session) return

    setIsSaving(true)
    try {
      const sessionData: Partial<SessionFormData> = {
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
      }

      await sessionService.updateSession(session.id, sessionData)
      toast({
        title: 'Session mise à jour',
        description: 'La session a été modifiée avec succès',
        variant: 'success',
      })
      setIsEditing(false)
      mutate()
    } catch (error: any) {
      console.error('Erreur mise à jour session:', error)
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la mise à jour de la session',
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (!session) return
    onDeleteConfirmOpen()
  }

  const confirmDelete = async () => {
    if (!session) return
    try {
      await sessionService.deleteSession(session.id)
      toast({
        title: 'Session supprimée',
        description: 'La session a été supprimée avec succès',
        variant: 'success',
      })
      router.push('/enseignant/sessions')
    } catch (error: any) {
      console.error('Erreur suppression session:', error)
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la suppression de la session',
        variant: 'error',
      })
    }
  }

  const handleDemarrer = async () => {
    if (!session) return

    try {
      await sessionService.demarrerSession(session.id)
      toast({
        title: 'Session démarrée',
        description: 'La session a été démarrée avec succès',
        variant: 'success',
      })
      mutate()
    } catch (error: any) {
      console.error('Erreur démarrage session:', error)
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors du démarrage de la session',
        variant: 'error',
      })
    }
  }

  const handleTerminer = () => {
    if (!session) return
    onTerminerConfirmOpen()
  }

  const confirmTerminer = async () => {
    if (!session) return
    try {
      await sessionService.terminerSession(session.id)
      toast({
        title: 'Session terminée',
        description: 'La session a été terminée avec succès',
        variant: 'success',
      })
      mutate()
    } catch (error: any) {
      console.error('Erreur fin session:', error)
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la terminaison de la session',
        variant: 'error',
      })
    }
  }

  const getStatusColor = (status: SessionExamen['status']) => {
    switch (status) {
      case 'en_cours':
        return 'success'
      case 'programmee':
        return 'primary'
      case 'terminee':
        return 'default'
      case 'annulee':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: SessionExamen['status']) => {
    switch (status) {
      case 'en_cours':
        return 'En cours'
      case 'programmee':
        return 'Programmée'
      case 'terminee':
        return 'Terminée'
      case 'annulee':
        return 'Annulée'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-lg">Chargement de la session...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-default-500 mb-4">
              {error?.response?.status === 404
                ? 'La session demandée n\'existe pas.'
                : 'Une erreur est survenue lors du chargement de la session.'}
            </p>
            <Button
              variant="flat"
              startContent={<ArrowLeft className="w-4 h-4" />}
              onPress={() => router.push('/enseignant/sessions')}
            >
              Retour à la liste
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Modifier la session' : session.titre}
            </h1>
            <p className="text-default-500">
              {isEditing ? 'Modifiez les informations de la session' : 'Détails de la session'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="flat"
                startContent={<ArrowLeft className="h-4 w-4" />}
                onPress={() => router.push('/enseignant/sessions')}
              >
                Retour
              </Button>
              <Button
                isIconOnly
                variant="flat"
                onPress={handleRefresh}
                isLoading={isRefreshing}
                aria-label="Rafraîchir les données"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="flat"
                color="primary"
                startContent={<Edit2 className="h-4 w-4" />}
                onPress={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="flat"
                onPress={() => {
                  setIsEditing(false)
                  reset()
                }}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                startContent={<Save className="h-4 w-4" />}
                onPress={() => {
                  const submitHandler = handleSubmit(onSubmit)
                  submitHandler()
                }}
                isLoading={isSaving}
                isDisabled={!isDirty}
              >
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Formulaire d'édition ou affichage */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Informations de la session</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Titre"
                placeholder="Titre de la session"
                {...register('titre', { required: 'Le titre est requis' })}
                errorMessage={errors.titre?.message}
                isInvalid={!!errors.titre}
              />

              <Textarea
                label="Description"
                placeholder="Description de la session"
                {...register('description')}
                errorMessage={errors.description?.message}
                isInvalid={!!errors.description}
              />

              {/* Sélection du QCM */}
              <Controller
                name="qcmId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="QCM"
                    placeholder="Sélectionner un QCM"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string
                      field.onChange(selectedKey || undefined)
                    }}
                    isInvalid={!!errors.qcmId}
                    errorMessage={errors.qcmId?.message}
                    isRequired
                  >
                    {qcms.map((qcm) => (
                      <SelectItem key={qcm.id}>
                        {qcm.titre}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              {/* Dates et durée */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="dateDebut"
                  control={control}
                  render={({ field }) => {
                    const getValue = () => {
                      if (!field.value) return null
                      try {
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
                    const getValue = () => {
                      if (!field.value) return null
                      try {
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
                <div className="flex flex-col gap-2">
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
            </CardBody>
          </Card>
        </form>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-semibold">Informations</h2>
              <Chip
                color={getStatusColor(session.status)}
                variant="flat"
              >
                {getStatusLabel(session.status)}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-default-500">Titre</p>
                <p className="font-medium text-lg">{session.titre}</p>
              </div>
              {session.description && (
                <div>
                  <p className="text-sm text-default-500">Description</p>
                  <p className="font-medium">{session.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-default-500">Date de début</p>
                  <p className="font-medium">{formatDate(session.dateDebut)}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Date de fin</p>
                  <p className="font-medium">{formatDate(session.dateFin)}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Durée</p>
                  <p className="font-medium">{session.dureeMinutes} minutes</p>
                </div>
                {session.qcm && (
                  <div>
                    <p className="text-sm text-default-500">QCM associé</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.qcm.titre}</p>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => router.push(`/enseignant/qcm/${session.qcmId}`)}
                        aria-label="Voir le QCM"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {session.classe && (
                  <div>
                    <p className="text-sm text-default-500">Classe</p>
                    <p className="font-medium">{session.classe.nom} ({session.classe.code})</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-default-500">Participants</p>
                  <p className="font-medium">{session.nombreParticipants || 0}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-default-200">
                <div>
                  <p className="text-sm text-default-500">Tentatives max</p>
                  <p className="font-medium">{session.tentativesMax}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Note de passage</p>
                  <p className="font-medium">{((session.notePassage / 20) * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Mélanger questions</p>
                  <Chip size="sm" variant="flat" color={session.melangeQuestions ? 'success' : 'default'}>
                    {session.melangeQuestions ? 'Oui' : 'Non'}
                  </Chip>
                </div>
                <div>
                  <p className="text-sm text-default-500">Mélanger options</p>
                  <Chip size="sm" variant="flat" color={session.melangeOptions ? 'success' : 'default'}>
                    {session.melangeOptions ? 'Oui' : 'Non'}
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Statistiques */}
      {!isEditing && session && (
        <SessionStatsSummary sessionId={session.id} onOpenModal={onStatsModalOpen} />
      )}

      {/* Actions */}
      {!isEditing && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 flex-wrap">
              {session.status === 'programmee' && (
                <Button
                  color="success"
                  variant="flat"
                  startContent={<Play className="w-4 h-4" />}
                  onPress={handleDemarrer}
                >
                  Démarrer
                </Button>
              )}
              {session.status === 'en_cours' && (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<Square className="w-4 h-4" />}
                  onPress={handleTerminer}
                >
                  Terminer
                </Button>
              )}
              <Button
                color="primary"
                variant="flat"
                startContent={<Eye className="w-4 h-4" />}
                onPress={() => router.push(`/enseignant/sessions/${session.id}/resultats`)}
              >
                Voir les résultats
              </Button>
              <Button
                color="danger"
                variant="flat"
                startContent={<Trash2 className="w-4 h-4" />}
                onPress={handleDelete}
              >
                Supprimer
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal de statistiques */}
      {session && (
        <SessionStatisticsModal
          isOpen={isStatsModalOpen}
          onClose={onStatsModalClose}
          sessionId={session.id}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        onConfirm={confirmDelete}
        title="Supprimer la session"
        message="Êtes-vous sûr de vouloir supprimer cette session ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmColor="danger"
        variant="danger"
      />

      {/* Modal de confirmation de terminaison */}
      <ConfirmDialog
        isOpen={isTerminerConfirmOpen}
        onClose={onTerminerConfirmClose}
        onConfirm={confirmTerminer}
        title="Terminer la session"
        message="Êtes-vous sûr de vouloir terminer cette session ?"
        confirmLabel="Terminer"
        cancelLabel="Annuler"
        confirmColor="warning"
        variant="warning"
      />
    </div>
  )
}

