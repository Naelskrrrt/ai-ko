"use client";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Calendar,
  Clock,
  FileText,
  Play,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { examensService } from "../../services/examens.service";

interface ExamenDetailsProps {
  examId: string;
  userId: string;
}

export function ExamenDetails({ examId, userId: _userId }: ExamenDetailsProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Charger les détails de l'examen
  const { data: examen, isLoading } = useSWR(
    ["examen-details", examId],
    () => examensService.getById(examId),
    {
      revalidateOnFocus: false,
    },
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non spécifié";
    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "Date invalide";

      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date invalide";
    }
  };

  const handleStartExam = () => {
    onOpen();
  };

  const confirmStartExam = () => {
    onClose();
    // Rediriger vers la page qui va démarrer l'examen
    router.push(`/etudiant/examens/${examId}/start`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-2xl w-full">
          <CardBody className="text-center py-12">
            <p className="text-lg">Chargement des détails de l'examen...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!examen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-2xl w-full">
          <CardBody className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
            <p className="text-lg font-semibold">Examen non trouvé</p>
            <Button
              className="mt-4"
              onPress={() => router.push("/etudiant/examens")}
            >
              Retour aux examens
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (examen.statut) {
      case "disponible":
        return (
          <Chip
            className="bg-success/10 text-success border-success/20"
            size="sm"
            variant="flat"
          >
            Disponible
          </Chip>
        );
      case "en_cours":
        return (
          <Chip color="warning" size="sm" variant="flat">
            En cours
          </Chip>
        );
      case "termine":
        return (
          <Chip color="success" size="sm" variant="flat">
            Terminé
          </Chip>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col gap-3 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{examen.titre}</h1>
              <p className="text-default-500 text-lg">{examen.matiere}</p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {examen.description && (
            <div>
              <p className="text-default-600">{examen.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-default-50 rounded-lg">
              <Calendar className="h-5 w-5 text-default-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-default-500 mb-1">Début</p>
                <p className="font-semibold">{formatDate(examen.date_debut)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-default-50 rounded-lg">
              <Clock className="h-5 w-5 text-default-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-default-500 mb-1">Durée</p>
                <p className="font-semibold">
                  {examen.duree_minutes || 0} minutes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-default-50 rounded-lg">
              <FileText className="h-5 w-5 text-default-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-default-500 mb-1">Questions</p>
                <p className="font-semibold">
                  {examen.nombre_questions || 0} question
                  {(examen.nombre_questions || 0) > 1 ? "s" : ""} (
                  {examen.total_points || 0} point
                  {(examen.total_points || 0) > 1 ? "s" : ""})
                </p>
              </div>
            </div>

            {examen.niveau && (
              <div className="flex items-start gap-3 p-4 bg-default-50 rounded-lg">
                <div className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-default-500 mb-1">Niveau</p>
                  <p className="font-semibold">{examen.niveau}</p>
                </div>
              </div>
            )}
          </div>

          {examen.tentatives_restantes !== undefined &&
            examen.tentatives_restantes > 0 && (
              <div className="flex items-center gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                <span className="text-sm text-warning-700">
                  {examen.tentatives_restantes} tentative
                  {examen.tentatives_restantes > 1 ? "s" : ""} restante
                  {examen.tentatives_restantes > 1 ? "s" : ""}
                </span>
              </div>
            )}

          {examen.tentatives_restantes !== undefined &&
            examen.tentatives_restantes === 0 && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
                <span className="text-sm text-danger-700">
                  Aucune tentative restante
                </span>
              </div>
            )}
        </CardBody>

        <div className="p-6 pt-0">
          <div className="flex items-center gap-4">
            <Button
              startContent={<ArrowLeft className="h-4 w-4" />}
              variant="flat"
              onPress={() => router.push("/etudiant/examens")}
            >
              Retour
            </Button>
            {examen.statut === "disponible" && (
              <Button
                className="flex-1 bg-theme-primary text-white hover:bg-theme-primary/90"
                isDisabled={
                  examen.tentatives_restantes !== undefined &&
                  examen.tentatives_restantes === 0
                }
                size="lg"
                startContent={<Play className="h-5 w-5" />}
                onPress={handleStartExam}
              >
                Commencer l'examen
              </Button>
            )}
            {examen.statut === "en_cours" && (
              <Button
                className="flex-1"
                color="warning"
                size="lg"
                startContent={<Play className="h-5 w-5" />}
                onPress={() => router.push(`/etudiant/examens/${examId}/start`)}
              >
                Reprendre l'examen
              </Button>
            )}
            {examen.statut === "termine" && (
              <Button
                className="flex-1"
                color="default"
                size="lg"
                variant="flat"
                onPress={() =>
                  router.push(`/etudiant/examens/${examId}/resultat`)
                }
              >
                Voir le résultat
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Modal de confirmation */}
      <Modal isOpen={isOpen} size="md" onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmation
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-default-600">
                    Êtes-vous prêt à commencer cet examen ?
                  </p>
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-warning-700 space-y-1">
                        <p className="font-semibold">Important :</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Le chronomètre démarrera immédiatement</li>
                          <li>
                            Vous ne pourrez pas quitter la page pendant l'examen
                          </li>
                          <li>
                            L'examen durera {examen.duree_minutes || 0} minutes
                          </li>
                          <li>
                            Vous avez {examen.nombre_questions || 0} questions à
                            répondre
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button
                  className="bg-theme-primary text-white hover:bg-theme-primary/90"
                  startContent={<Play className="h-4 w-4" />}
                  onPress={confirmStartExam}
                >
                  Commencer l'examen
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
