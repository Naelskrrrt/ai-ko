"use client";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Award, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { sessionService } from "../../services/session.service";
import type { ResultatEtudiant } from "../../types/enseignant.types";

interface SessionResultatsResumeProps {
  sessionId: string;
}

export function SessionResultatsResume({
  sessionId,
}: SessionResultatsResumeProps) {
  const router = useRouter();

  // Récupérer les résultats de la session
  const {
    data: resultats,
    isLoading,
    error,
  } = useSWR<ResultatEtudiant[]>(
    ["resultats-session-resume", sessionId],
    () => sessionService.getResultatsSession(sessionId),
    {
      revalidateOnFocus: false,
    },
  );

  // Limiter aux 5 premiers résultats (déjà triés par le backend)
  const resultatsAffiches = React.useMemo(() => {
    if (!resultats) return [];
    return resultats.slice(0, 5);
  }, [resultats]);

  // Fonction pour obtenir les initiales d'un nom
  const getInitiales = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Résultats de la session</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-default-100 rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-default-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-default-200 rounded w-32" />
                    <div className="h-3 bg-default-200 rounded w-24" />
                  </div>
                </div>
                <div className="h-6 bg-default-200 rounded w-16" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Résultats de la session</h3>
        </CardHeader>
        <CardBody>
          <p className="text-default-500 text-center py-4">
            Erreur lors du chargement des résultats
          </p>
        </CardBody>
      </Card>
    );
  }

  if (!resultats || resultats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Résultats de la session</h3>
        </CardHeader>
        <CardBody>
          <p className="text-default-500 text-center py-4">
            Aucun résultat disponible pour le moment
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Résultats de la session</h3>
          <Button
            color="primary"
            size="sm"
            variant="flat"
            endContent={<ChevronRight className="h-4 w-4" />}
            onPress={() =>
              router.push(`/enseignant/sessions/${sessionId}/resultats`)
            }
          >
            Voir plus
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {resultatsAffiches.map((resultat) => {
            const etudiantName = resultat.etudiant?.name || "Étudiant inconnu";
            const initiales = getInitiales(etudiantName);
            const note = resultat.note ?? 0;
            const pourcentage = resultat.pourcentage ?? 0;
            const estReussi = pourcentage >= 50; // On considère 50% comme seuil de réussite

            return (
              <div
                key={resultat.id}
                className="flex items-center justify-between p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar avec initiales */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {initiales}
                    </span>
                  </div>

                  {/* Informations étudiant */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {etudiantName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip
                        color={estReussi ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                        startContent={
                          estReussi ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )
                        }
                      >
                        {estReussi ? "Réussi" : "Échoué"}
                      </Chip>
                      <span className="text-xs text-default-500">
                        {pourcentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Award
                    className={`h-5 w-5 ${
                      estReussi ? "text-success" : "text-danger"
                    }`}
                  />
                  <span className="font-bold text-lg">
                    {note.toFixed(1)}/20
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {resultats.length > 5 && (
          <div className="mt-4 pt-4 border-t border-default-200">
            <p className="text-sm text-default-500 text-center">
              {resultats.length - 5} autre{resultats.length - 5 > 1 ? "s" : ""}{" "}
              résultat{resultats.length - 5 > 1 ? "s" : ""} disponible
              {resultats.length - 5 > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

