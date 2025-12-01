"use client";

import * as React from "react";
import useSWR from "swr";
import { Card, CardBody, Input, Button } from "@heroui/react";
import { FileX, Search, BookOpen } from "lucide-react";

import { qcmsService } from "../../services/qcms.service";

import { QCMCard } from "./QCMCard";

export function QCMsList() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    data: qcms,
    isLoading,
    error,
    mutate,
  } = useSWR("qcms-disponibles", () => qcmsService.getDisponibles(), {
    revalidateOnFocus: true,
    refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const filteredQCMs = React.useMemo(() => {
    if (!qcms) return [];
    if (!searchQuery) return qcms;

    const query = searchQuery.toLowerCase();

    return qcms.filter(
      (qcm) =>
        qcm.titre.toLowerCase().includes(query) ||
        qcm.matiere.toLowerCase().includes(query) ||
        qcm.description?.toLowerCase().includes(query),
    );
  }, [qcms, searchQuery]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-default-100 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-danger-500">
        <CardBody>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileX className="h-12 w-12 text-danger mb-3" />
            <p className="text-danger font-semibold">
              Erreur lors du chargement des QCMs
            </p>
            <p className="text-sm text-default-500 mt-2">
              {error.message || "Une erreur est survenue"}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const handleOpenMatieresModal = () => {
    const event = new CustomEvent("open-matieres-modal");

    window.dispatchEvent(event);
  };

  if (!qcms || qcms.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileX className="h-12 w-12 text-default-300 mb-4" />
            <h3 className="text-lg font-semibold">Aucun QCM disponible</h3>
            <p className="text-default-500 mt-1">
              Aucun QCM publié n'est disponible pour vos matières pour le
              moment.
            </p>
            <p className="text-sm text-default-400 mt-2">
              Assurez-vous d'avoir sélectionné des matières dans votre profil et
              que vos enseignants ont publié des QCMs.
            </p>
            <Button
              className="mt-4"
              color="primary"
              startContent={<BookOpen className="w-4 h-4" />}
              variant="flat"
              onPress={handleOpenMatieresModal}
            >
              Sélectionner mes matières
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <Input
        className="max-w-md"
        placeholder="Rechercher un QCM..."
        startContent={<Search className="w-4 h-4" />}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      {/* Liste des QCMs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQCMs.map((qcm) => (
          <QCMCard key={qcm.id} qcm={qcm} />
        ))}
      </div>

      {filteredQCMs.length === 0 && searchQuery && (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-default-500">
              Aucun QCM trouvé pour "{searchQuery}"
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
