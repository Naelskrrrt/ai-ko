"use client";

import type { ResultatEtudiant } from "../../types/enseignant.types";

import * as React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import {
  BarChart3,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import useSWR from "swr";

import { sessionService } from "../../services/session.service";

interface SessionStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

interface SessionStatistics {
  nombre_participants: number;
  moyenne: number;
  note_min: number;
  note_max: number;
  taux_reussite: number;
}

export function SessionStatisticsModal({
  isOpen,
  onClose,
  sessionId,
}: SessionStatisticsModalProps) {
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: errorStats,
    mutate: mutateStats,
    isValidating: isValidatingStats,
  } = useSWR<SessionStatistics>(
    isOpen ? ["session-statistics", sessionId] : null,
    () => sessionService.getSessionStatistics(sessionId),
    {
      revalidateOnFocus: false,
    },
  );

  const {
    data: resultats,
    isLoading: isLoadingResultats,
    error: errorResultats,
    mutate: mutateResultats,
  } = useSWR<ResultatEtudiant[]>(
    isOpen ? ["resultats-session", sessionId] : null,
    () => sessionService.getResultatsSession(sessionId),
    {
      revalidateOnFocus: false,
    },
  );

  const handleRefresh = async () => {
    await Promise.all([mutateStats(), mutateResultats()]);
  };

  const formatDate = (dateString: string | null | undefined) => {
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

  const isLoading = isLoadingStats || isLoadingResultats;
  const error = errorStats || errorResultats;

  if (isLoading) {
    return (
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>Statistiques de la session</ModalHeader>
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
          <ModalHeader>Statistiques de la session</ModalHeader>
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

  if (stats.nombre_participants === 0) {
    return (
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>Statistiques de la session</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-16 h-16 text-default-300 mb-4" />
              <p className="text-lg font-medium text-default-600 mb-2">
                Aucun participant pour le moment
              </p>
              <p className="text-sm text-default-400">
                Les statistiques apparaîtront une fois que les étudiants auront
                participé à cette session.
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  const resultatsList = resultats || [];

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Statistiques de la session</span>
            </div>
            <Button
              isIconOnly
              aria-label="Rafraîchir les statistiques"
              isLoading={isValidatingStats}
              size="sm"
              variant="light"
              onPress={handleRefresh}
            >
              <RefreshCw
                className={`w-4 h-4 ${isValidatingStats ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <p className="text-xs text-default-500">Participants</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.nombre_participants}
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
                    {stats.moyenne.toFixed(1)}
                  </p>
                  <p className="text-xs text-default-400 mt-1">sur 20</p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-warning" />
                    <p className="text-xs text-default-500">Taux de réussite</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.taux_reussite.toFixed(0)}%
                  </p>
                  <p className="text-xs text-default-400 mt-1">Note ≥ 10/20</p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <p className="text-xs text-default-500">Écart</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.note_min.toFixed(1)} - {stats.note_max.toFixed(1)}
                  </p>
                  <p className="text-xs text-default-400 mt-1">min - max</p>
                </CardBody>
              </Card>
            </div>

            {/* Distribution des notes */}
            <Card className="w-full">
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
                    <p className="text-sm text-default-500 mb-1">Moyenne</p>
                    <p
                      className={
                        `text-xl font-bold ` +
                        (stats.moyenne < 10
                          ? "text-danger"
                          : stats.moyenne > 14
                            ? "text-success"
                            : "")
                      }
                    >
                      {stats.moyenne.toFixed(1)}/20
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
              </CardBody>
            </Card>

            {/* Liste des résultats */}
            <Card className="w-full">
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Résultats des étudiants
                </h3>
              </CardHeader>
              <CardBody>
                {resultatsList.length === 0 ? (
                  <p className="text-center text-default-500 py-8">
                    Aucun résultat disponible
                  </p>
                ) : (
                  <div className="space-y-3">
                    {resultatsList.map((resultat) => {
                      const pourcentage = resultat.pourcentage || 0;
                      const noteSur20 = resultat.note || 0;
                      const estReussi = pourcentage >= 50;

                      return (
                        <Card key={resultat.id}>
                          <CardBody className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium">
                                    {resultat.etudiant?.name || "Étudiant"}
                                  </p>
                                  <Chip
                                    className="flex items-center"
                                    color={estReussi ? "success" : "danger"}
                                    size="sm"
                                    startContent={
                                      estReussi ? (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-1" />
                                      )
                                    }
                                    variant="flat"
                                  >
                                    {estReussi ? "Réussi" : "Échoué"}
                                  </Chip>
                                </div>
                                <p className="text-xs text-default-500 mb-2">
                                  {resultat.etudiant?.email || "—"}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Award className="w-4 h-4 text-default-400" />
                                    <span className="font-medium">
                                      {noteSur20.toFixed(1)}/20
                                    </span>
                                    <span className="text-default-500">
                                      ({pourcentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                  {resultat.dateFin && (
                                    <div className="text-xs text-default-400">
                                      {formatDate(resultat.dateFin)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
