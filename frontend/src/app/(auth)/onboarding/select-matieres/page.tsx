"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/react";
import { Search, BookOpen, Plus } from "lucide-react";

import { CreateMatiereModal } from "@/components/matieres/CreateMatiereModal";

interface Matiere {
  id: string;
  code: string;
  nom: string;
  description?: string;
}

export default function SelectMatieresPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [matieresDisponibles, setMatieresDisponibles] = useState<Matiere[]>([]);
  const [matieresSelectionnees, setMatieresSelectionnees] = useState<string[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Charger le rôle et les matières pré-sélectionnées
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("onboarding_role");

      if (!storedRole) {
        router.push("/onboarding/role-selection");

        return;
      }
      setRole(storedRole);

      // Charger matières pré-sélectionnées si elles existent
      const storedMatieres = localStorage.getItem("onboarding_matieres");

      if (storedMatieres) {
        try {
          setMatieresSelectionnees(JSON.parse(storedMatieres));
        } catch {
          // Ignore parsing errors
        }
      }
    }
  }, [router]);

  // Charger les matières une fois que le rôle est défini
  useEffect(() => {
    if (role) {
      loadMatieres();
    }
  }, [role]);

  const loadMatieres = async () => {
    if (!role) return;

    try {
      setIsLoading(true);
      // Utiliser l'endpoint approprié selon le rôle
      const endpoint =
        role === "etudiant" ? "/api/qcm-etudiant/matieres" : "/api/matieres";

      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Erreur chargement matières");

      const data = await response.json();

      setMatieresDisponibles(data);
    } catch {
      setError("Impossible de charger les matières");
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

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setMatieresSelectionnees(filteredMatieres.map((m) => m.id));
    } else {
      setMatieresSelectionnees([]);
    }
  };

  const handleContinue = () => {
    if (matieresSelectionnees.length === 0) {
      setError("Veuillez sélectionner au moins une matière");

      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "onboarding_matieres",
        JSON.stringify(matieresSelectionnees),
      );
    }
    router.push("/onboarding/confirmation");
  };

  const handleMatiereCreated = async (newMatiere: any) => {
    // Recharger la liste complète des matières pour avoir les données à jour
    await loadMatieres();
    // Sélectionner automatiquement la nouvelle matière
    setMatieresSelectionnees((prev) => [...prev, newMatiere.id]);
    setIsCreateModalOpen(false);
  };

  const filteredMatieres = useMemo(() => {
    if (!searchQuery) return matieresDisponibles;
    const query = searchQuery.toLowerCase();

    return matieresDisponibles.filter(
      (m) =>
        m.nom.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query),
    );
  }, [matieresDisponibles, searchQuery]);

  // Mettre à jour selectAll quand les matières filtrées changent
  useEffect(() => {
    if (filteredMatieres.length > 0) {
      const allSelected = filteredMatieres.every((m) =>
        matieresSelectionnees.includes(m.id),
      );

      setSelectAll(allSelected);
    }
  }, [filteredMatieres, matieresSelectionnees]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">
            {role === "etudiant" ? "Vos matières" : "Matières enseignées"}
          </h1>
          <p className="text-default-500">
            {role === "etudiant"
              ? "Sélectionnez les matières que vous étudiez"
              : "Sélectionnez les matières que vous enseignez"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Sélection des matières</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg border border-danger/20">
                {error}
              </div>
            )}

            {/* Barre de recherche et bouton ajouter (enseignant) */}
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Rechercher une matière..."
                startContent={<Search className="w-4 h-4" />}
                value={searchQuery}
                variant="bordered"
                onValueChange={setSearchQuery}
              />
              {role === "enseignant" && (
                <Button
                  color="primary"
                  startContent={<Plus className="w-4 h-4" />}
                  variant="flat"
                  onPress={() => setIsCreateModalOpen(true)}
                >
                  Ajouter
                </Button>
              )}
            </div>

            {/* Checkbox "Tout sélectionner" (seulement pour étudiants) */}
            {role === "etudiant" && (
              <Checkbox isSelected={selectAll} onValueChange={handleSelectAll}>
                Tout sélectionner
              </Checkbox>
            )}

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
                      isSelected={matieresSelectionnees.includes(matiere.id)}
                      size="lg"
                      onValueChange={() => handleToggleMatiere(matiere.id)}
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

            {/* Compteur */}
            {matieresSelectionnees.length > 0 && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  {matieresSelectionnees.length} matière
                  {matieresSelectionnees.length > 1 ? "s" : ""} sélectionnée
                  {matieresSelectionnees.length > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <Button
                className="flex-1"
                variant="bordered"
                onClick={() => router.back()}
              >
                Retour
              </Button>
              <Button
                className="flex-1 bg-theme-primary text-white"
                isDisabled={matieresSelectionnees.length === 0}
                onClick={handleContinue}
              >
                Continuer
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal de création de matière (enseignant uniquement) */}
      {role === "enseignant" && (
        <CreateMatiereModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleMatiereCreated}
        />
      )}
    </div>
  );
}
