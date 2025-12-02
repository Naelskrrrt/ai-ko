"use client";

import type { Etudiant } from "@/shared/types/admin.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/react";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserPlus,
  Check,
} from "lucide-react";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { adminService } from "@/shared/services/api/admin.service";
import { useToast } from "@/hooks/use-toast";

export default function EtudiantsPage() {
  const { toast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();

  const [etudiants, setEtudiants] = React.useState<Etudiant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [editingEtudiant, setEditingEtudiant] = React.useState<Etudiant | null>(
    null,
  );
  const [etudiantToDelete, setEtudiantToDelete] =
    React.useState<Etudiant | null>(null);

  // URL state management
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
    status: parseAsString.withDefault("all"),
  });

  React.useEffect(() => {
    fetchEtudiants();
  }, [filters]);

  const fetchEtudiants = async () => {
    try {
      setLoading(true);
      const response = await adminService.getEtudiants({
        page: filters.page,
        per_page: 10,
        search: filters.search || undefined,
        active:
          filters.status === "active"
            ? true
            : filters.status === "pending"
              ? false
              : undefined,
      });

      setEtudiants(response.data);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors du chargement des étudiants",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!etudiantToDelete) return;

    try {
      await adminService.deleteEtudiant(etudiantToDelete.id);
      toast({
        title: "Succès",
        description: "Étudiant supprimé avec succès",
        variant: "success",
      });
      onDeleteConfirmClose();
      fetchEtudiants();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de la suppression de l'étudiant",
        variant: "error",
      });
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

  if (loading && etudiants.length === 0) {
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
          <h1 className="text-3xl font-bold">Gestion des Étudiants</h1>
          <p className="text-default-500">
            {total} étudiant{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button
          className="bg-theme-primary text-white hover:bg-theme-primary/90"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onOpen}
        >
          Nouvel étudiant
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                classNames={{
                  input: "text-sm",
                }}
                placeholder="Rechercher par nom ou email..."
                startContent={<Search className="w-4 h-4 text-default-400" />}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ search: e.target.value, page: 1 })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filters.status === "all" ? "solid" : "bordered"}
                onClick={() => setFilters({ status: "all", page: 1 })}
              >
                Tous
              </Button>
              <Button
                size="sm"
                variant={filters.status === "active" ? "solid" : "bordered"}
                onClick={() => setFilters({ status: "active", page: 1 })}
              >
                Actifs
              </Button>
              <Button
                size="sm"
                variant={filters.status === "pending" ? "solid" : "bordered"}
                onClick={() => setFilters({ status: "pending", page: 1 })}
              >
                En attente
              </Button>
            </div>
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
                    Étudiant
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Numéro
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {etudiants.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-default-500"
                      colSpan={5}
                    >
                      Aucun étudiant trouvé
                    </td>
                  </tr>
                ) : (
                  etudiants.map((etudiant) => (
                    <tr key={etudiant.id} className="hover:bg-default-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-sm font-semibold text-theme-primary">
                            {getInitials(etudiant.name)}
                          </div>
                          <div>
                            <p className="font-medium">{etudiant.name}</p>
                            {etudiant.emailVerified && (
                              <Chip color="success" size="sm" variant="flat">
                                Vérifié
                              </Chip>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {etudiant.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {etudiant.numeroEtudiant || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {etudiant.telephone || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Actions">
                            {etudiant.isActive === false ? (
                              <DropdownItem
                                key="activate"
                                className="text-success"
                                startContent={<Check className="w-4 h-4" />}
                                onPress={async () => {
                                  try {
                                    await adminService.activateUser(
                                      etudiant.id,
                                    );
                                    toast({
                                      title: "Utilisateur activé",
                                      description: `${etudiant.name} peut maintenant se connecter`,
                                    });
                                    fetchEtudiants(); // Recharger la liste
                                  } catch (error: any) {
                                    toast({
                                      title: "Erreur",
                                      description:
                                        error.response?.data?.message ||
                                        "Erreur lors de l'activation",
                                      variant: "error",
                                    });
                                  }
                                }}
                              >
                                Valider le compte
                              </DropdownItem>
                            ) : null}
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="w-4 h-4" />}
                              onPress={() => {
                                setEditingEtudiant(etudiant);
                                onOpen();
                              }}
                            >
                              Modifier
                            </DropdownItem>
                            <DropdownItem
                              key="assign"
                              startContent={<UserPlus className="w-4 h-4" />}
                            >
                              Assigner classes/matières
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => {
                                setEtudiantToDelete(etudiant);
                                onDeleteConfirmOpen();
                              }}
                            >
                              Supprimer
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

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

      {/* Modal Create/Edit */}
      <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingEtudiant ? "Modifier l'étudiant" : "Nouvel étudiant"}
          </ModalHeader>
          <ModalBody>
            <p className="text-default-500">
              Fonctionnalité en cours de développement...
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Annuler
            </Button>
            <Button className="bg-theme-primary text-white">
              {editingEtudiant ? "Enregistrer" : "Créer"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        cancelLabel="Annuler"
        confirmLabel="Supprimer"
        isOpen={isDeleteConfirmOpen}
        message={`Êtes-vous sûr de vouloir supprimer l'étudiant "${etudiantToDelete?.name}" ?`}
        title="Supprimer l'étudiant"
        variant="danger"
        onClose={onDeleteConfirmClose}
        onConfirm={handleDelete}
      />
    </div>
  );
}
