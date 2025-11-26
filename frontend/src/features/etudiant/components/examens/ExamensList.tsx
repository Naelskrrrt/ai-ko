'use client'

import useSWR from 'swr'
import { Tabs, Tab } from '@heroui/tabs'
import { Card, CardBody } from '@heroui/card'
import { FileX } from 'lucide-react'
import { examensService } from '../../services/examens.service'
import { ExamenCard } from './ExamenCard'
import type { Examen } from '../../types/examens.types'

interface ExamensListProps {
  userId: string
}

export function ExamensList({ userId }: ExamensListProps) {
  // Ne pas faire la requête si userId est vide
  const { data: examens, isLoading, error, mutate } = useSWR(
    userId ? ['examens', userId] : null,
    () => examensService.getAll(userId),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
      errorRetryCount: 0, // Ne pas réessayer en cas d'erreur
      shouldRetryOnError: false, // Désactiver les retries automatiques
      onError: (error) => {
        // Ne pas logger les erreurs 404/400 comme des erreurs critiques
        if (error.response?.status === 404 || error.response?.status === 400) {
          console.warn('Examen non trouvé ou userId invalide:', error.response?.status);
          return;
        }
        console.error('Erreur lors du chargement des examens:', error);
      },
    }
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-default-100 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-danger-500">
        <CardBody>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileX className="h-12 w-12 text-danger mb-3" />
            <p className="text-danger font-semibold">
              Erreur lors du chargement des examens
            </p>
            <p className="text-sm text-default-500 mt-2">
              {error.message || 'Une erreur est survenue'}
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  // Séparer les examens par statut
  const examensDisponibles = examens?.filter((e) => e.statut === 'disponible') || []
  const examensEnCours = examens?.filter((e) => e.statut === 'en_cours') || []
  const examensTermines = examens?.filter((e) => e.statut === 'termine') || []

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileX className="h-12 w-12 text-default-300 mb-4" />
      <h3 className="text-lg font-semibold">{message}</h3>
      <p className="text-default-500 mt-1">
        {message === 'Aucun examen disponible'
          ? "Vous n'avez aucun examen à passer pour le moment"
          : message === 'Aucun examen en cours'
          ? "Vous n'avez pas commencé d'examen"
          : 'Vous n\'avez pas encore terminé d\'examen'}
      </p>
    </div>
  )

  const renderExamensGrid = (examensList: Examen[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {examensList.map((examen) => (
        <ExamenCard key={examen.id} examen={examen} onUpdate={mutate} />
      ))}
    </div>
  )

  return (
    <Tabs
      aria-label="Filtres examens"
      variant="underlined"
      classNames={{
        tabList: 'gap-6',
        cursor: 'w-full bg-theme-primary',
        tab: 'max-w-fit px-0 h-12',
      }}
    >
      <Tab
        key="disponibles"
        title={
          <div className="flex items-center space-x-2">
            <span>Disponibles</span>
            <span className="bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full text-xs">
              {examensDisponibles.length}
            </span>
          </div>
        }
      >
        <div className="mt-6">
          {examensDisponibles.length === 0
            ? renderEmptyState('Aucun examen disponible')
            : renderExamensGrid(examensDisponibles)}
        </div>
      </Tab>

      <Tab
        key="en_cours"
        title={
          <div className="flex items-center space-x-2">
            <span>En cours</span>
            <span className="bg-warning-100 text-warning px-2 py-0.5 rounded-full text-xs">
              {examensEnCours.length}
            </span>
          </div>
        }
      >
        <div className="mt-6">
          {examensEnCours.length === 0
            ? renderEmptyState('Aucun examen en cours')
            : renderExamensGrid(examensEnCours)}
        </div>
      </Tab>

      <Tab
        key="termines"
        title={
          <div className="flex items-center space-x-2">
            <span>Terminés</span>
            <span className="bg-success-100 text-success px-2 py-0.5 rounded-full text-xs">
              {examensTermines.length}
            </span>
          </div>
        }
      >
        <div className="mt-6">
          {examensTermines.length === 0
            ? renderEmptyState('Aucun examen terminé')
            : renderExamensGrid(examensTermines)}
        </div>
      </Tab>
    </Tabs>
  )
}
