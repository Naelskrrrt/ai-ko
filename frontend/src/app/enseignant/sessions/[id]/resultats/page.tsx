"use client";

import * as React from "react";
import { use } from "react";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { ResultatsSession } from "@/features/enseignant/components/resultats/ResultatsSession";

interface ResultatsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResultatsPage({ params }: ResultatsPageProps) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      {/* Bouton retour */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="flat" onPress={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Résultats */}
      <ResultatsSession sessionId={id} />
    </div>
  );
}
