'use client'

import * as React from 'react'
import { Card, CardBody } from '@heroui/card'
import { BookOpen, FileText, Users, TrendingUp } from 'lucide-react'
import useSWR from 'swr'
import { enseignantService } from '../../services/enseignant.service'
import { qcmService } from '../../services/qcm.service'
import { sessionService } from '../../services/session.service'

interface StatsCardsProps {
  userId: string
}

export function StatsCards({ userId }: StatsCardsProps) {
  // Récupérer les QCMs
  const { data: qcmsData } = useSWR(
    ['enseignant-qcms', userId],
    () => qcmService.getQCMs({ limit: 1000 })
  )

  // Récupérer les sessions
  const { data: sessionsData } = useSWR(
    ['enseignant-sessions', userId],
    () => sessionService.getSessions({ limit: 1000 })
  )

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    const qcms = qcmsData?.data || []
    const sessions = sessionsData?.data || []

    return {
      total_qcms: qcms.length,
      qcms_publies: qcms.filter((q) => q.status === 'published').length,
      qcms_brouillon: qcms.filter((q) => q.status === 'draft').length,
      total_sessions: sessions.length,
      sessions_actives: sessions.filter((s) => s.status === 'en_cours').length,
      sessions_programmees: sessions.filter((s) => s.status === 'programmee').length,
    }
  }, [qcmsData, sessionsData])

  const cards = [
    {
      title: 'Total QCMs',
      value: stats.total_qcms,
      description: `${stats.qcms_publies} publiés, ${stats.qcms_brouillon} brouillons`,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Sessions Actives',
      value: stats.sessions_actives,
      description: `${stats.sessions_programmees} programmées`,
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      title: 'Total Sessions',
      value: stats.total_sessions,
      description: 'Toutes les sessions créées',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Taux de Réussite',
      value: '—',
      description: 'Disponible prochainement',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="border-none shadow-sm">
            <CardBody className="flex flex-row items-center gap-4 p-5">
              <div className={`${card.color} rounded-lg p-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-default-500">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-default-400 mt-1">{card.description}</p>
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
