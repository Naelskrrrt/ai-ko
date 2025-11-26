'use client'

import * as React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Progress } from '@heroui/progress'
import {
  Users,
  Download,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import useSWR from 'swr'
import { sessionService } from '../../services/session.service'
import type { ResultatEtudiant } from '../../types/enseignant.types'

interface ResultatsSessionProps {
  sessionId: string
}

export function ResultatsSession({ sessionId }: ResultatsSessionProps) {
  // Récupérer les résultats de la session
  const { data: resultats, isLoading, error } = useSWR(
    ['resultats-session', sessionId],
    () => sessionService.getResultatsSession(sessionId)
  )

  const resultatsEtudiants = resultats || []

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    if (!resultatsEtudiants.length) {
      return {
        total_etudiants: 0,
        termine: 0,
        en_cours: 0,
        moyenne: 0,
        taux_reussite: 0,
        meilleure_note: 0,
        moins_bonne_note: 0,
      }
    }

    const termines = resultatsEtudiants.filter((r) => r.statut === 'termine')
    const notes = termines.map((r) => r.pourcentage)

    return {
      total_etudiants: resultatsEtudiants.length,
      termine: termines.length,
      en_cours: resultatsEtudiants.filter((r) => r.statut === 'en_cours').length,
      moyenne: notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0,
      taux_reussite:
        termines.length > 0
          ? (termines.filter((r) => r.pourcentage >= 50).length / termines.length) * 100
          : 0,
      meilleure_note: notes.length > 0 ? Math.max(...notes) : 0,
      moins_bonne_note: notes.length > 0 ? Math.min(...notes) : 0,
    }
  }, [resultatsEtudiants])

  const handleExportPDF = () => {
    // TODO: Implémenter l'export PDF des résultats
    alert('Export PDF en cours de développement')
  }

  const getStatutColor = (statut: ResultatEtudiant['statut']) => {
    switch (statut) {
      case 'termine':
        return 'success'
      case 'en_cours':
        return 'primary'
      case 'abandonne':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatutLabel = (statut: ResultatEtudiant['statut']) => {
    switch (statut) {
      case 'termine':
        return 'Terminé'
      case 'en_cours':
        return 'En cours'
      case 'abandonne':
        return 'Abandonné'
      default:
        return statut
    }
  }

  const getNoteColor = (pourcentage: number) => {
    if (pourcentage >= 75) return 'success'
    if (pourcentage >= 50) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-blue-500 rounded-lg p-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Étudiants</p>
              <p className="text-2xl font-bold">{stats.total_etudiants}</p>
              <p className="text-xs text-default-400">
                {stats.termine} terminés, {stats.en_cours} en cours
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-green-500 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Moyenne Générale</p>
              <p className="text-2xl font-bold">{stats.moyenne.toFixed(1)}%</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-purple-500 rounded-lg p-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Taux de Réussite</p>
              <p className="text-2xl font-bold">{stats.taux_reussite.toFixed(0)}%</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-orange-500 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Meilleure Note</p>
              <p className="text-2xl font-bold">{stats.meilleure_note.toFixed(0)}%</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Liste des résultats */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Résultats des Étudiants</h3>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Download className="w-4 h-4" />}
            onPress={handleExportPDF}
          >
            Exporter PDF
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
              Erreur lors du chargement des résultats
            </div>
          ) : resultatsEtudiants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-default-300" />
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-default-500">
                Aucun étudiant n'a encore passé cette session
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resultatsEtudiants.map((resultat) => (
                <div
                  key={resultat.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
                >
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">
                      {resultat.etudiant.prenom[0]}
                      {resultat.etudiant.nom[0]}
                    </span>
                  </div>

                  {/* Informations étudiant */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {resultat.etudiant.prenom} {resultat.etudiant.nom}
                    </h4>
                    <p className="text-sm text-default-500">
                      {resultat.etudiant.email}
                    </p>
                  </div>

                  {/* Note et progression */}
                  {resultat.statut === 'termine' ? (
                    <div className="flex-shrink-0 text-right min-w-[120px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold">
                          {resultat.pourcentage.toFixed(0)}%
                        </span>
                        {resultat.pourcentage >= 50 ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-danger" />
                        )}
                      </div>
                      <p className="text-xs text-default-400">
                        {resultat.note.toFixed(1)} / {resultat.noteMax.toFixed(1)}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 min-w-[120px]">
                      <Chip size="sm" color={getStatutColor(resultat.statut)} variant="flat">
                        {getStatutLabel(resultat.statut)}
                      </Chip>
                    </div>
                  )}

                  {/* Barre de progression */}
                  {resultat.statut === 'termine' && (
                    <div className="w-32 flex-shrink-0">
                      <Progress
                        value={resultat.pourcentage}
                        color={getNoteColor(resultat.pourcentage)}
                        size="sm"
                        showValueLabel={false}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
