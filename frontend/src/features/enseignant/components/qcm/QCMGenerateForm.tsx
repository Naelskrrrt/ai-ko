'use client'

import * as React from 'react'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { Tabs, Tab } from '@heroui/tabs'
import { Progress } from '@heroui/progress'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Upload, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { qcmService } from '../../services/qcm.service'
import { enseignantService } from '../../services/enseignant.service'
import { useTaskPolling } from '../../hooks/useTaskPolling'
import { useToast } from '@/hooks/use-toast'
import useSWR from 'swr'

// Schéma de validation Zod
const generateSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(200),
  matiere: z.string().optional(),
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2']).optional(),
  duree: z.number().min(5).max(300).optional(),
  num_questions: z.number().min(1).max(20).optional(),
  source: z.enum(['text', 'document']),
  text: z.string().optional(),
  file: z.any().optional(),
}).refine((data) => {
  if (data.source === 'text') {
    return !!data.text && data.text.length >= 50
  }
  if (data.source === 'document') {
    return !!data.file
  }
  return true
}, {
  message: 'Veuillez fournir du texte (min. 50 caractères) ou un document',
  path: ['text'],
})

type GenerateFormData = z.infer<typeof generateSchema>

interface QCMGenerateFormProps {
  onClose?: () => void
  onSuccess?: (qcmId: string) => void
  isModal?: boolean
  formRef?: React.RefObject<HTMLFormElement>
  onStateChange?: (state: { isSubmitting: boolean; isPolling: boolean }) => void
}

