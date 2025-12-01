"use client";

import type { QCM } from "../../types/enseignant.types";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { FileText, Plus } from "lucide-react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@heroui/modal";

import { qcmService } from "../../services/qcm.service";
import { CreateQCMModal } from "../qcm/CreateQCMModal";

interface RecentQCMsProps {
  userId: string;
}

export function RecentQCMs({ userId }: RecentQCMsProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Récupérer les QCMs récents
  const { data, isLoading, error } = useSWR(
    ["enseignant-recent-qcms", userId],
    () => qcmService.getQCMs({ limit: 5 }),
  );

  const qcms = data?.data || [];

  const getStatusColor = (status: QCM["status"]) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: QCM["status"]) => {
    switch (status) {
      case "published":
        return "Publié";
      case "draft":
        return "Brouillon";
      case "archived":
        return "Archivé";
      default:
        return status;
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex justify-between items-center pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">QCMs Récents</h3>
        </div>
        <Button
          color="primary"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          variant="flat"
          onPress={onOpen}
        >
          Nouveau QCM
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-default-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-danger">
            Erreur lors du chargement des QCMs
          </div>
        ) : qcms.length === 0 ? (
          <div className="text-center py-8 text-default-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun QCM créé</p>
            <Button
              className="mt-3"
              color="primary"
              size="sm"
              startContent={<Plus className="w-4 h-4" />}
              variant="flat"
              onPress={onOpen}
            >
              Créer votre premier QCM
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {qcms.map((qcm) => (
              <div
                key={qcm.id}
                className="flex items-center justify-between p-3 rounded-lg border border-default-200 hover:bg-default-100 cursor-pointer transition-colors"
                onClick={() => router.push(`/enseignant/qcm/${qcm.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{qcm.titre}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-default-500">
                    <span>{qcm.matiere || "Non spécifiée"}</span>
                    <span>•</span>
                    <span>{qcm.nombreQuestions} questions</span>
                  </div>
                </div>
                <Chip
                  color={getStatusColor(qcm.status)}
                  size="sm"
                  variant="flat"
                >
                  {getStatusLabel(qcm.status)}
                </Chip>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      {/* Modal de création de QCM */}
      <CreateQCMModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={(qcmId) => {
          onClose();
          // Optionnel : recharger les données
        }}
      />
    </Card>
  );
}
