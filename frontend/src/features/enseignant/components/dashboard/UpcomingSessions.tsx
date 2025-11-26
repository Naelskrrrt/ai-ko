'use client'

import * as React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Calendar, Plus, Clock } from 'lucide-react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { sessionService } from '../../services/session.service'
import type { SessionExamen } from '../../types/enseignant.types'

interface UpcomingSessionsProps {
  userId: string
}

export function UpcomingSessions({ userId }: UpcomingSessionsProps) {
  const router = useRouter()

  // Récupérer les sessions à venir
  const { data, isLoading, error } = useSWR(
    ['enseignant-upcoming-sessions', userId],
    () => sessionService.getSessions({ limit: 5, status: 'programmee' })
  )

  const sessions = data?.data || []

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
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex justify-between items-center pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Sessions Programmées</h3>
        </div>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => router.push('/enseignant/sessions/nouvelle')}
        >
          Nouvelle Session
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-default-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-danger">
            Erreur lors du chargement des sessions
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-default-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune session programmée</p>
            
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-100 cursor-pointer transition-colors"
                onClick={() => router.push(`/enseignant/sessions/${session.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{session.titre}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-default-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(session.dateDebut)}</span>
                    <span>•</span>
                    <span>{session.dureeMinutes} min</span>
                  </div>
                  {session.qcm && (
                    <p className="text-xs text-default-400 mt-1">
                      QCM: {session.qcm.titre}
                    </p>
                  )}
                </div>
                <Chip size="sm" color={getStatusColor(session.status)} variant="flat">
                  {getStatusLabel(session.status)}
                </Chip>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
