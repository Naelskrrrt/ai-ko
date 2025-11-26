'use client'

import * as React from 'react'
import { use } from 'react'
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@heroui/button'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/providers/AuthProvider'
import { qcmService } from '@/features/enseignant/services/qcm.service'
import { useToast } from '@/hooks/use-toast'
import useSWR from 'swr'
import type { QCM } from '@/features/enseignant/types/enseignant.types'
import { QCMPlayer } from '@/features/etudiant/components/qcms/QCMPlayer'

interface ShareQCMPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ShareQCMPage({ params }: ShareQCMPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [showPlayer, setShowPlayer] = React.useState(false)

  // Vérifier l'authentification
  React.useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: 'Authentification requise',
        description: 'Vous devez être connecté pour accéder à ce QCM.',
        variant: 'warning',
      })
      router.push(`/login?redirect=/share/qcm/${id}`)
    }
  }, [user, authLoading, router, id, toast])

  // Charger le QCM
  const { data: qcm, isLoading, error } = useSWR<QCM>(
    user ? ['qcm-share', id] : null,
    () => qcmService.getQCMById(id),
    {
      revalidateOnFocus: false,
      onError: (err: any) => {
        if (err.response?.status === 403) {
          toast({
            title: 'Accès refusé',
            description: "Vous n'avez pas la permission d'accéder à ce QCM. Il doit être publié pour être accessible.",
            variant: 'error',
          })
        } else if (err.response?.status === 404) {
          toast({
            title: 'QCM non trouvé',
            description: 'Le QCM demandé n\'existe pas.',
            variant: 'error',
          })
        }
      },
    }
  )

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-lg">Vérification de l'authentification...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-semibold mb-2">Authentification requise</h2>
            <p className="text-default-500 mb-4">
              Vous devez être connecté pour accéder à ce QCM.
            </p>
            <Button
              variant="flat"
              color="primary"
              onPress={() => router.push(`/login?redirect=/share/qcm/${id}`)}
            >
              Se connecter
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-lg">Chargement du QCM...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error || !qcm) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-danger" />
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-default-500 mb-4">
              {error?.response?.status === 403
                ? "Vous n'avez pas la permission d'accéder à ce QCM. Il doit être publié pour être accessible."
                : error?.response?.status === 404
                ? 'Le QCM demandé n\'existe pas.'
                : 'Une erreur est survenue lors du chargement du QCM.'}
            </p>
            <Button
              variant="flat"
              startContent={<ArrowLeft className="w-4 h-4" />}
              onPress={() => router.push('/')}
            >
              Retour à l'accueil
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Si l'utilisateur clique sur "Commencer le QCM", afficher le player
  if (showPlayer && user?.id) {
    return (
      <div className="container mx-auto max-w-4xl py-6 space-y-6">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => setShowPlayer(false)}
        >
          Retour
        </Button>
        <QCMPlayer qcmId={id} userId={user.id} />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{qcm.titre}</h1>
            <p className="text-default-500">
              {qcm.description || 'QCM partagé'}
            </p>
          </div>
        </div>
        <Button
          variant="flat"
          startContent={<ArrowLeft className="h-4 w-4" />}
          onPress={() => router.back()}
        >
          Retour
        </Button>
      </div>

      {/* Informations du QCM */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold">Informations</h2>
            <Chip
              color={qcm.status === 'published' ? 'success' : 'warning'}
              variant="flat"
            >
              {qcm.status === 'published' ? 'Publié' : qcm.status === 'draft' ? 'Brouillon' : 'Archivé'}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-default-500">Matière</p>
              <p className="font-medium">{qcm.matiere || 'Non spécifiée'}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Nombre de questions</p>
              <p className="font-medium">{qcm.nombreQuestions || 0}</p>
            </div>
            {qcm.duree && (
              <div>
                <p className="text-sm text-default-500">Durée</p>
                <p className="font-medium">{qcm.duree} minutes</p>
              </div>
            )}
            {qcm.createur && (
              <div>
                <p className="text-sm text-default-500">Créateur</p>
                <p className="font-medium">{qcm.createur.name || qcm.createur.email}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Bouton pour commencer le QCM */}
      <Card>
        <CardBody className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">Prêt à commencer ?</h2>
          <p className="text-default-500 mb-6">
            {qcm.nombreQuestions || 0} question{qcm.nombreQuestions !== 1 ? 's' : ''} • 
            {qcm.duree ? ` ${qcm.duree} minute${qcm.duree !== 1 ? 's' : ''}` : ' Durée illimitée'}
          </p>
          <Button
            color="primary"
            size="lg"
            onPress={() => setShowPlayer(true)}
            startContent={<FileText className="w-5 h-5" />}
          >
            Commencer le QCM
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

