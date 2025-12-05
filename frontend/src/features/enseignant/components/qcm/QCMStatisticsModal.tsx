"use client";

import type { QCMStatistics } from "../../types/enseignant.types";

import * as React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";
import {
  BarChart3,
  Users,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import useSWR from "swr";

import { qcmService } from "../../services/qcm.service";

interface QCMStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  qcmId: string;
}

export function QCMStatisticsModal({
  isOpen,
  onClose,
  qcmId,
}: QCMStatisticsModalProps) {
  const {
    data: stats,
    isLoading,
    error,
    mutate,
    isValidating,
  } = useSWR<QCMStatistics>(
    isOpen ? ["qcm-statistics", qcmId] : null,
    () => qcmService.getQCMStatistics(qcmId),
    {
      revalidateOnFocus: false,
    },
  );

  const handleRefresh = async () => {
    await mutate();
  };

  const formatDuree = (secondes: number) => {
    const minutes = Math.floor(secondes / 60);
    const secs = Math.floor(secondes % 60);

    return `${minutes}min ${secs}s`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);

      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>Statistiques du QCM</ModalHeader>
          <ModalBody>
            <div className="flex items-center justify-center py-12">
              <p className="text-default-500">Chargement des statistiques...</p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (error || !stats) {
    return (
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>Statistiques du QCM</ModalHeader>
          <ModalBody>
            <div className="flex items-center justify-center py-12">
              <p className="text-danger">
                Erreur lors du chargement des statistiques
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (stats.nombre_soumissions === 0) {
    return (
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>Statistiques du QCM</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-16 h-16 text-default-300 mb-4" />
              <p className="text-lg font-medium text-default-600 mb-2">
                Aucune soumission pour le moment
              </p>
              <p className="text-sm text-default-400">
                Les statistiques apparaîtront une fois que les étudiants auront
                soumis ce QCM.
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal
      classNames={{
        base: "max-h-[90vh]",
        header: "flex-shrink-0",
        body: "overflow-y-auto",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={onClose}
    >
      <ModalContent className="max-h-[90vh] flex flex-col">
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Statistiques du QCM</span>
            </div>
            <Button
              isIconOnly
              aria-label="Rafraîchir les statistiques"
              isLoading={isValidating}
              size="sm"
              variant="light"
              onPress={handleRefresh}
            >
              <RefreshCw
                className={`w-4 h-4 ${isValidating ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <p className="text-sm font-normal text-default-500">
            {stats.qcm.titre}
          </p>
        </ModalHeader>
        <ModalBody>
          <Tabs aria-label="Statistiques" className="w-full">
            <Tab key="overview" title="Vue d'ensemble">
              <div className="space-y-6 py-4">
                {/* Métriques principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <p className="text-xs text-default-500">Soumissions</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {stats.nombre_soumissions}
                      </p>
                      <p className="text-xs text-default-400 mt-1">
                        {stats.nombre_etudiants_uniques} étudiant
                        {stats.nombre_etudiants_uniques > 1 ? "s" : ""} unique
                        {stats.nombre_etudiants_uniques > 1 ? "s" : ""}
                      </p>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <p className="text-xs text-default-500">Moyenne</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {stats.moyenne_note_sur_20.toFixed(1)}
                      </p>
                      <p className="text-xs text-default-400 mt-1">
                        {stats.moyenne_pourcentage.toFixed(1)}%
                      </p>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-warning" />
                        <p className="text-xs text-default-500">
                          Taux de réussite
                        </p>
                      </div>
                      <p className="text-2xl font-bold">
                        {stats.taux_reussite.toFixed(0)}%
                      </p>
                      <p className="text-xs text-default-400 mt-1">
                        Note ≥ 10/20
                      </p>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <p className="text-xs text-default-500">
                          Durée moyenne
                        </p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatDuree(stats.duree_moyenne_secondes)}
                      </p>
                      <p className="text-xs text-default-400 mt-1">
                        Par soumission
                      </p>
                    </CardBody>
                  </Card>
                </div>

                {/* Notes min/max/médiane */}
                <Card className="w-full p-3">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Distribution des notes
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Note minimale
                        </p>
                        <p
                          className={
                            `text-xl font-bold ` +
                            (stats.note_min < 10
                              ? "text-danger"
                              : stats.note_min > 14
                                ? "text-success"
                                : "")
                          }
                        >
                          {stats.note_min.toFixed(1)}/20
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Note médiane
                        </p>
                        <p
                          className={
                            `text-xl font-bold ` +
                            (stats.note_mediane < 10
                              ? "text-danger"
                              : stats.note_mediane > 14
                                ? "text-success"
                                : "")
                          }
                        >
                          {stats.note_mediane.toFixed(1)}/20
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Note maximale
                        </p>
                        <p
                          className={
                            `text-xl font-bold ` +
                            (stats.note_max < 10
                              ? "text-danger"
                              : stats.note_max > 14
                                ? "text-success"
                                : "")
                          }
                        >
                          {stats.note_max.toFixed(1)}/20
                        </p>
                      </div>
                    </div>

                    {/* Histogramme simple */}
                    {/* {stats.distribution_notes.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-medium mb-3">Répartition par tranches</p>
                        <div className="space-y-2">
                          {stats.distribution_notes.map((item, index) => {
                            const maxValue = Math.max(...stats.distribution_notes.map((d) => d.nombre))
                            const percentage = (item.nombre / maxValue) * 100
                            return (
                              <div key={index} className="flex items-center gap-3">
                                <span className="text-xs text-default-500 w-16">{item.tranche}</span>
                                <Progress
                                  value={percentage}
                                  className="flex-1"
                                  color={percentage > 70 ? 'success' : percentage > 40 ? 'warning' : 'danger'}
                                />
                                <span className="text-xs font-medium w-8 text-right">{item.nombre}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )} */}
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="questions" title="Par question">
              <div className="space-y-4 py-4">
                {stats.statistiques_par_question.length === 0 ? (
                  <p className="text-center text-default-500 py-8">
                    Aucune statistique par question disponible
                  </p>
                ) : (
                  stats.statistiques_par_question.map((qStat, _index) => (
                    <Card key={qStat.question_id} className="w-full px-2">
                      <CardHeader>
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-default-500">
                                Question {qStat.question_numero}
                              </span>
                              <Chip
                                color={
                                  qStat.taux_reussite >= 70
                                    ? "success"
                                    : qStat.taux_reussite >= 50
                                      ? "warning"
                                      : "danger"
                                }
                                size="sm"
                                variant="flat"
                              >
                                {qStat.taux_reussite.toFixed(0)}% réussite
                              </Chip>
                            </div>
                            <p className="text-sm text-default-700">
                              {qStat.question_enonce}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              Réponses
                            </p>
                            <p className="text-lg font-semibold">
                              {qStat.nombre_reponses}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              Correctes
                            </p>
                            <p className="text-lg font-semibold text-success">
                              {qStat.nombre_correctes}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              Incorrectes
                            </p>
                            <p className="text-lg font-semibold text-danger">
                              {qStat.nombre_reponses - qStat.nombre_correctes}
                            </p>
                          </div>
                        </div>
                        <Progress
                          className="mb-4"
                          color={
                            qStat.taux_reussite >= 70
                              ? "success"
                              : qStat.taux_reussite >= 50
                                ? "warning"
                                : "danger"
                          }
                          value={qStat.taux_reussite}
                        />
                        {qStat.reponses_frequentes.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-default-500 mb-2">
                              Réponses les plus fréquentes :
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {qStat.reponses_frequentes.map((rep, idx) => (
                                <Chip key={idx} size="sm" variant="flat">
                                  {rep.reponse} ({rep.nombre})
                                </Chip>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </Tab>

            <Tab key="resultats" title="Résultats étudiants">
              <div className="space-y-4 py-4">
                {stats.resultats.length === 0 ? (
                  <p className="text-center text-default-500 py-8">
                    Aucun résultat disponible
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.resultats.map((resultat) => (
                      <Card key={resultat.id}>
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">
                                  {resultat.etudiant_nom}
                                </p>
                                <div className="flex items-center">
                                  <Chip
                                    className="flex items-center no-wrap"
                                    color={
                                      resultat.est_reussi ? "success" : "danger"
                                    }
                                    size="sm"
                                    startContent={
                                      resultat.est_reussi ? (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-1" />
                                      )
                                    }
                                    variant="flat"
                                  >
                                    <span className="whitespace-nowrap">
                                      {resultat.est_reussi
                                        ? "Réussi"
                                        : "Échoué"}
                                    </span>
                                  </Chip>
                                </div>
                              </div>
                              <p className="text-xs text-default-500 mb-2">
                                {resultat.etudiant_email}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Award className="w-4 h-4 text-default-400" />
                                  <span className="font-medium">
                                    {resultat.note_sur_20?.toFixed(1) || "—"}/20
                                  </span>
                                  <span className="text-default-500">
                                    ({resultat.pourcentage?.toFixed(1) || "—"}%)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText className="w-4 h-4 text-default-400" />
                                  <span>
                                    {resultat.questions_correctes}/
                                    {resultat.questions_total} questions
                                  </span>
                                </div>
                                {resultat.duree_secondes && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-default-400" />
                                    <span>
                                      {formatDuree(resultat.duree_secondes)}
                                    </span>
                                  </div>
                                )}
                                {resultat.date_fin && (
                                  <div className="text-xs text-default-400">
                                    {formatDate(resultat.date_fin)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                    {stats.nombre_soumissions > stats.resultats.length && (
                      <p className="text-center text-xs text-default-400 py-2">
                        Affichage des 50 premiers résultats sur{" "}
                        {stats.nombre_soumissions} soumissions
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
