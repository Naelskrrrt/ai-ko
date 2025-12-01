"use client";

import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Eye, FileCheck, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { etudiantService } from "../../services/etudiant.service";

interface RecentResultsProps {
  userId: string;
}

export function RecentResults({ userId }: RecentResultsProps) {
  const router = useRouter();
  const { data: resultats, isLoading } = useSWR(
    userId ? ["recent-results", userId] : null,
    () => etudiantService.getRecentResults(userId),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Rafraîchir toutes les minutes
      errorRetryCount: 0,
      shouldRetryOnError: false,
    },
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Résultats récents</p>
            <p className="text-small text-default-500">Chargement...</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-3 bg-default-100 rounded-lg animate-pulse h-20"
              />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col flex-1">
          <p className="text-md font-semibold">Résultats récents</p>
          <p className="text-small text-default-500">
            {resultats?.length || 0} résultat
            {(resultats?.length || 0) > 1 ? "s" : ""}
          </p>
        </div>
        {(resultats?.length || 0) > 0 && (
          <Button
            size="sm"
            variant="flat"
            onPress={() => router.push("/etudiant/notes")}
          >
            Voir tous
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {!resultats || resultats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileCheck className="h-12 w-12 text-default-300 mb-3" />
            <p className="text-sm text-default-500">
              Aucun résultat disponible
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resultats.slice(0, 3).map((resultat) => {
              const isReussi = resultat.pourcentage >= 50;
              const noteColor = isReussi ? "success" : "danger";

              return (
                <div
                  key={resultat.id}
                  className="p-3 border border-default-200 rounded-lg hover:bg-default-50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/etudiant/examens/${resultat.examen_id}/resultat`,
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm line-clamp-1">
                          {resultat.examen_titre}
                        </h4>
                        {resultat.statut === "en_attente" && (
                          <Chip color="warning" size="sm" variant="flat">
                            En attente
                          </Chip>
                        )}
                      </div>
                      <p className="text-xs text-default-500 mt-1">
                        {resultat.matiere}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-sm font-semibold text-${noteColor}`}
                        >
                          {resultat.note}/{resultat.note_max}
                        </span>
                        <span className="text-xs text-default-500">
                          ({resultat.pourcentage}%)
                        </span>
                        {isReussi ? (
                          <TrendingUp className="h-3 w-3 text-success" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-danger" />
                        )}
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        router.push(
                          `/etudiant/examens/${resultat.examen_id}/resultat`,
                        );
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
