"use client";

import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { notesService } from "../../services/notes.service";

import { FeedbackPanel } from "./FeedbackPanel";

interface ResultatViewProps {
  examId: string;
  userId: string;
}

export function ResultatView({ examId, userId }: ResultatViewProps) {
  const {
    data: resultat,
    isLoading,
    error,
  } = useSWR(
    ["resultat", examId, userId],
    () => notesService.getResultat(examId, userId),
    {
      revalidateOnFocus: false,
    },
  );

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
    );
  }

  if (error || !resultat) {
    return (
      <Card className="border-danger-500">
        <CardBody className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-lg font-semibold text-danger">
            {resultat?.statut === "en_attente"
              ? "Résultat en attente de correction"
              : "Erreur lors du chargement du résultat"}
          </p>
          <p className="text-sm text-default-500 mt-2">
            {resultat?.statut === "en_attente"
              ? "Votre examen n'a pas encore été corrigé par l'enseignant"
              : error?.message || "Une erreur est survenue"}
          </p>
        </CardBody>
      </Card>
    );
  }

  // Fonctions utilitaires
  const formatDuree = (secondes: number): string => {
    const minutes = Math.floor(secondes / 60);
    const secs = secondes % 60;

    return `${minutes}min ${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Si le résultat n'est pas publié, afficher infos partielles
  if (!resultat.estPublie || resultat.statut === "en_attente") {
    return (
      <Card className="border-warning-500">
        <CardBody className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <p className="text-lg font-semibold text-success mb-2">
            Examen terminé avec succès ✓
          </p>
          <p className="text-sm text-default-500 mb-6">
            Les notes ne sont pas encore disponibles. En attente de publication par l'enseignant.
          </p>

          {/* Informations disponibles */}
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between p-3 bg-default-100 rounded-lg">
              <span className="text-sm text-default-600">Date de passage</span>
              <span className="text-sm font-medium">
                {formatDate(resultat.date_passage)}
              </span>
            </div>
            {resultat.duree_secondes && (
              <div className="flex items-center justify-between p-3 bg-default-100 rounded-lg">
                <span className="text-sm text-default-600">Durée</span>
                <span className="text-sm font-medium">
                  {formatDuree(resultat.duree_secondes)}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-default-400 mt-6">
            Vous recevrez une notification lorsque l'enseignant publiera les
            résultats
          </p>
        </CardBody>
      </Card>
    );
  }

  const isReussi = resultat.pourcentage >= 50;
  const noteColor = isReussi ? "success" : "danger";

  // Séparer les réponses en correctes et incorrectes
  const reponsesCorrectes = resultat.reponses.filter((r) => r.est_correcte);
  const reponsesIncorrectes = resultat.reponses.filter((r) => !r.est_correcte);

  return (
    <div className="space-y-6">
      {/* Carte de résumé */}
      <Card
        className={`border-2 ${isReussi ? "border-success-500" : "border-danger-500"}`}
      >
        <CardHeader className="flex gap-3">
          <div
            className={`p-3 rounded-lg ${isReussi ? "bg-success-100" : "bg-danger-100"}`}
          >
            {isReussi ? (
              <Award className={`h-8 w-8 text-${noteColor}`} />
            ) : (
              <TrendingDown className={`h-8 w-8 text-${noteColor}`} />
            )}
          </div>
          <div className="flex flex-col flex-1">
            <h2 className="text-2xl font-bold">{resultat.examen_titre}</h2>
            <p className="text-default-500">{resultat.matiere}</p>
          </div>
          <Chip color={noteColor} size="lg" variant="solid">
            {isReussi ? "Réussi" : "Échoué"}
          </Chip>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Note */}
          <div className="flex items-center justify-center py-6 bg-default-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-default-500 mb-2">Note obtenue</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold text-${noteColor}`}>
                  {resultat.note}
                </span>
                <span className="text-2xl text-default-400">
                  / {resultat.note_max}
                </span>
              </div>
              <p className="text-lg text-default-500 mt-2">
                ({resultat.pourcentage}%)
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
                {resultat.nb_correctes} / {resultat.nb_questions}
              </p>
            </div>

            <div className="p-3 bg-default-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-danger" />
                <p className="text-xs text-default-500">Réponses incorrectes</p>
              </div>
              <p className="text-lg font-semibold">
                {resultat.nb_questions - resultat.nb_correctes}
              </p>
            </div>

            <div className="p-3 bg-default-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-theme-primary" />
                <p className="text-xs text-default-500">Durée</p>
              </div>
              <p className="text-lg font-semibold">
                {formatDuree(resultat.duree_secondes)}
              </p>
            </div>

            <div className="p-3 bg-default-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-warning" />
                <p className="text-xs text-default-500">Taux de réussite</p>
              </div>
              <p className="text-lg font-semibold">{resultat.pourcentage}%</p>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="space-y-2 p-3 bg-default-100 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-default-500">Date de passage :</span>
              <span className="font-medium">
                {formatDate(resultat.date_passage)}
              </span>
            </div>
            {resultat.date_correction && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-default-500">Date de correction :</span>
                <span className="font-medium">
                  {formatDate(resultat.date_correction)}
                </span>
              </div>
            )}
          </div>

          {/* Feedback général */}
          {resultat.feedback_general && (
            <Card className="bg-theme-primary/10 border-theme-primary/20">
              <CardBody>
                <h3 className="text-sm font-semibold text-theme-primary mb-2">
                  Commentaire de l'enseignant :
                </h3>
                <p className="text-sm text-theme-primary-700">
                  {resultat.feedback_general}
                </p>
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>

      {/* Détails des réponses */}
      {(resultat.afficherCorrection ?? true) ? (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold">Détails des réponses</h3>
          </CardHeader>
          <CardBody>
            <Tabs
              aria-label="Filtres réponses"
              classNames={{
                tabList: "gap-6",
                cursor: "w-full bg-theme-primary",
                tab: "max-w-fit px-0 h-12",
              }}
              variant="underlined"
            >
              <Tab
                key="toutes"
                title={
                  <div className="flex items-center space-x-2">
                    <span>Toutes</span>
                    <span className="bg-default-100 px-2 py-0.5 rounded-full text-xs">
                      {resultat.reponses.length}
                    </span>
                  </div>
                }
              >
                <div className="mt-6 space-y-4">
                  {resultat.reponses.map((reponse) => (
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
      ) : (
        <Card className="border-warning-500">
          <CardBody className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <p className="text-lg font-semibold text-warning mb-2">
              Correction non disponible
            </p>
            <p className="text-sm text-default-500">
              L'enseignant n'a pas encore autorisé l'affichage de la correction pour cet examen.
              Vous pourrez consulter les détails des réponses une fois que l'enseignant publiera la correction.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