export function QCMGenerateForm({ 
  onClose, 
  onSuccess, 
  isModal = false,
  formRef,
  onStateChange,
}: QCMGenerateFormProps = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const [taskId, setTaskId] = React.useState<string | null>(null)
  const [generatedQCMId, setGeneratedQCMId] = React.useState<string | null>(null)
  const [sourceType, setSourceType] = React.useState<'text' | 'document'>('text')

  // Récupérer les matières
  const { data: matieresData } = useSWR('matieres', () => enseignantService.getMatieres())
  const matieres = matieresData || []

  // Formulaire avec React Hook Form + Zod
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      source: 'text',
      num_questions: 10,
      duree: 60,
    },
  })

  const [estimatedDuration, setEstimatedDuration] = React.useState<number | null>(null)

  // Polling de la tâche de génération
  const { taskStatus, isPolling, progress, estimatedRemainingSeconds } = useTaskPolling({
    taskId,
    interval: 2000,
    timeout: 120000, // 2 minutes
    estimatedDurationSeconds: estimatedDuration || undefined,
    onSuccess: (result) => {
      console.log('✅ Génération réussie:', result)
      const qcmId = generatedQCMId || result?.qcm_id
      
      if (qcmId) {
        toast({
          title: 'QCM généré avec succès !',
          description: result?.message || `Le QCM a été généré avec ${result?.num_questions || 0} questions.`,
          variant: 'success',
        })
        
        if (isModal && onSuccess) {
          onSuccess(qcmId)
        } else if (!isModal) {
          router.push(`/enseignant/qcm/${qcmId}`)
        }
      } else {
        toast({
          title: 'Génération terminée',
          description: 'Le QCM a été généré avec succès.',
          variant: 'success',
        })
      }
    },
    onError: (error) => {
      console.error('❌ Erreur génération:', error)
      toast({
        title: 'Erreur lors de la génération',
        description: error || 'Une erreur est survenue lors de la génération du QCM. Veuillez réessayer.',
        variant: 'error',
      })
      setTaskId(null)
    },
    onTimeout: () => {
      toast({
        title: 'Timeout de génération',
        description: 'La génération a pris trop de temps. Veuillez réessayer avec un texte plus court ou moins de questions.',
        variant: 'error',
      })
      setTaskId(null)
    },
  })

  // Exposer les états au parent si en mode modal
  React.useEffect(() => {
    if (isModal && onStateChange) {
      onStateChange({ isSubmitting, isPolling })
    }
  }, [isModal, isSubmitting, isPolling, onStateChange])


  const onSubmit = async (data: GenerateFormData) => {
    try {
      let response

      if (data.source === 'text' && data.text) {
        // Génération depuis du texte
        response = await qcmService.generateFromText({
          titre: data.titre,
          text: data.text,
          num_questions: data.num_questions || 10,
          matiere: data.matiere,
          niveau: data.niveau,
          duree: data.duree,
        })
      } else if (data.source === 'document' && data.file) {
        // Génération depuis un document
        const file = data.file[0] as File
        const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'docx'
        const base64Content = await qcmService.fileToBase64(file)

        response = await qcmService.generateFromDocument({
          titre: data.titre,
          file_content: base64Content,
          file_type: fileType,
          num_questions: data.num_questions || 10,
          matiere: data.matiere,
          niveau: data.niveau,
          duree: data.duree,
        })
      } else {
        throw new Error('Source de génération invalide')
      }

      // Démarrer le polling
      setTaskId(response.task_id)
      setGeneratedQCMId(response.qcm_id || null)
      
      // Stocker l'estimation de temps si fournie
      if (response.estimated_duration_seconds) {
        setEstimatedDuration(response.estimated_duration_seconds)
      }
      
      toast({
        title: 'Génération démarrée',
        description: `La génération du QCM a été lancée. Temps estimé: ${response.estimated_duration_seconds ? Math.ceil(response.estimated_duration_seconds / 60) : 'quelques'} minute(s)...`,
        variant: 'info',
      })
    } catch (error: any) {
      console.error('Erreur lors du lancement de la génération:', error)
      toast({
        title: 'Erreur lors du lancement',
        description: error.response?.data?.message || 'Erreur lors du lancement de la génération. Veuillez réessayer.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Formulaire */}
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <Input
                label="Titre du QCM"
                placeholder="Ex: QCM de Mathématiques - Chapitre 5"
                {...register('titre')}
                isInvalid={!!errors.titre}
                errorMessage={errors.titre?.message}
                isRequired
                isDisabled={isSubmitting || isPolling}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="matiere"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Matière"
                      placeholder="Sélectionner une matière"
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string
                        field.onChange(selectedKey || undefined)
                      }}
                      isDisabled={isSubmitting || isPolling}
                    >
                      {matieres.map((matiere) => (
                        <SelectItem key={matiere.code}>
                          {matiere.nom}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />

                <Controller
                  name="niveau"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Niveau"
                      placeholder="Sélectionner un niveau"
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string
                        field.onChange(selectedKey || undefined)
                      }}
                      isDisabled={isSubmitting || isPolling}
                    >
                      <SelectItem key="L1">L1</SelectItem>
                      <SelectItem key="L2">L2</SelectItem>
                      <SelectItem key="L3">L3</SelectItem>
                      <SelectItem key="M1">M1</SelectItem>
                      <SelectItem key="M2">M2</SelectItem>
                    </Select>
                  )}
                />
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Durée estimée (minutes)"
                  type="number"
                  placeholder="60"
                  {...register('duree', { valueAsNumber: true })}
                  isInvalid={!!errors.duree}
                  errorMessage={errors.duree?.message}
                />
              </div> */}

              <div className="flex items-center gap-4">
                <Input
                  label="Durée estimée (minutes)"
                  type="number"
                  placeholder="60"
                  {...register('duree', { valueAsNumber: true })}
                  isInvalid={!!errors.duree}
                  errorMessage={errors.duree?.message}
                  isDisabled={isSubmitting || isPolling}
                />
              <Input
                label="Nombre de questions"
                type="number"
                placeholder="10"
                min={1}
                max={20}
                {...register('num_questions', { valueAsNumber: true })}
                isInvalid={!!errors.num_questions}
                errorMessage={errors.num_questions?.message}
                isDisabled={isSubmitting || isPolling}
              />
              </div>

            </div>

            {/* Source de génération */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Source de génération
              </label>
              <Tabs
                selectedKey={sourceType}
                onSelectionChange={(key) => {
                  if (!isSubmitting && !isPolling) {
                    const newSource = key as 'text' | 'document'
                    setSourceType(newSource)
                    setValue('source', newSource)
                  }
                }}
                variant="bordered"
                isDisabled={isSubmitting || isPolling}
              >
                <Tab
                  key="text"
                  title={
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Texte libre</span>
                    </div>
                  }
                >
                  <div className="mt-4">
                    <textarea
                      className="w-full min-h-[200px] p-3 rounded-lg border border-default-300 focus:border-primary focus:outline-none resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Collez ici le contenu de votre cours (minimum 50 caractères)..."
                      {...register('text')}
                      disabled={isSubmitting || isPolling}
                    />
                    {errors.text && (
                      <p className="text-xs text-danger mt-1">{errors.text.message as string}</p>
                    )}
                    <p className="text-xs text-default-400 mt-2">
                      L'IA analysera ce texte pour générer des questions pertinentes
                    </p>
                  </div>
                </Tab>

                <Tab
                  key="document"
                  title={
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Document (PDF/DOCX)</span>
                    </div>
                  }
                >
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="w-full p-3 rounded-lg border border-default-300 focus:border-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      {...register('file')}
                      disabled={isSubmitting || isPolling}
                    />
                    {errors.file && (
                      <p className="text-xs text-danger mt-1">{errors.file.message as string}</p>
                    )}
                    <p className="text-xs text-default-400 mt-2">
                      Formats acceptés: PDF, DOCX (max 10 Mo)
                    </p>
                  </div>
                </Tab>
              </Tabs>
            </div>

            {/* Boutons d'action - seulement si pas en modal */}
            {!isModal && (
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  color="primary"
                  startContent={<Sparkles className="w-4 h-4" />}
                  isLoading={isSubmitting || isPolling}
                  isDisabled={isPolling}
                >
                  {isPolling ? 'Génération en cours...' : 'Générer le QCM'}
                </Button>
                <Button
                  type="button"
                  variant="flat"
                  onPress={() => {
                    if (isModal && onClose) {
                      onClose()
                    } else {
                      router.back()
                    }
                  }}
                  isDisabled={isPolling}
                >
                  Annuler
                </Button>
              </div>
            )}
          </form>

      {/* Progression de la génération */}
      {isPolling && taskStatus && (
        <div className="space-y-4 pt-4 border-t border-divider">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <div className="flex-1">
              <p className="font-medium">Génération en cours...</p>
              <p className="text-sm text-default-500">
                {taskStatus.result?.status || taskStatus.result?.message || taskStatus.message || 'L\'IA analyse votre contenu et génère les questions'}
              </p>
            </div>
          </div>

          <Progress
            value={progress}
            color="primary"
            className="w-full"
            showValueLabel
            label="Progression"
          />

          <div className="flex items-center justify-between text-xs text-default-400">
            <p>
              {taskStatus.status === 'PENDING' && 'En attente de traitement...'}
              {taskStatus.status === 'PROGRESS' && (taskStatus.result?.status || 'En cours de traitement...')}
              {taskStatus.status === 'SUCCESS' && 'Terminé avec succès!'}
            </p>
            {estimatedRemainingSeconds !== null && estimatedRemainingSeconds > 0 && (
              <p className="font-medium text-primary">
                Temps restant estimé: {Math.ceil(estimatedRemainingSeconds)}s
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
