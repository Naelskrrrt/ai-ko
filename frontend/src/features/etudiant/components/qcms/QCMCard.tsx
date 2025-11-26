'use client'

import * as React from 'react'
import { Card, CardBody, CardFooter, Button, Chip } from '@heroui/react'
import { Clock, BookOpen, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { QCMDisponible } from '../../types/qcms.types'

interface QCMCardProps {
  qcm: QCMDisponible
}

export function QCMCard({ qcm }: QCMCardProps) {
  const router = useRouter()

  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'facile':
        return 'success'
      case 'moyen':
        return 'warning'
      case 'difficile':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold">{qcm.titre}</h3>
          {qcm.difficultyLevel && (
            <Chip size="sm" color={getDifficultyColor(qcm.difficultyLevel)} variant="flat">
              {qcm.difficultyLevel}
            </Chip>
          )}
        </div>

        {qcm.description && (
          <p className="text-sm text-default-600 mb-4 line-clamp-2">{qcm.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-default-500">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{qcm.matiere}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{qcm.duree} min</span>
          </div>
          <span>{qcm.nombreQuestions} questions</span>
        </div>
      </CardBody>

      <CardFooter>
        <Button
          color="primary"
          variant="flat"
          endContent={<ArrowRight className="w-4 h-4" />}
          onPress={() => router.push(`/etudiant/qcms/${qcm.id}`)}
          className="w-full"
        >
          Commencer le QCM
        </Button>
      </CardFooter>
    </Card>
  )
}







