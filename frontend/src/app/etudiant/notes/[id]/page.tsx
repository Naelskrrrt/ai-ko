'use client'

import * as React from 'react'
import { use } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@heroui/button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/providers/AuthProvider'
import { ResultatView } from '@/features/etudiant/components/resultats/ResultatView'

interface NoteDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.id || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-success-50">
            <FileText className="h-8 w-8 text-success" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Résultat de l'examen</h1>
            <p className="text-default-500">
              Consultez votre performance et les feedbacks
            </p>
          </div>
        </div>
        <Button
          variant="flat"
          startContent={<ArrowLeft className="h-4 w-4" />}
          onPress={() => router.push('/etudiant/notes')}
        >
          Retour aux notes
        </Button>
      </div>

      {/* Résultat */}
      <ResultatView examId={id} userId={userId} />
    </div>
  )
}

