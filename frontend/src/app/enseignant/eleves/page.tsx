"use client";

import type { Niveau } from "@/shared/types/niveau.types";
import type { Parcours } from "@/shared/types/parcours.types";
import type { Matiere } from "@/shared/types/matiere.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileDown,
  Eye,
} from "lucide-react";
import useSWR from "swr";
import { Chip } from "@heroui/chip";

import { useAuth } from "@/core/providers/AuthProvider";
import { enseignantService } from "@/shared/services/api/enseignant.service";
import { niveauService } from "@/shared/services/api/niveau.service";
import { parcoursService } from "@/shared/services/api/parcours.service";
import { useToast } from "@/hooks/use-toast";
import { downloadPDF } from "@/lib/pdf-utils";
import { DetailEleveModal } from "@/features/enseignant/components/eleves/DetailEleveModal";

interface EtudiantEleve {
  id: string;
  nom?: string;
  name?: string;
  email?: string;
  numero_etudiant?: string;
  numeroEtudiant?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  niveau?: { nom: string; id: string } | Niveau;
  parcours?: { nom: string; id: string } | Parcours;
  mention?: { nom: string; id: string };
  etablissement?: { nom: string; id: string };
  anneeAdmission?: string;
  matieres?: Array<{ id: string; nom: string; code?: string }>;
}

