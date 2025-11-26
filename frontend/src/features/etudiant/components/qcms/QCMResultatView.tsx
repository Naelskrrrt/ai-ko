'use client'

import useSWR from 'swr'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Tabs, Tab } from '@heroui/tabs'
import {
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { qcmsService } from '../../services/qcms.service'
import { FeedbackPanel } from '../resultats/FeedbackPanel'

interface QCMResultatViewProps {
  resultatId: string
}

export function QCMResultatView({ resultatId }: QCMResultatViewProps) {
  const { data: resultat, isLoading, error } = useSWR(
    ['qcm-resultat', resultatId],
    () => qcmsService.getResultat(resultatId),
    {
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-default-100 animate-pulse rounded-lg"
          />
        ))}
      </div>
    )
  }

  if (error || !resultat) {
    return (
      <Card className="border-danger-500">
        <CardBody className="text-center py-12">
          <XCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-lg font-semibold text-danger">
            Erreur lors du chargement du résultat
          </p>
          <p className="text-sm text-default-500 mt-2">
            {error?.message || 'Une erreur est survenue'}
          </p>
        </CardBody>
      </Card>
    )
  }

  // Transformer le résultat pour correspondre au format attendu par ResultatView
  const isReussi = resultat.pourcentage >= 50
  const noteColor = isReussi ? 'success' : 'danger'

  const formatDuree = (secondes: number): string => {
    if (!secondes) return 'N/A'
    const minutes = Math.floor(secondes / 60)
    const secs = secondes % 60
    return `${minutes}min ${secs}s`
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Extraire les réponses détaillées
  const reponsesDetail = resultat.reponsesDetail || {}
  const reponses = Object.values(reponsesDetail).map((r: any) => ({
    question_id: r.question_id || '',
    question_enonce: r.question_enonce || '',
    question_numero: r.question_numero || 0,
    reponse_etudiant: r.answer || r.reponse_etudiant || '',
    reponse_correcte: r.correct_answer || r.reponse_correcte,
    est_correcte: r.correct || r.est_correcte || false,
    points_obtenus: r.score || r.points_obtenus || 0,
    points_max: r.max_score || r.points_max || 0,
    feedback: r.feedback || '',
  }))

  // Séparer les réponses en correctes et incorrectes
  const reponsesCorrectes = reponses.filter((r) => r.est_correcte)
  const reponsesIncorrectes = reponses.filter((r) => !r.est_correcte)

  const qcmTitre = resultat.qcm?.titre || 'QCM'
  const qcmMatiere = resultat.qcm?.matiere || 'Non spécifiée'

  return (
    <div className="space-y-6">
      {/* Carte de résumé */}
      <Card className={`border-2 ${isReussi ? 'border-success-500' : 'border-danger-500'}`}>
        <CardHeader className="flex gap-3">
          <div className={`p-3 rounded-lg ${isReussi ? 'bg-success-100' : 'bg-danger-100'}`}>
            {isReussi ? (
              <Award className={`h-8 w-8 text-${noteColor}`} />
            ) : (
              <TrendingDown className={`h-8 w-8 text-${noteColor}`} />
            )}
          </div>
          <div className="flex flex-col flex-1">
            <h2 className="text-2xl font-bold">{qcmTitre}</h2>
            <p className="text-default-500">{qcmMatiere}</p>
          </div>
          <Chip size="lg" color={noteColor} variant="solid">
            {isReussi ? 'Réussi' : 'À améliorer'}
          </Chip>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Note */}
          <div className="flex items-center justify-center py-6 bg-default-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-default-500 mb-2">Score obtenu</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold text-${noteColor}`}>
                  {resultat.scoreTotal?.toFixed(1) || 0}
                </span>
                <span className="text-2xl text-default-400">
                  / {resultat.scoreMaximum || 0}
                </span>
              </div>
              <p className="text-lg text-default-500 mt-2">
                ({resultat.pourcentage?.toFixed(1) || 0}%)
              </p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 bg-default-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-success" />
                <p className="text-xs text-default-500">Réponses correctes</p>
              </div>
              <p className="text-lg font-semibold">
                {resultat.questionsCorrectes || 0} / {resultat.questionsTotal || 0}
              </p>
            </div>

            <div className="p-3 bg-default-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-danger" />
                <p className="text-xs text-default-500">Réponses incorrectes</p>
              </div>
              <p className="text-lg font-semibold">
                {(resultat.questionsTotal || 0) - (resultat.questionsCorrectes || 0)}
              </p>
            </div>

            <div className="p-3 bg-default-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-theme-primary" />
                <p className="text-xs text-default-500">Durée</p>
              </div>
              <p className="text-lg font-semibold">
                {formatDuree(resultat.dureeReelleSecondes || 0)}
              </p>
            </div>

            <div className="p-3 bg-default-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-warning" />
                <p className="text-xs text-default-500">Taux de réussite</p>
              </div>
              <p className="text-lg font-semibold">{resultat.pourcentage?.toFixed(1) || 0}%</p>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="space-y-2 p-3 bg-default-100 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-default-500">Date de passage :</span>
              <span className="font-medium">
                {formatDate(resultat.dateDebut || resultat.createdAt)}
              </span>
            </div>
            {resultat.dateFin && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-default-500">Date de soumission :</span>
                <span className="font-medium">
                  {formatDate(resultat.dateFin)}
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Détails des réponses */}
      {reponses.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold">Détails des réponses</h3>
          </CardHeader>
          <CardBody>
            <Tabs
              aria-label="Filtres réponses"
              variant="underlined"
              classNames={{
                tabList: 'gap-6',
                cursor: 'w-full bg-theme-primary',
                tab: 'max-w-fit px-0 h-12',
              }}
            >
              <Tab
                key="toutes"
                title={
                  <div className="flex items-center space-x-2">
                    <span>Toutes</span>
                    <span className="bg-default-100 px-2 py-0.5 rounded-full text-xs">
                      {reponses.length}
                    </span>
                  </div>
                }
              >
                <div className="mt-6 space-y-4">
                  {reponses.map((reponse) => (
                    <FeedbackPanel key={reponse.question_id} reponse={reponse} />
                  ))}
                </div>
              </Tab>

              <Tab
                key="correctes"
                title={
                  <div className="flex items-center space-x-2">
                    <span>Correctes</span>
                    <span className="bg-success-100 text-success px-2 py-0.5 rounded-full text-xs">
                      {reponsesCorrectes.length}
                    </span>
                  </div>
                }
              >
                <div className="mt-6 space-y-4">
                  {reponsesCorrectes.length === 0 ? (
                    <p className="text-center py-8 text-default-500">
                      Aucune réponse correcte
                    </p>
                  ) : (
                    reponsesCorrectes.map((reponse) => (
                      <FeedbackPanel
                        key={reponse.question_id}
                        reponse={reponse}
                      />
                    ))
                  )}
                </div>
              </Tab>

              <Tab
                key="incorrectes"
                title={
                  <div className="flex items-center space-x-2">
                    <span>Incorrectes</span>
                    <span className="bg-danger-100 text-danger px-2 py-0.5 rounded-full text-xs">
                      {reponsesIncorrectes.length}
                    </span>
                  </div>
                }
              >
                <div className="mt-6 space-y-4">
                  {reponsesIncorrectes.length === 0 ? (
                    <p className="text-center py-8 text-default-500">
                      Aucune réponse incorrecte - Parfait !
                    </p>
                  ) : (
                    reponsesIncorrectes.map((reponse) => (
                      <FeedbackPanel
                        key={reponse.question_id}
                        reponse={reponse}
                      />
                    ))
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

