"use client";

import * as React from "react";
import useSWR from "swr";
import { Award, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";

import { useAuth } from "@/core/providers/AuthProvider";
import { notesService } from "@/features/etudiant/services/notes.service";

export default function NotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || "";

  const { data: historique, isLoading } = useSWR(
    userId ? ["historique-notes", userId] : null,
    () => notesService.getHistorique(userId),
    {
      revalidateOnFocus: false,
      errorRetryCount: 0,
      shouldRetryOnError: false,
    },
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-default-100 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-default-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-secondary-50">
          <Award className="h-8 w-8 text-secondary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Historique des Notes</h1>
          <p className="text-default-500">Consultez vos résultats d'examens</p>
        </div>
      </div>

      {/* Statistiques globales */}
      {historique && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-default-500">
                Moyenne générale
              </p>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-theme-primary" />
                <span className="text-2xl font-bold">
                  {historique.statistiques.moyenne_generale.toFixed(2)}/20
                </span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-default-500">
                Meilleure note
              </p>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-success" />
                <span className="text-2xl font-bold">
                  {historique.statistiques.meilleure_note}/20
                </span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-default-500">
                Taux de réussite
              </p>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-warning" />
                <span className="text-2xl font-bold">
                  {historique.statistiques.taux_reussite}%
                </span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-default-500">
                Total examens
              </p>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                <span className="text-2xl font-bold">
                  {historique.statistiques.total_examens}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Liste des résultats */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Tous les résultats</h2>
        </CardHeader>
        <CardBody>
          {!historique || historique.resultats.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">Aucun résultat disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historique.resultats.map((resultat) => {
                const isReussi = resultat.pourcentage >= 50;
                const noteColor = isReussi ? "success" : "danger";

                return (
                  <div
                    key={resultat.id}
                    className="p-4 border border-default-200 rounded-lg hover:bg-default-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {resultat.examen_titre}
                          </h3>
                          {(!resultat.estPublie || resultat.statut === "en_attente") && (
                            <Chip color="warning" size="sm" variant="flat">
                              Correction en cours
                            </Chip>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-default-500">
                          <span>{resultat.matiere}</span>
                          <span>•</span>
                          <span>{formatDate(resultat.date_passage)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {!resultat.estPublie || resultat.statut === "en_attente" ? (
                            <div className="text-center">
                              <span className="text-xl font-bold text-default-400">
                                —
                              </span>
                              <p className="text-xs text-default-400">
                                En attente
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                {isReussi ? (
                                  <TrendingUp className="h-4 w-4 text-success" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-danger" />
                                )}
                                <span
                                  className={`text-xl font-bold text-${noteColor}`}
                                >
                                  {resultat.note}/{resultat.note_max}
                                </span>
                              </div>
                              <p className="text-xs text-default-500">
                                {resultat.pourcentage}%
                              </p>
                            </>
                          )}
                        </div>

                        {resultat.statut === "corrige" && (resultat.estPublie !== false) && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() =>
                              router.push(
                                `/etudiant/notes/${resultat.id}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
