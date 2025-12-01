"use client";

import type { QCMStatistics } from "../../types/enseignant.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { BarChart3, Users, TrendingUp, Clock } from "lucide-react";
import useSWR from "swr";

import { qcmService } from "../../services/qcm.service";

interface QCMStatsSummaryProps {
  qcmId: string;
  onOpenModal: () => void;
}

export function QCMStatsSummary({ qcmId, onOpenModal }: QCMStatsSummaryProps) {
  const {
    data: stats,
    isLoading,
    error,
  } = useSWR<QCMStatistics>(
    ["qcm-statistics", qcmId],
    () => qcmService.getQCMStatistics(qcmId),
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return (
      <Card
        isPressable
        className="border-none shadow-sm hover:shadow-md transition-shadow"
        onPress={onOpenModal}
      >
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-default-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-default-200 rounded animate-pulse" />
              <div className="h-6 bg-default-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-none shadow-sm">
        <CardBody className="p-4">
          <p className="text-sm text-default-500">
            Aucune statistique disponible
          </p>
        </CardBody>
      </Card>
    );
  }

  // Si aucune soumission, afficher un message
  if (stats.nombre_soumissions === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-default-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-default-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-default-600">
                Statistiques
              </p>
              <p className="text-xs text-default-400 mt-1">
                Aucune soumission pour le moment
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      isPressable
      className="border-none shadow-sm hover:shadow-md transition-shadow w-full"
      onPress={onOpenModal}
    >
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-default-600">
                Statistiques du QCM
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-default-400" />
                  <span className="text-xs text-default-500">
                    {stats.nombre_soumissions} soumission
                    {stats.nombre_soumissions > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-default-400" />
                  <span className="text-xs text-default-500">
                    Moyenne: {stats.moyenne_note_sur_20.toFixed(1)}/20
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-default-400" />
                  <span className="text-xs text-default-500">
                    {stats.taux_reussite.toFixed(0)}% réussite
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-default-400">
            Cliquer pour voir les détails
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
