"use client";

import type { SessionExamen } from "../../types/enseignant.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Calendar,
  Trash2,
  Eye,
  Play,
  Square,
  Pause,
  Clock,
} from "lucide-react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useDisclosure } from "@heroui/modal";

import { sessionService } from "../../services/session.service";

import { CreateSessionModal } from "./CreateSessionModal";
import { SessionsFilters } from "./SessionsFilters";

import { ListPageLayout } from "@/shared/components/layout/ListPageLayout";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

interface SessionListProps {
  userId: string;
}

export function SessionList({ userId }: SessionListProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isTerminerConfirmOpen,
    onOpen: onTerminerConfirmOpen,
    onClose: onTerminerConfirmClose,
  } = useDisclosure();
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(
    null,
  );
  const [sessionToTerminer, setSessionToTerminer] = React.useState<
    string | null
  >(null);

  // Filtres dans l'URL avec nuqs
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateDebutFilter, setDateDebutFilter] = useQueryState(
    "dateDebut",
    parseAsString.withDefault(""),
  );
  const [dateFinFilter, setDateFinFilter] = useQueryState(
    "dateFin",
    parseAsString.withDefault(""),
  );
  const [qcmIdFilter, setQcmIdFilter] = useQueryState(
    "qcmId",
    parseAsString.withDefault(""),
  );
  const [matiereFilter, setMatiereFilter] = useQueryState(
    "matiere",
    parseAsString.withDefault(""),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );

  // Récupérer les sessions
  const { data, isLoading, error, mutate } = useSWR(
    ["enseignant-sessions-list", userId],
    () => sessionService.getSessions({ limit: 100 }),
  );

  const sessions = data?.data || [];

  // Extraire les QCMs uniques
  const qcmOptions = React.useMemo(() => {
    const uniqueQcms = new Map<string, { id: string; titre: string }>();

    sessions.forEach((session) => {
      if (session.qcm && session.qcmId) {
        uniqueQcms.set(session.qcmId, {
          id: session.qcmId,
          titre: session.qcm.titre,
        });
      }
    });

    return Array.from(uniqueQcms.values());
  }, [sessions]);

  // Extraire les matières uniques
  const matiereOptions = React.useMemo(() => {
    const uniqueMatieres = new Set<string>();

    sessions.forEach((session) => {
      if (session.matiere) {
        uniqueMatieres.add(session.matiere);
      }
    });

    return Array.from(uniqueMatieres).sort();
  }, [sessions]);

  // Filtrer localement par recherche et filtres
  const filteredSessions = React.useMemo(() => {
    let result = sessions;

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      result = result.filter(
        (session) =>
          session.titre.toLowerCase().includes(query) ||
          session.description?.toLowerCase().includes(query) ||
          session.qcm?.titre.toLowerCase().includes(query) ||
          session.matiere?.toLowerCase().includes(query),
      );
    }

    // Filtrer par date de début
    if (dateDebutFilter && dateFinFilter) {
      result = result.filter((session) => {
        const sessionDate = new Date(session.dateDebut);
        const startDate = new Date(dateDebutFilter);
        const endDate = new Date(dateFinFilter);

        return sessionDate >= startDate && sessionDate <= endDate;
      });
    }

    // Filtrer par QCM
    if (qcmIdFilter && qcmIdFilter !== "tous") {
      result = result.filter((session) => session.qcmId === qcmIdFilter);
    }

    // Filtrer par matière
    if (matiereFilter && matiereFilter !== "tous") {
      result = result.filter((session) => session.matiere === matiereFilter);
    }

    // Filtrer par statut
    if (statusFilter && statusFilter !== "tous") {
      result = result.filter((session) => session.status === statusFilter);
    }

    return result;
  }, [
    sessions,
    searchQuery,
    dateDebutFilter,
    dateFinFilter,
    qcmIdFilter,
    matiereFilter,
    statusFilter,
  ]);

  const handleDelete = (id: string) => {
    setSessionToDelete(id);
    onDeleteConfirmOpen();
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await sessionService.deleteSession(sessionToDelete);
      mutate();
      setSessionToDelete(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur suppression session:", error);
      alert("Erreur lors de la suppression de la session");
    }
  };

  const handleDemarrer = async (id: string) => {
    try {
      await sessionService.demarrerSession(id);
      mutate();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur démarrage session:", error);
      alert("Erreur lors du démarrage de la session");
    }
  };

  const handleTerminer = (id: string) => {
    setSessionToTerminer(id);
    onTerminerConfirmOpen();
  };

  const confirmTerminer = async () => {
    if (!sessionToTerminer) return;
    try {
      await sessionService.terminerSession(sessionToTerminer);
      mutate();
      setSessionToTerminer(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur fin session:", error);
      alert("Erreur lors de la terminaison de la session");
    }
  };

  const handleMettreEnPause = async (id: string) => {
    try {
      await sessionService.mettreEnPause(id);
      mutate();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur mise en pause:", error);
      alert("Erreur lors de la mise en pause de la session");
    }
  };

  const handleReprendre = async (id: string) => {
    try {
      await sessionService.reprendreSession(id);
      mutate();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur reprise session:", error);
      alert("Erreur lors de la reprise de la session");
    }
  };

  const getStatusColor = (status: SessionExamen["status"]) => {
    switch (status) {
      case "en_cours":
        return "success";
      case "en_pause":
        return "warning";
      case "programmee":
        return "primary";
      case "terminee":
        return "default";
      case "annulee":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: SessionExamen["status"]) => {
    switch (status) {
      case "en_cours":
        return "En cours";
      case "en_pause":
        return "En pause";
      case "programmee":
        return "Programmée";
      case "terminee":
        return "Terminée";
      case "annulee":
        return "Annulée";
      default:
        return status;
    }
  };

  const handleFiltersChange = (newFilters: {
    dateDebut: string | null;
    dateFin: string | null;
    qcmId: string | null;
    matiere: string | null;
    status: string | null;
  }) => {
    setDateDebutFilter(newFilters.dateDebut || "");
    setDateFinFilter(newFilters.dateFin || "");
    setQcmIdFilter(newFilters.qcmId || "");
    setMatiereFilter(newFilters.matiere || "");
    setStatusFilter(newFilters.status || "");
  };

  const handleResetFilters = () => {
    setDateDebutFilter("");
    setDateFinFilter("");
    setQcmIdFilter("");
    setMatiereFilter("");
    setStatusFilter("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <>
      {/* Modal de création de session */}
      <CreateSessionModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={() => {
          mutate();
          onClose();
        }}
      />

      <ListPageLayout
        addButtonLabel="Nouvelle Session"
        contentWrapperClassName="p-4"
        description="Gérez vos sessions d'examen"
        headerActions={
          <SessionsFilters
            filters={{
              dateDebut: dateDebutFilter || null,
              dateFin: dateFinFilter || null,
              qcmId: qcmIdFilter || null,
              matiere: matiereFilter || null,
              status: statusFilter || null,
            }}
            matiereOptions={matiereOptions}
            qcmOptions={qcmOptions}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        }
        searchPlaceholder="Rechercher une session..."
        searchValue={searchQuery}
        title="Mes Sessions"
        onAddClick={onOpen}
        onSearchChange={setSearchQuery}
      >
        {/* Liste des sessions */}
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
              Erreur lors du chargement des sessions
            </CardBody>
          </Card>
        ) : filteredSessions.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardBody className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-default-300" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune session trouvée
              </h3>
              <p className="text-default-500 mb-4">
                {searchQuery ||
                dateDebutFilter ||
                dateFinFilter ||
                qcmIdFilter ||
                matiereFilter ||
                statusFilter
                  ? "Aucune session ne correspond à vos critères de recherche"
                  : "Commencez par créer votre première session d'examen"}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="border-none shadow-sm hover:shadow-md transition-shadow"
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className="bg-primary/10 rounded-lg p-3">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">
                              {session.titre}
                            </h3>
                            {session.matiere && (
                              <Chip color="primary" size="sm" variant="flat">
                                {session.matiere}
                              </Chip>
                            )}
                          </div>
                          {session.description && (
                            <p className="text-sm text-default-500 mt-1 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                        </div>
                        <Chip
                          color={getStatusColor(session.status)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusLabel(session.status)}
                        </Chip>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-default-500 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Début: {formatDate(session.dateDebut)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Durée: {session.dureeMinutes} min</span>
                        </div>
                        {session.qcm && (
                          <div>
                            <span className="font-medium">QCM:</span>{" "}
                            {session.qcm.titre}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          startContent={<Eye className="w-3 h-3" />}
                          variant="flat"
                          onPress={() =>
                            router.push(`/enseignant/sessions/${session.id}`)
                          }
                        >
                          Voir
                        </Button>
                        {/* <Button
                        size="sm"
                        variant="flat"
                        startContent={<Edit className="w-3 h-3" />}
                        onPress={() =>
                          router.push(`/enseignant/sessions/${session.id}/edit`)
                        }
                      >
                        Modifier
                      </Button> */}
                        {session.status === "programmee" && (
                          <Button
                            color="success"
                            size="sm"
                            startContent={<Play className="w-3 h-3" />}
                            variant="flat"
                            onPress={() => handleDemarrer(session.id)}
                          >
                            Démarrer
                          </Button>
                        )}
                        {session.status === "en_cours" && (
                          <>
                            <Button
                              color="warning"
                              size="sm"
                              startContent={<Pause className="w-3 h-3" />}
                              variant="flat"
                              onPress={() => handleMettreEnPause(session.id)}
                            >
                              Pause
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              startContent={<Square className="w-3 h-3" />}
                              variant="flat"
                              onPress={() => handleTerminer(session.id)}
                            >
                              Terminer
                            </Button>
                          </>
                        )}
                        {session.status === "en_pause" && (
                          <>
                            <Button
                              color="success"
                              size="sm"
                              startContent={<Play className="w-3 h-3" />}
                              variant="flat"
                              onPress={() => handleReprendre(session.id)}
                            >
                              Reprendre
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              startContent={<Square className="w-3 h-3" />}
                              variant="flat"
                              onPress={() => handleTerminer(session.id)}
                            >
                              Terminer
                            </Button>
                          </>
                        )}
                        <Button
                          color="danger"
                          size="sm"
                          startContent={<Trash2 className="w-3 h-3" />}
                          variant="flat"
                          onPress={() => handleDelete(session.id)}
                        >
                          Supprimer
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

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        cancelLabel="Annuler"
        confirmColor="danger"
        confirmLabel="Supprimer"
        isOpen={isDeleteConfirmOpen}
        message="Êtes-vous sûr de vouloir supprimer cette session ?"
        title="Supprimer la session"
        variant="danger"
        onClose={() => {
          onDeleteConfirmClose();
          setSessionToDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      {/* Modal de confirmation de terminaison */}
      <ConfirmDialog
        cancelLabel="Annuler"
        confirmColor="warning"
        confirmLabel="Terminer"
        isOpen={isTerminerConfirmOpen}
        message="Êtes-vous sûr de vouloir terminer cette session ?"
        title="Terminer la session"
        variant="warning"
        onClose={() => {
          onTerminerConfirmClose();
          setSessionToTerminer(null);
        }}
        onConfirm={confirmTerminer}
      />
    </>
  );
}
