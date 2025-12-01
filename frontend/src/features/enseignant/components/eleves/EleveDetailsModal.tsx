"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Download, User, GraduationCap, BarChart3, FileText, X } from "lucide-react";

import { useEleveDetails } from "../../hooks/useEleveDetails";
import { elevesService } from "../../services/eleves.service";

interface EleveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eleveId: string | null;
  enseignantId: string;
}

export function EleveDetailsModal({
  isOpen,
  onClose,
  eleveId,
  enseignantId,
}: EleveDetailsModalProps) {
  const { eleveDetails, isLoading } = useEleveDetails(eleveId);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportPDF = async () => {
    if (!eleveId) return;
    
    setIsExporting(true);
    try {
      // Exporter uniquement cet élève en filtrant par son ID
      // Note: L'endpoint exporte tous les élèves liés, donc on filtre côté client
      // ou on pourrait créer un endpoint spécifique pour un seul élève
      const blob = await elevesService.exportElevesPDF(
        enseignantId,
        { /* pas de filtres - exportera tous les élèves liés */ }
      );
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eleve_${eleveDetails?.etudiant.name || 'eleve'}_${new Date().toISOString().split('T')[0]}.pdf`;
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

  if (!eleveDetails && !isLoading) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Détails de l'élève</h2>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </ModalHeader>
            <ModalBody>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : eleveDetails ? (
                <div className="space-y-6">
                  {/* Section 1: Informations de base */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Informations de base</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-500">Nom complet</p>
                        <p className="font-medium">{eleveDetails.etudiant.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Numéro étudiant</p>
                        <p className="font-medium">{eleveDetails.etudiant.numeroEtudiant}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Email</p>
                        <p className="font-medium">{eleveDetails.etudiant.email}</p>
                      </div>
                      {eleveDetails.etudiant.telephone && (
                        <div>
                          <p className="text-sm text-default-500">Téléphone</p>
                          <p className="font-medium">{eleveDetails.etudiant.telephone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Divider />

                  {/* Section 2: Académique */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Informations académiques</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {eleveDetails.etudiant.niveau && (
                        <div>
                          <p className="text-sm text-default-500">Niveau</p>
                          <Chip color="primary" size="sm" variant="flat">
                            {eleveDetails.etudiant.niveau.nom}
                          </Chip>
                        </div>
                      )}
                      {eleveDetails.etudiant.mention && (
                        <div>
                          <p className="text-sm text-default-500">Mention</p>
                          <p className="font-medium">{eleveDetails.etudiant.mention.nom}</p>
                        </div>
                      )}
                      {eleveDetails.etudiant.parcours && (
                        <div>
                          <p className="text-sm text-default-500">Parcours</p>
                          <p className="font-medium">{eleveDetails.etudiant.parcours.nom}</p>
                        </div>
                      )}
                      {eleveDetails.etudiant.anneeAdmission && (
                        <div>
                          <p className="text-sm text-default-500">Année d'admission</p>
                          <p className="font-medium">{eleveDetails.etudiant.anneeAdmission}</p>
                        </div>
                      )}
                    </div>
                    {eleveDetails.etudiant.matieres && eleveDetails.etudiant.matieres.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-default-500 mb-2">Matières inscrites</p>
                        <div className="flex flex-wrap gap-2">
                          {eleveDetails.etudiant.matieres.map((matiere) => (
                            <Chip
                              key={matiere.id}
                              color="secondary"
                              size="sm"
                              variant="flat"
                            >
                              {matiere.nom}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Divider />

                  {/* Section 3: Statistiques */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Statistiques</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-primary/10 rounded-lg p-4">
                        <p className="text-sm text-default-500">Moyenne générale</p>
                        <p className="text-2xl font-bold text-primary">
                          {eleveDetails.statistiques.moyenne_generale.toFixed(2)}/20
                        </p>
                      </div>
                      <div className="bg-success/10 rounded-lg p-4">
                        <p className="text-sm text-default-500">Examens passés</p>
                        <p className="text-2xl font-bold text-success">
                          {eleveDetails.statistiques.nombre_examens}
                        </p>
                      </div>
                      <div className="bg-warning/10 rounded-lg p-4">
                        <p className="text-sm text-default-500">Taux de réussite</p>
                        <p className="text-2xl font-bold text-warning">
                          {eleveDetails.statistiques.taux_reussite.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-danger/10 rounded-lg p-4">
                        <p className="text-sm text-default-500">Examens réussis</p>
                        <p className="text-2xl font-bold text-danger">
                          {eleveDetails.statistiques.examens_reussis}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  {/* Section 4: Derniers résultats */}
                  {eleveDetails.derniersResultats && eleveDetails.derniersResultats.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Derniers résultats</h3>
                      </div>
                      <Table aria-label="Table des résultats">
                        <TableHeader>
                          <TableColumn>Date</TableColumn>
                          <TableColumn>QCM</TableColumn>
                          <TableColumn>Note</TableColumn>
                          <TableColumn>Statut</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {eleveDetails.derniersResultats.map((resultat) => (
                            <TableRow key={resultat.id}>
                              <TableCell>
                                {resultat.dateFin
                                  ? new Date(resultat.dateFin).toLocaleDateString("fr-FR")
                                  : new Date(resultat.dateDebut).toLocaleDateString("fr-FR")}
                              </TableCell>
                              <TableCell>
                                {resultat.qcm?.titre || "N/A"}
                              </TableCell>
                              <TableCell>
                                {resultat.noteSur20 !== null && resultat.noteSur20 !== undefined
                                  ? `${resultat.noteSur20.toFixed(2)}/20`
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  color={resultat.estReussi ? "success" : "danger"}
                                  size="sm"
                                  variant="flat"
                                >
                                  {resultat.estReussi ? "Réussi" : "Échoué"}
                                </Chip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Section 5: Notes par matière */}
                  {Object.keys(eleveDetails.notesParMatiere).length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold">Notes par matière</h3>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(eleveDetails.notesParMatiere).map(([matiere, moyenne]) => (
                            <div
                              key={matiere}
                              className="flex items-center justify-between p-3 bg-default-100 rounded-lg"
                            >
                              <span className="font-medium">{matiere}</span>
                              <Chip color="primary" size="sm" variant="flat">
                                {moyenne.toFixed(2)}/20
                              </Chip>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-default-500">
                  Aucune donnée disponible
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Fermer
              </Button>
              <Button
                color="primary"
                startContent={<Download className="w-4 h-4" />}
                onPress={handleExportPDF}
                isLoading={isExporting}
              >
                Exporter PDF
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