export default function ElevesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [eleves, setEleves] = React.useState<EtudiantEleve[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [exporting, setExporting] = React.useState(false);
  const [showExportConfirm, setShowExportConfirm] = React.useState(false);
  const [selectedEleveId, setSelectedEleveId] = React.useState<string | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // URL state management
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    niveau_id: parseAsString,
    matiere_id: parseAsString,
    parcours_id: parseAsString,
  });

  // Charger les données de l'enseignant avec relations
  const { data: enseignantData } = useSWR(
    user ? "enseignant-me-with-relations" : null,
    () => enseignantService.getMe(true),
  );

  // Charger les niveaux et parcours pour les filtres
  const { data: niveaux } = useSWR<Niveau[]>("niveaux-list", () =>
    niveauService.getNiveaux(true),
  );

  const { data: parcours } = useSWR<Parcours[]>("parcours-list", () =>
    parcoursService.getParcours(true),
  );

  // Récupérer les matières de l'enseignant
  const matieresEnseignant: Matiere[] = (enseignantData as any)?.matieres || [];

  React.useEffect(() => {
    fetchEleves();
  }, [filters]);

  const fetchEleves = async () => {
    try {
      setLoading(true);
      const response = await enseignantService.getMyEtudiants({
        page: filters.page,
        per_page: 10,
        niveau_id: filters.niveau_id || undefined,
        matiere_id: filters.matiere_id || undefined,
        parcours_id: filters.parcours_id || undefined,
      });

      setEleves(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors du chargement des élèves",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    // Vérifier s'il y a des filtres
    const hasFilters =
      filters.niveau_id || filters.matiere_id || filters.parcours_id;

    if (!hasFilters) {
      // Afficher le popover de confirmation
      setShowExportConfirm(true);

      return;
    }

    // Exporter directement
    await doExportPDF();
  };

  const doExportPDF = async () => {
    try {
      setExporting(true);
      setShowExportConfirm(false);

      const blob = await enseignantService.exportMyEtudiantsPDF({
        niveau_id: filters.niveau_id || undefined,
        matiere_id: filters.matiere_id || undefined,
        parcours_id: filters.parcours_id || undefined,
      });

      const filename = `eleves_${new Date().toISOString().split("T")[0]}.pdf`;

      downloadPDF(blob, filename);

      toast({
        title: "Succès",
        description: "Export PDF réussi",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message || "Erreur lors de l'export PDF",
        variant: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "E";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getNiveauNom = (etudiant: EtudiantEleve) => {
    if (!etudiant.niveau) return "-";
    if (typeof etudiant.niveau === "object" && "nom" in etudiant.niveau) {
      return etudiant.niveau.nom;
    }

    return "-";
  };

  const getParcoursNom = (etudiant: EtudiantEleve) => {
    if (!etudiant.parcours) return "-";
    if (typeof etudiant.parcours === "object" && "nom" in etudiant.parcours) {
      return etudiant.parcours.nom;
    }

    return "-";
  };

  if (loading && eleves.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-default-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes Élèves</h1>
          <p className="text-default-500">
            {total} élève{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Popover
          isOpen={showExportConfirm}
          placement="bottom"
          onOpenChange={setShowExportConfirm}
        >
          <PopoverTrigger>
            <Button
              className="bg-theme-primary text-white hover:bg-theme-primary/90"
              isLoading={exporting}
              startContent={<FileDown className="w-4 h-4" />}
              onPress={handleExportPDF}
            >
              Exporter en PDF
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="px-1 py-2">
              <div className="text-small font-bold mb-2">
                Confirmation d'export
              </div>
              <div className="text-tiny mb-3">
                Vous êtes sur le point d'exporter tous les élèves sans filtre.
                Êtes-vous sûr de vouloir continuer ?
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setShowExportConfirm(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-theme-primary text-white"
                  size="sm"
                  onPress={doExportPDF}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Niveau"
              placeholder="Tous les niveaux"
              selectedKeys={filters.niveau_id ? [filters.niveau_id] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;

                setFilters({
                  niveau_id: selected || null,
                  page: 1,
                });
              }}
            >
              {(niveaux || []).map((niveau) => (
                <SelectItem key={niveau.id}>{niveau.nom}</SelectItem>
              ))}
            </Select>

            <Select
              label="Matière"
              placeholder="Toutes les matières"
              selectedKeys={filters.matiere_id ? [filters.matiere_id] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;

                setFilters({
                  matiere_id: selected || null,
                  page: 1,
                });
              }}
            >
              {matieresEnseignant.map((matiere) => (
                <SelectItem key={matiere.id}>{matiere.nom}</SelectItem>
              ))}
            </Select>

            <Select
              label="Parcours"
              placeholder="Tous les parcours"
              selectedKeys={filters.parcours_id ? [filters.parcours_id] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;

                setFilters({
                  parcours_id: selected || null,
                  page: 1,
                });
              }}
            >
              {(parcours || []).map((parc) => (
                <SelectItem key={parc.id}>{parc.nom}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-default-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Élève
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Numéro
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Niveau
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Parcours
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Matières
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {eleves.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-default-500"
                      colSpan={8}
                    >
                      Aucun élève trouvé
                    </td>
                  </tr>
                ) : (
                  eleves.map((eleve) => (
                    <tr key={eleve.id} className="hover:bg-default-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-sm font-semibold text-theme-primary">
                            {getInitials(eleve.nom || eleve.name)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {eleve.nom || eleve.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {eleve.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {eleve.numero_etudiant || eleve.numeroEtudiant || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {getNiveauNom(eleve)}
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {getParcoursNom(eleve)}
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {eleve.telephone || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {eleve.matieres && eleve.matieres.length > 0 ? (
                            eleve.matieres.slice(0, 3).map((matiere) => (
                              <Chip
                                key={matiere.id}
                                color="secondary"
                                size="sm"
                                variant="flat"
                              >
                                {matiere.code || matiere.nom}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-default-400 text-xs">
                              Aucune matière
                            </span>
                          )}
                          {eleve.matieres && eleve.matieres.length > 3 && (
                            <Chip color="default" size="sm" variant="flat">
                              +{eleve.matieres.length - 3}
                            </Chip>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedEleveId(eleve.id);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Modal de détails */}
      {selectedEleveId && (
        <DetailEleveModal
          eleveData={eleves.find((e) => e.id === selectedEleveId)}
          eleveId={selectedEleveId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEleveId(null);
          }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-default-500">
            Page {filters.page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              isDisabled={filters.page === 1}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: 1 })}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              isDisabled={filters.page === 1}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: filters.page - 1 })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-3">
              {filters.page} / {totalPages}
            </span>
            <Button
              isIconOnly
              isDisabled={filters.page === totalPages}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: filters.page + 1 })}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              isDisabled={filters.page === totalPages}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: totalPages })}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
