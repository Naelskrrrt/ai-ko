"use client";

import type { Professeur } from "@/shared/types/admin.types";

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
  BookOpen,
} from "lucide-react";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { adminService } from "@/shared/services/api/admin.service";
import { useToast } from "@/hooks/use-toast";

export default function ProfesseursPage() {
  const { toast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();

  const [professeurs, setProfesseurs] = React.useState<Professeur[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [editingProfesseur, setEditingProfesseur] = React.useState<Professeur | null>(null);
  const [professeurToDelete, setProfesseurToDelete] = React.useState<Professeur | null>(null);

  // URL state management
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
  });

  React.useEffect(() => {
    fetchProfesseurs();
  }, [filters]);

  const fetchProfesseurs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getProfesseurs({
        page: filters.page,
        per_page: 10,
        search: filters.search || undefined,
      });

      setProfesseurs(response.data);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors du chargement des professeurs",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!professeurToDelete) return;

    try {
      await adminService.deleteProfesseur(professeurToDelete.id);
      toast({
        title: "Succès",
        description: "Professeur supprimé avec succès",
        variant: "success",
      });
      onDeleteConfirmClose();
      fetchProfesseurs();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de la suppression du professeur",
        variant: "error",
      });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "P";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && professeurs.length === 0) {
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
          <h1 className="text-3xl font-bold">Gestion des Professeurs</h1>
          <p className="text-default-500">
            {total} professeur{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button
          className="bg-theme-primary text-white hover:bg-theme-primary/90"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onOpen}
        >
          Nouveau professeur
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom ou email..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
                startContent={<Search className="w-4 h-4 text-default-400" />}
                classNames={{
                  input: "text-sm",
                }}
              />
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
                    Professeur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Numéro
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Matières
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {professeurs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-default-500">
                      Aucun professeur trouvé
                    </td>
                  </tr>
                ) : (
                  professeurs.map((professeur) => (
                    <tr key={professeur.id} className="hover:bg-default-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-semibold text-green-600 dark:text-green-400">
                            {getInitials(professeur.name)}
                          </div>
                          <div>
                            <p className="font-medium">{professeur.name}</p>
                            {professeur.emailVerified && (
                              <Chip size="sm" color="success" variant="flat">
                                Vérifié
                              </Chip>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {professeur.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-default-600">
                        {professeur.numeroEnseignant || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {professeur.matieresEnseignees && professeur.matieresEnseignees.length > 0 ? (
                            professeur.matieresEnseignees.slice(0, 2).map((matiere) => (
                              <Chip key={matiere.id} size="sm" variant="flat">
                                {matiere.nom}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-sm text-default-400">Aucune</span>
                          )}
                          {professeur.matieresEnseignees && professeur.matieresEnseignees.length > 2 && (
                            <Chip size="sm" variant="flat">
                              +{professeur.matieresEnseignees.length - 2}
                            </Chip>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Actions">
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="w-4 h-4" />}
                              onPress={() => {
                                setEditingProfesseur(professeur);
                                onOpen();
                              }}
                            >
                              Modifier
                            </DropdownItem>
                            <DropdownItem
                              key="assign"
                              startContent={<BookOpen className="w-4 h-4" />}
                            >
                              Assigner matières
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => {
                                setProfesseurToDelete(professeur);
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
              size="sm"
              variant="flat"
              isDisabled={filters.page === 1}
              onPress={() => setFilters({ page: 1 })}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              isDisabled={filters.page === 1}
              onPress={() => setFilters({ page: filters.page - 1 })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-3">
              {filters.page} / {totalPages}
            </span>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              isDisabled={filters.page === totalPages}
              onPress={() => setFilters({ page: filters.page + 1 })}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              isDisabled={filters.page === totalPages}
              onPress={() => setFilters({ page: totalPages })}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal Create/Edit */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {editingProfesseur ? "Modifier le professeur" : "Nouveau professeur"}
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
              {editingProfesseur ? "Enregistrer" : "Créer"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        onConfirm={handleDelete}
        title="Supprimer le professeur"
        message={`Êtes-vous sûr de vouloir supprimer le professeur "${professeurToDelete?.name}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  );
}

