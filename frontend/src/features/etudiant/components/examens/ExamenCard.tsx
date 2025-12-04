"use client";

import type { Examen } from "../../types/examens.types";

import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
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
  Eye,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ExamenCardProps {
  examen: Examen;
  onUpdate?: () => void;
}

export function ExamenCard({ examen, onUpdate: _onUpdate }: ExamenCardProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleStartExam = () => {
    onOpen();
  };

  const confirmStartExam = () => {
    onClose();
    router.push(`/etudiant/examens/${examen.id}`);
  };

  const _handleViewDetails = () => {
    router.push(`/etudiant/examens/${examen.id}`);
  };

  const handleContinueExam = () => {
    router.push(`/etudiant/examens/${examen.id}/start`);
  };

  const handleViewResult = () => {
    router.push(`/etudiant/examens/${examen.id}/resultat`);
  };

  const getStatusBadge = () => {
    switch (examen.statut) {
      case "disponible":
        return (
          <Chip
            className="bg-theme-primary/10 text-theme-primary border-theme-primary/20"
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non spécifié";
    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "Date invalide";

      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_error) {
      return "Date invalide";
    }
  };

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-2">
                {examen.titre}
              </h3>
              <p className="text-sm text-default-500 mt-1">{examen.matiere}</p>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-3 py-3">
        {examen.description && (
          <p className="text-sm text-default-600 line-clamp-2">
            {examen.description}
          </p>
        )}

        <div className="flex flex-col space-y-2 text-sm">
          <div className="flex items-center text-default-500">
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Début: {formatDate(examen.date_debut)}</span>
          </div>
          <div className="flex items-center text-default-500">
            <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Durée: {examen.duree_minutes || 0} minutes</span>
          </div>
          <div className="flex items-center text-default-500">
            <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>
              {examen.nombre_questions || 0} question
              {(examen.nombre_questions || 0) > 1 ? "s" : ""} (
              {examen.total_points || 0} point
              {(examen.total_points || 0) > 1 ? "s" : ""})
            </span>
          </div>
        </div>

        {examen.tentatives_restantes !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning-700">
              {examen.tentatives_restantes > 0
                ? `${examen.tentatives_restantes} tentative${examen.tentatives_restantes > 1 ? "s" : ""} restante${examen.tentatives_restantes > 1 ? "s" : ""}`
                : "Aucune tentative restante"}
            </span>
          </div>
        )}

        {examen.statut === "en_cours" && examen.progression !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-default-500">
              <span>Progression</span>
              <span>{examen.progression}%</span>
            </div>
            <div className="w-full h-2 bg-default-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-theme-primary transition-all duration-300"
                style={{ width: `${examen.progression}%` }}
              />
            </div>
          </div>
        )}
      </CardBody>

      <CardFooter className="pt-0">
        {examen.statut === "disponible" && (
          <Button
            className="w-full bg-theme-primary text-white hover:bg-theme-primary/90"
            isDisabled={
              examen.tentatives_restantes !== undefined &&
              examen.tentatives_restantes === 0
            }
            startContent={<Play className="h-4 w-4" />}
            onPress={handleStartExam}
          >
            Commencer l'examen
          </Button>
        )}
        {examen.statut === "en_cours" && (
          <Button
            className="w-full"
            color="warning"
            startContent={<Play className="h-4 w-4" />}
            onPress={handleContinueExam}
          >
            Reprendre l'examen
          </Button>
        )}
        {examen.statut === "termine" && (
          <Button
            className="w-full"
            color="default"
            startContent={<Eye className="h-4 w-4" />}
            variant="flat"
            onPress={handleViewResult}
          >
            Voir le résultat
          </Button>
        )}
      </CardFooter>

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
    </Card>
  );
}
