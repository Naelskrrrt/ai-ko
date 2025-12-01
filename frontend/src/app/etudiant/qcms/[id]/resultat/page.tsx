"use client";

import * as React from "react";
import { use } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@heroui/button";
import { useRouter, useParams } from "next/navigation";

import { QCMResultatView } from "@/features/etudiant/components/qcms/QCMResultatView";

interface QCMResultatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function QCMResultatPage({ params }: QCMResultatPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const urlParams = useParams();
  // Le resultat_id est dans l'URL, mais on peut aussi le passer en query param
  // Pour l'instant, on utilise l'ID de l'URL comme resultat_id
  const resultatId = id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-success-50">
            <FileText className="h-8 w-8 text-success" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Résultat du QCM</h1>
            <p className="text-default-500">
              Consultez votre performance et les feedbacks
            </p>
          </div>
        </div>
        <Button
          startContent={<ArrowLeft className="h-4 w-4" />}
          variant="flat"
          onPress={() => router.push("/etudiant/qcms")}
        >
          Retour aux QCMs
        </Button>
      </div>

      {/* Résultat */}
      <QCMResultatView resultatId={resultatId} />
    </div>
  );
}
