"use client";

import type { EleveBase, EleveFilters } from "../../types/eleves.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Users, Eye, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@heroui/modal";
import useSWR from "swr";

import { useEleves } from "../../hooks/useEleves";
import { elevesService } from "../../services/eleves.service";
import { profileService } from "@/shared/services/api/profile.service";
import { useAuth } from "@/core/providers/AuthProvider";

import { ElevesFilters } from "./ElevesFilters";
import { EleveDetailsModal } from "./EleveDetailsModal";

import { ListPageLayout } from "@/shared/components/layout/ListPageLayout";

interface ElevesListProps {
  enseignantId: string;
}

export function ElevesList({ enseignantId }: ElevesListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEleveId, setSelectedEleveId] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Filtres
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filters, setFilters] = React.useState<EleveFilters>({
    matiere_id: undefined,
    niveau_id: undefined,
    parcours_id: undefined,
    annee_scolaire: undefined,
  });

  // Récupérer les données de l'enseignant pour les options de filtres
  const { data: profileData } = useSWR(
    user?.role === "enseignant" ? ["profile-enseignant-eleves", "enseignant"] : null,
    async () => {
      return await profileService.getMyProfile("enseignant");
    },
  );

  // Extraire les options de filtres depuis le profil
  const matiereOptions = React.useMemo(() => {
    if (profileData && "matieres" in profileData && profileData.matieres) {
      return profileData.matieres.map((m: any) => ({
        id: m.id,
        nom: m.nom,
      }));
    }
    return [];
  }, [profileData]);

  const niveauOptions = React.useMemo(() => {
    if (profileData && "niveaux" in profileData && profileData.niveaux) {
      return profileData.niveaux.map((n: any) => ({
        id: n.id,
        nom: n.nom,
      }));
    }
    return [];
  }, [profileData]);

  const parcoursOptions = React.useMemo(() => {
    if (profileData && "parcours" in profileData && profileData.parcours) {
      const parcoursArray = Array.isArray(profileData.parcours)
        ? profileData.parcours
        : [profileData.parcours];
      return parcoursArray.map((p: any) => ({
        id: p.id,
        nom: p.nom,
      }));
    }
    return [];
  }, [profileData]);

  // Récupérer les élèves
  const { eleves, isLoading, error, mutate } = useEleves(enseignantId, {
    ...filters,
    page: 1,
    per_page: 100,
  });

  // Filtrer localement par recherche
  const filteredEleves = React.useMemo(() => {
    if (!searchQuery) return eleves;

    const query = searchQuery.toLowerCase();
    return eleves.filter(
      (eleve) =>
        eleve.name?.toLowerCase().includes(query) ||
        eleve.email?.toLowerCase().includes(query) ||
        eleve.numeroEtudiant?.toLowerCase().includes(query)
    );
  }, [eleves, searchQuery]);

  const handleFiltersChange = (newFilters: EleveFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      matiere_id: undefined,
      niveau_id: undefined,
      parcours_id: undefined,
      annee_scolaire: undefined,
    });
  };

  const handleViewDetails = (eleveId: string) => {
    setSelectedEleveId(eleveId);
    onOpen();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const blob = await elevesService.exportElevesPDF(enseignantId, filters);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eleves_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Modal de détails */}
      <EleveDetailsModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSelectedEleveId(null);
        }}
        eleveId={selectedEleveId}
        enseignantId={enseignantId}
      />

      <ListPageLayout
        addButtonLabel="Exporter PDF"
        contentWrapperClassName="p-4"
        description="Gérez vos élèves liés selon les critères de matière, niveau, parcours et mention"
        headerActions={
          <ElevesFilters
            filters={filters}
            matiereOptions={matiereOptions}
            niveauOptions={niveauOptions}
            parcoursOptions={parcoursOptions}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        }
        searchPlaceholder="Rechercher un élève..."
        searchValue={searchQuery}
        title="Mes Élèves"
        onAddClick={handleExportPDF}
        onSearchChange={setSearchQuery}
      >
        {/* Liste des élèves */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card>
                  <CardBody>
                    <div className="h-32 bg-default-200 rounded-lg" />
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        ) : error ? (
          <Card className="border-none shadow-sm">
            <CardBody className="text-center py-8 text-danger">
              Erreur lors du chargement des élèves
            </CardBody>
          </Card>
        ) : filteredEleves.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardBody className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-default-300" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun élève trouvé
              </h3>
              <p className="text-default-500 mb-4">
                {searchQuery || filters.matiere_id || filters.niveau_id || filters.parcours_id || filters.annee_scolaire
                  ? "Aucun élève ne correspond à vos critères de recherche"
                  : "Aucun élève n'est lié à votre profil pour le moment"}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEleves.map((eleve) => (
              <Card
                key={eleve.id}
                className="border-none shadow-sm hover:shadow-md transition-shadow"
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className="bg-primary/10 rounded-lg p-3">
                      <Users className="w-6 h-6 text-primary" />
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">
                              {eleve.name}
                            </h3>
                            {eleve.niveau && (
                              <Chip color="primary" size="sm" variant="flat">
                                {eleve.niveau.nom}
                              </Chip>
                            )}
                          </div>
                          <div className="text-sm text-default-500 space-y-1">
                            <p>Numéro: {eleve.numeroEtudiant}</p>
                            <p>Email: {eleve.email}</p>
                            {eleve.mention && (
                              <p>Mention: {eleve.mention.nom}</p>
                            )}
                            {eleve.parcours && (
                              <p>Parcours: {eleve.parcours.nom}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Matières */}
                      {eleve.matieres && eleve.matieres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {eleve.matieres.slice(0, 3).map((matiere) => (
                            <Chip
                              key={matiere.id}
                              color="secondary"
                              size="sm"
                              variant="flat"
                            >
                              {matiere.nom}
                            </Chip>
                          ))}
                          {eleve.matieres.length > 3 && (
                            <Chip color="default" size="sm" variant="flat">
                              +{eleve.matieres.length - 3}
                            </Chip>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          startContent={<Eye className="w-3 h-3" />}
                          variant="flat"
                          onPress={() => handleViewDetails(eleve.id)}
                        >
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </ListPageLayout>
    </>
  );
}

