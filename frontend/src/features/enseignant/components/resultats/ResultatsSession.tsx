"use client";

import type {
  ResultatEtudiant,
  ResultatsFilters,
} from "../../types/enseignant.types";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import {
  Users,
  Download,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Eye,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import useSWR from "swr";

import { sessionService } from "../../services/session.service";

import { PublicationConfirmModal } from "./PublicationConfirmModal";
import { DetailEtudiantModal } from "./DetailEtudiantModal";
import { ResultatsFiltersComponent } from "./ResultatsFilters";

import { downloadPDF } from "@/lib/pdf-utils";
import { useToast } from "@/hooks/use-toast";

interface ResultatsSessionProps {
  sessionId: string;
}

export function ResultatsSession({ sessionId }: ResultatsSessionProps) {
  const { toast } = useToast();
  const [isPublicationModalOpen, setIsPublicationModalOpen] =
    React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isExportingSession, setIsExportingSession] = React.useState(false);
  const [selectedResultatId, setSelectedResultatId] = React.useState<
    string | null
  >(null);
  const [filters, setFilters] = React.useState<ResultatsFilters>({
    statutPublication: "tous",
    statutReussite: "tous",
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Récupérer les résultats de la session
  const {
    data: resultats,
    isLoading,
    error,
    mutate,
  } = useSWR(["resultats-session", sessionId], () =>
    sessionService.getResultatsSession(sessionId),
  );

  const resultatsEtudiants = resultats || [];

  // Appliquer les filtres
  const resultatsFiltres = React.useMemo(() => {
    let filtered = [...resultatsEtudiants];

    // Filtre par date de soumission
    if (filters.dateDebut || filters.dateFin) {
      filtered = filtered.filter((resultat) => {
        const dateSoumission = resultat.dateFin || resultat.dateDebut;

        if (!dateSoumission) return false;

        const date = new Date(dateSoumission);
        const dateStr = date.toISOString().split("T")[0];

        if (filters.dateDebut && dateStr < filters.dateDebut) return false;
        if (filters.dateFin && dateStr > filters.dateFin) return false;

        return true;
      });
    }

    // Filtre par statut de publication
    if (filters.statutPublication && filters.statutPublication !== "tous") {
      filtered = filtered.filter((resultat) => {
        if (filters.statutPublication === "publie") {
          return resultat.estPublie === true;
        }

        if (filters.statutPublication === "non_publie") {
          return resultat.estPublie === false;
        }

        return true;
      });
    }

    // Filtre par score (pourcentage)
    if (filters.scoreMin != null || filters.scoreMax != null) {
      filtered = filtered.filter((resultat) => {
        const pourcentage = resultat.pourcentage ?? 0;

        if (filters.scoreMin != null && pourcentage < filters.scoreMin)
          return false;
        if (filters.scoreMax != null && pourcentage > filters.scoreMax)
          return false;

        return true;
      });
    }

    // Filtre par statut réussi/échoué
    if (filters.statutReussite && filters.statutReussite !== "tous") {
      filtered = filtered.filter((resultat) => {
        const pourcentage = resultat.pourcentage ?? 0;

        if (filters.statutReussite === "reussi") {
          return pourcentage >= 50;
        }

        if (filters.statutReussite === "echoue") {
          return pourcentage < 50;
        }

        return true;
      });
    }

    return filtered;
  }, [resultatsEtudiants, filters]);

  // Calculer la pagination
  const totalPages = Math.ceil(resultatsFiltres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const resultatsPagination = resultatsFiltres.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Debug: Log des données reçues
  React.useEffect(() => {
    if (resultats) {
      // eslint-disable-next-line no-console
      console.log("Résultats reçus:", resultats);
      // eslint-disable-next-line no-console
      console.log("Nombre de résultats:", resultats.length);
    }
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur récupération résultats:", error);
    }
  }, [resultats, error]);

  // Calculer les statistiques sur les résultats filtrés
  const stats = React.useMemo(() => {
    if (!resultatsFiltres.length) {
      return {
        total_etudiants: 0,
        termine: 0,
        en_cours: 0,
        moyenne: 0,
        taux_reussite: 0,
        meilleure_note: 0,
        moins_bonne_note: 0,
      };
    }

    const termines = resultatsFiltres.filter((r) => r.statut === "termine");
    const notes = termines
      .map((r) => r.pourcentage)
      .filter((n) => n != null && !isNaN(n));

    return {
      total_etudiants: resultatsFiltres.length,
      termine: termines.length,
      en_cours: resultatsFiltres.filter((r) => r.statut === "en_cours").length,
      moyenne:
        notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0,
      taux_reussite:
        termines.length > 0
          ? (termines.filter((r) => (r.pourcentage || 0) >= 50).length /
              termines.length) *
            100
          : 0,
      meilleure_note: notes.length > 0 ? Math.max(...notes) : 0,
      moins_bonne_note: notes.length > 0 ? Math.min(...notes) : 0,
    };
  }, [resultatsFiltres]);

  const handleExportPDF = async () => {
    try {
      setIsExportingSession(true);
      const blob = await sessionService.exporterPDFSession(sessionId);
      const filename = `recapitulatif_session_${sessionId}.pdf`;

      downloadPDF(blob, filename);
      toast({
        title: "Export réussi",
        description: "Le PDF récapitulatif a été téléchargé avec succès",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur export PDF session:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export PDF",
        variant: "error",
      });
    } finally {
      setIsExportingSession(false);
    }
  };

  const handlePublierTous = () => {
    const resultatsTermines = resultatsFiltres.filter(
      (r) => r.statut === "termine",
    );

    if (resultatsTermines.length === 0) {
      toast({
        title: "Aucun résultat",
        description: "Aucun résultat terminé à publier",
        variant: "warning",
      });

      return;
    }
    setIsPublicationModalOpen(true);
  };

  const confirmPublierTous = async () => {
    try {
      setIsPublishing(true);
      const result = await sessionService.publierResultatsSession(sessionId);

      // Rafraîchir les données
      mutate();
      setIsPublicationModalOpen(false);
      toast({
        title: "Résultats publiés",
        description:
          result.message || "Les résultats ont été publiés avec succès",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur publication résultats:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la publication des résultats",
        variant: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublierResultat = async (resultatId: string) => {
    try {
      await sessionService.publierResultat(resultatId);
      mutate();
      toast({
        title: "Résultat publié",
        description: "Le résultat a été publié avec succès",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur publication résultat:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la publication du résultat",
        variant: "error",
      });
    }
  };

  const handleDepublierResultat = async (resultatId: string) => {
    try {
      await sessionService.depublierResultat(resultatId);
      mutate();
      toast({
        title: "Résultat dépublié",
        description: "Le résultat a été dépublié avec succès",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur dépublication résultat:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la dépublication du résultat",
        variant: "error",
      });
    }
  };

  const handleVoirDetails = (resultatId: string) => {
    setSelectedResultatId(resultatId);
  };

  const getStatutColor = (statut: ResultatEtudiant["statut"]) => {
    switch (statut) {
      case "termine":
        return "success";
      case "en_cours":
        return "primary";
      case "abandonne":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatutLabel = (statut: ResultatEtudiant["statut"]) => {
    switch (statut) {
      case "termine":
        return "Terminé";
      case "en_cours":
        return "En cours";
      case "abandonne":
        return "Abandonné";
      default:
        return statut;
    }
  };

  const getNoteColor = (pourcentage: number) => {
    if (pourcentage >= 75) return "success";
    if (pourcentage >= 50) return "warning";

    return "danger";
  };

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-blue-500 rounded-lg p-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Étudiants</p>
              <p className="text-2xl font-bold">{stats.total_etudiants}</p>
              <p className="text-xs text-default-400">
                {stats.termine} terminés, {stats.en_cours} en cours
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-green-500 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Moyenne Générale</p>
              <p className="text-2xl font-bold">{stats.moyenne.toFixed(1)}%</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-purple-500 rounded-lg p-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Taux de Réussite</p>
              <p className="text-2xl font-bold">
                {stats.taux_reussite.toFixed(0)}%
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="bg-orange-500 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-default-500">Meilleure Note</p>
              <p className="text-2xl font-bold">
                {stats.meilleure_note.toFixed(0)}%
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Liste des résultats */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Résultats des Étudiants</h3>
            {resultatsEtudiants.length !== resultatsFiltres.length && (
              <p className="text-sm text-default-500 mt-1">
                {resultatsFiltres.length} sur {resultatsEtudiants.length}{" "}
                résultat{resultatsEtudiants.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <ResultatsFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() =>
                setFilters({
                  statutPublication: "tous",
                  statutReussite: "tous",
                })
              }
            />
            <Button
              color="success"
              size="sm"
              startContent={<Upload className="w-4 h-4" />}
              variant="flat"
              onPress={handlePublierTous}
            >
              Publier tous les résultats
            </Button>
            <Button
              color="primary"
              isLoading={isExportingSession}
              size="sm"
              startContent={
                !isExportingSession && <Download className="w-4 h-4" />
              }
              variant="flat"
              onPress={handleExportPDF}
            >
              Exporter PDF
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-default-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-danger">
              Erreur lors du chargement des résultats
            </div>
          ) : resultatsFiltres.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-default-300" />
              <h3 className="text-lg font-semibold mb-2">
                {resultatsEtudiants.length === 0
                  ? "Aucun résultat"
                  : "Aucun résultat ne correspond aux filtres"}
              </h3>
              <p className="text-default-500">
                {resultatsEtudiants.length === 0
                  ? "Aucun étudiant n'a encore passé cette session"
                  : "Essayez de modifier vos critères de filtrage"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {resultatsPagination.map((resultat) => (
                  <div
                    key={resultat.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
                  >
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">
                        {resultat.etudiant?.name
                          ? resultat.etudiant.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          : "?"}
                      </span>
                    </div>

                    {/* Informations étudiant */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {resultat.etudiant?.name || "Nom non disponible"}
                      </h4>
                      <p className="text-sm text-default-500">
                        {resultat.etudiant?.email || "Email non disponible"}
                      </p>
                    </div>

                    {/* Note et progression */}
                    {resultat.statut === "termine" ? (
                      <div className="flex-shrink-0 text-right min-w-[120px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold">
                            {(resultat.pourcentage || 0).toFixed(0)}%
                          </span>
                          {(resultat.pourcentage || 0) >= 50 ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-danger" />
                          )}
                        </div>
                        <p className="text-xs text-default-400">
                          {(resultat.note || 0).toFixed(1)} /{" "}
                          {(resultat.noteMax || 20).toFixed(1)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 min-w-[120px]">
                        <Chip
                          color={getStatutColor(resultat.statut)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatutLabel(resultat.statut)}
                        </Chip>
                      </div>
                    )}

                    {/* Statut de publication */}
                    <div className="flex-shrink-0">
                      <Chip
                        color={resultat.estPublie ? "success" : "warning"}
                        size="sm"
                        variant="flat"
                      >
                        {resultat.estPublie ? "Publié" : "Non publié"}
                      </Chip>
                    </div>

                    {/* Barre de progression */}
                    {resultat.statut === "termine" && (
                      <div className="w-32 flex-shrink-0">
                        <Progress
                          color={getNoteColor(resultat.pourcentage || 0)}
                          showValueLabel={false}
                          size="sm"
                          value={resultat.pourcentage || 0}
                        />
                      </div>
                    )}

                    {/* Boutons d'action */}
                    {resultat.statut === "termine" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          color="default"
                          size="sm"
                          startContent={<Eye className="w-4 h-4" />}
                          variant="flat"
                          onPress={() => handleVoirDetails(resultat.id)}
                        >
                          Détails
                        </Button>
                        <Button
                          color={resultat.estPublie ? "warning" : "success"}
                          size="sm"
                          startContent={<Upload className="w-4 h-4" />}
                          variant="flat"
                          onPress={() =>
                            resultat.estPublie
                              ? handleDepublierResultat(resultat.id)
                              : handlePublierResultat(resultat.id)
                          }
                        >
                          {resultat.estPublie ? "Dépublier" : "Publier"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-default-200">
                  <p className="text-sm text-default-500">
                    Page {currentPage} sur {totalPages} (
                    {resultatsFiltres.length} résultat
                    {resultatsFiltres.length > 1 ? "s" : ""})
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      isDisabled={currentPage === 1}
                      size="sm"
                      variant="flat"
                      onPress={() => setCurrentPage(1)}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      isDisabled={currentPage === 1}
                      size="sm"
                      variant="flat"
                      onPress={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-3">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      isIconOnly
                      isDisabled={currentPage === totalPages}
                      size="sm"
                      variant="flat"
                      onPress={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      isDisabled={currentPage === totalPages}
                      size="sm"
                      variant="flat"
                      onPress={() => setCurrentPage(totalPages)}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Modales */}
      <PublicationConfirmModal
        isLoading={isPublishing}
        isOpen={isPublicationModalOpen}
        nombreResultats={
          resultatsFiltres.filter((r) => r.statut === "termine" && !r.estPublie)
            .length
        }
        onClose={() => setIsPublicationModalOpen(false)}
        onConfirm={confirmPublierTous}
      />

      {selectedResultatId && (
        <DetailEtudiantModal
          isOpen={!!selectedResultatId}
          resultatId={selectedResultatId}
          onClose={() => setSelectedResultatId(null)}
        />
      )}
    </div>
  );
}
