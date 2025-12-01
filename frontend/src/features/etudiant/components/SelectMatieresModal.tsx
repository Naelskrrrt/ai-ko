"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Spinner,
  Input,
} from "@heroui/react";
import { Search, BookOpen } from "lucide-react";

import { qcmsService, type Matiere } from "../services/qcms.service";

import { useToast } from "@/hooks/use-toast";

interface SelectMatieresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isRequired?: boolean; // Si true, le modal ne peut pas être fermé sans sélectionner
}

export function SelectMatieresModal({
  isOpen,
  onClose,
  onSuccess,
  isRequired = false,
}: SelectMatieresModalProps) {
  const { toast } = useToast();
  const [matieresDisponibles, setMatieresDisponibles] = React.useState<
    Matiere[]
  >([]);
  const [matieresSelectionnees, setMatieresSelectionnees] = React.useState<
    string[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Charger les matières disponibles et celles déjà sélectionnées
  React.useEffect(() => {
    if (isOpen) {
      loadMatieres();
    }
  }, [isOpen]);

  const loadMatieres = async () => {
    try {
      setIsLoading(true);
      const [disponibles, mesMatieres] = await Promise.all([
        qcmsService.getMatieresDisponibles(),
        qcmsService.getMesMatieres(),
      ]);

      setMatieresDisponibles(disponibles);
      setMatieresSelectionnees(mesMatieres.map((m) => m.id));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur chargement matières:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les matières",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMatiere = (matiereId: string) => {
    setMatieresSelectionnees((prev) =>
      prev.includes(matiereId)
        ? prev.filter((id) => id !== matiereId)
        : [...prev, matiereId],
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await qcmsService.updateMesMatieres(matieresSelectionnees);
      toast({
        title: "Succès",
        description: "Vos matières ont été mises à jour",
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur sauvegarde matières:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les matières",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMatieres = React.useMemo(() => {
    if (!searchQuery) return matieresDisponibles;
    const query = searchQuery.toLowerCase();

    return matieresDisponibles.filter(
      (m) =>
        m.nom.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query),
    );
  }, [matieresDisponibles, searchQuery]);

  return (
    <Modal
      isDismissable={!isRequired}
      isKeyboardDismissDisabled={isRequired}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={isRequired ? undefined : onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">
                Sélectionner vos matières
              </h2>
              <p className="text-sm text-default-500 font-normal">
                Choisissez les matières que vous suivez pour voir les QCMs
                correspondants
              </p>
            </ModalHeader>
            <ModalBody>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  {/* Barre de recherche */}
                  <Input
                    className="mb-4"
                    placeholder="Rechercher une matière..."
                    startContent={<Search className="w-4 h-4" />}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />

                  {/* Liste des matières */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredMatieres.length === 0 ? (
                      <div className="text-center py-8 text-default-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucune matière trouvée</p>
                      </div>
                    ) : (
                      filteredMatieres.map((matiere) => (
                        <div
                          key={matiere.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-100 transition-colors"
                        >
                          <Checkbox
                            isSelected={matieresSelectionnees.includes(
                              matiere.id,
                            )}
                            size="lg"
                            onValueChange={() =>
                              handleToggleMatiere(matiere.id)
                            }
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{matiere.nom}</span>
                              <span className="text-sm text-default-500">
                                {matiere.code}
                              </span>
                              {matiere.description && (
                                <span className="text-xs text-default-400 mt-1">
                                  {matiere.description}
                                </span>
                              )}
                            </div>
                          </Checkbox>
                        </div>
                      ))
                    )}
                  </div>

                  {matieresSelectionnees.length > 0 && (
                    <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <p className="text-sm text-primary-700 dark:text-primary-300">
                        {matieresSelectionnees.length} matière
                        {matieresSelectionnees.length > 1 ? "s" : ""}{" "}
                        sélectionnée
                        {matieresSelectionnees.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </>
              )}
            </ModalBody>
            <ModalFooter>
              {!isRequired && (
                <Button isDisabled={isSaving} variant="light" onPress={onClose}>
                  Annuler
                </Button>
              )}
              <Button
                color="primary"
                isDisabled={
                  isLoading ||
                  (isRequired && matieresSelectionnees.length === 0)
                }
                isLoading={isSaving}
                onPress={handleSave}
              >
                {isRequired ? "Continuer" : "Enregistrer"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
