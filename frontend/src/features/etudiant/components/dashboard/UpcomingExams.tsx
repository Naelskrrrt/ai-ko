'use client'

import useSWR from 'swr'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Calendar, Clock, BookOpen, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { etudiantService } from '../../services/etudiant.service'

interface UpcomingExamsProps {
  userId: string
}

export function UpcomingExams({ userId }: UpcomingExamsProps) {
  const router = useRouter()
  const { data: examens, isLoading } = useSWR(
    userId ? ['upcoming-exams', userId] : null,
    () => etudiantService.getUpcomingExams(userId),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
      errorRetryCount: 0,
      shouldRetryOnError: false,
    }
  )

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Examens à venir</p>
            <p className="text-small text-default-500">
              Chargement...
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-3 bg-default-100 rounded-lg animate-pulse h-20"
              />
            ))}
          </div>
        </CardBody>
      </Card>
    )
  }

  const examensDisponibles = examens?.filter((e) => !e.est_commence) || []

  return (
    <Card className="h-full">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col flex-1">
          <p className="text-md font-semibold">Examens à venir</p>
          <p className="text-small text-default-500">
            {examensDisponibles.length} examen
            {examensDisponibles.length > 1 ? 's' : ''} disponible
            {examensDisponibles.length > 1 ? 's' : ''}
          </p>
        </div>
        {examensDisponibles.length > 0 && (
          <Button
            size="sm"
            variant="flat"
            onPress={() => router.push('/etudiant/examens')}
          >
            Voir tous
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {examensDisponibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-12 w-12 text-default-300 mb-3" />
            <p className="text-sm text-default-500">
              Aucun examen disponible pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {examensDisponibles.slice(0, 3).map((examen) => (
              <div
                key={examen.id}
                className="p-3 border border-default-200 rounded-lg hover:bg-default-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm line-clamp-1">
                      {examen.titre}
                    </h4>
                    <p className="text-xs text-default-500 mt-1">
                      {examen.matiere}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-default-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(examen.date_debut).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{examen.duree_minutes} min</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20"
                    onPress={() => router.push(`/etudiant/examens/${examen.id}`)}
                    startContent={<Play className="h-3 w-3" />}
                  >
                    Commencer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
