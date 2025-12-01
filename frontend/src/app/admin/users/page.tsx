"use client";

import type { User, UserUpdate } from "@/shared/types/admin.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  EyeOff,
} from "lucide-react";
import { Switch } from "@heroui/switch";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { useUsers } from "@/shared/hooks/useUsers";
import { adminService } from "@/shared/services/api/admin.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/core/providers/AuthProvider";
import { RoleChangeMenu } from "@/components/admin/RoleChangeMenu";

// Schema de validation
const userSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  email: z.string().email("Email invalide"),
  role: z.enum(["admin", "enseignant", "etudiant"], {
    required_error: "Le rôle est requis",
  }),
  password: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [roleChangeUser, setRoleChangeUser] = React.useState<User | null>(null);
  const [togglingStatus, setTogglingStatus] = React.useState<string | null>(
    null,
  );
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  // État dans l'URL avec nuqs
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    per_page: parseAsInteger.withDefault(10),
    role: parseAsString,
    search: parseAsString,
    active: parseAsString,
    sort_by: parseAsString.withDefault("created_at"),
    sort_order: parseAsString.withDefault("desc"),
  });

  // Fetch users avec SWR
  const { users, pagination, isLoading, mutate } = useUsers({
    page: filters.page,
    per_page: filters.per_page,
    role: filters.role || undefined,
    search: filters.search || undefined,
    active: filters.active ? filters.active === "true" : undefined,
    sort_by: filters.sort_by as any,
    sort_order: filters.sort_order as any,
  });

  // Formulaire
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setIsPasswordVisible(false);
    reset({
      name: "",
      email: "",
      role: "etudiant",
      password: "",
      emailVerified: true,
    });
    onOpen();
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsPasswordVisible(false);
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      emailVerified: user.emailVerified,
    });
    onOpen();
  };

  const onSubmit = async (data: UserFormValues) => {
    try {
      if (editingUser) {
        // Mise à jour
        const updateData: UserUpdate = {
          name: data.name,
          email: data.email,
          password: data.password || undefined,
          emailVerified: data.emailVerified,
        };

        // Supprimer password si vide
        if (!updateData.password) {
          delete updateData.password;
        }

        await adminService.updateUser(editingUser.id, updateData);

        // Si le rôle a changé, utiliser l'endpoint séparé
        if (data.role !== editingUser.role) {
          await adminService.changeUserRole(editingUser.id, data.role);
        }

        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
          variant: "success",
        });
      } else {
        // Création
        if (!data.password) {
          toast({
            title: "Erreur",
            description: "Le mot de passe est requis pour la création",
            variant: "error",
          });

          return;
        }
        await adminService.createUser({
          name: data.name,
          email: data.email,
          role: data.role,
          password: data.password,
          emailVerified: data.emailVerified,
        });
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
          variant: "success",
        });
      }
      mutate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "error",
      });
    }
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    onDeleteConfirmOpen();
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminService.deleteUser(userToDelete.id);
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
        variant: "success",
      });
      mutate();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "error",
      });
    }
  };

  const handleToggleStatus = async (user: User) => {
    // eslint-disable-next-line no-console
    console.log("🔄 Toggle status clicked for user:", user.name, user.id);

    if (isCurrentUser(user)) {
      // eslint-disable-next-line no-console
      console.log("❌ Cannot toggle own status");
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas modifier votre propre statut",
        variant: "error",
      });

      return;
    }

    // Sauvegarder l'ancien statut pour le message (non utilisé actuellement)
    const userName = user.name;

    setTogglingStatus(user.id);

    // eslint-disable-next-line no-console
    console.log("⏳ Sending request to toggle status...");

    try {
      const result = await adminService.toggleUserStatus(user.id);

      // eslint-disable-next-line no-console
      console.log("✅ Toggle status response:", result);

      // Utiliser le nouveau statut depuis la réponse
      const newStatus = result.emailVerified;
      const statusText = newStatus ? "activé" : "désactivé";

      // Rafraîchir les données
      mutate();

      // Feedback visuel amélioré
      toast({
        title: "✅ Statut modifié",
        description: `${userName} a été ${statusText} avec succès`,
        variant: "success",
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Toggle status error:", error);
      // eslint-disable-next-line no-console
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      toast({
        title: "❌ Erreur",
        description:
          error.response?.data?.message ||
          error.message ||
          "Une erreur est survenue lors du changement de statut",
        variant: "error",
      });
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    try {
      await adminService.changeUserRole(user.id, newRole as any);
      toast({
        title: "Succès",
        description: `Rôle de ${user.name} changé en ${newRole}`,
        variant: "success",
      });
      mutate();
      setRoleChangeUser(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "error",
      });
    }
  };

  // Vérifier si c'est l'utilisateur actuel
  const isCurrentUser = (user: User) => {
    return currentUser && currentUser.id === user.id;
  };

  // Formater la date de manière relative (comme moment.js)
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);

      return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);

      return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);

      return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
    }
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);

      return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
    }
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);

      return `Il y a ${months} mois`;
    }
    const years = Math.floor(diffInSeconds / 31536000);

    return `Il y a ${years} an${years > 1 ? "s" : ""}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (
    role: string,
  ): "danger" | "default" | "secondary" | "warning" => {
    switch (role) {
      case "admin":
        return "danger";
      case "enseignant":
        return "default";
      case "etudiant":
        return "secondary";
      default:
        return "warning";
    }
  };

  const handleSort = (field: string) => {
    if (filters.sort_by === field) {
      // Toggle l'ordre
      setFilters({
        sort_order: filters.sort_order === "asc" ? "desc" : "asc",
      });
    } else {
      // Nouveau champ
      setFilters({
        sort_by: field,
        sort_order: "asc",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-default-500">Gérez les utilisateurs du système</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardBody className="flex flex-row gap-4">
          <Input
            placeholder="Rechercher par nom ou email..."
            startContent={<Search className="w-4 h-4" />}
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({ search: e.target.value || null, page: 1 })
            }
          />

          <Button
            className="bg-theme-primary text-white hover:bg-theme-primary/90"
            startContent={<Plus className="w-4 h-4" />}
            onPress={openCreateModal}
          >
            Nouveau utilisateur
          </Button>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Rôle"
              placeholder="Tous les rôles"
              selectedKeys={filters.role ? [filters.role] : []}
              onChange={(e) =>
                setFilters({ role: e.target.value || null, page: 1 })
              }
            >
              <SelectItem key="admin">Admin</SelectItem>
              <SelectItem key="enseignant">Enseignant</SelectItem>
              <SelectItem key="etudiant">Étudiant</SelectItem>
            </Select>

            <Select
              label="Status"
              placeholder="Tous les status"
              selectedKeys={filters.active ? [filters.active] : []}
              onChange={(e) =>
                setFilters({ active: e.target.value || null, page: 1 })
              }
            >
              <SelectItem key="true">Actif</SelectItem>
              <SelectItem key="false">Inactif</SelectItem>
            </Select>

            <Select
              label="Par page"
              selectedKeys={[filters.per_page.toString()]}
              onChange={(e) =>
                setFilters({ per_page: parseInt(e.target.value), page: 1 })
              }
            >
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="25">25</SelectItem>
              <SelectItem key="50">50</SelectItem>
              <SelectItem key="100">100</SelectItem>
            </Select>
          </div>
          <div className="flex-1 rounded-lg border  border-slate-50">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-default-500">Chargement...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-default-500">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-default-100">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center gap-1 hover:text-theme-primary"
                          onClick={() => handleSort("name")}
                        >
                          Utilisateur
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center gap-1 hover:text-theme-primary"
                          onClick={() => handleSort("role")}
                        >
                          Rôle
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center gap-1 hover:text-theme-primary"
                          onClick={() => handleSort("created_at")}
                        >
                          Date création
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-t border-divider hover:bg-default-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-sm font-semibold text-theme-primary">
                              {getInitials(user.name)}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-default-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Chip color={getRoleColor(user.role)} size="sm">
                            {user.role}
                          </Chip>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              aria-label={
                                user.emailVerified
                                  ? "Désactiver l'utilisateur"
                                  : "Activer l'utilisateur"
                              }
                              className={
                                togglingStatus === user.id ? "opacity-50" : ""
                              }
                              color="success"
                              isDisabled={
                                isCurrentUser(user) ||
                                togglingStatus === user.id
                              }
                              isSelected={user.emailVerified}
                              size="sm"
                              onValueChange={() => handleToggleStatus(user)}
                            />
                            {togglingStatus === user.id && (
                              <span className="text-xs text-default-500 animate-pulse">
                                En cours...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-default-600">
                          <span
                            title={new Date(user.createdAt).toLocaleString(
                              "fr-FR",
                            )}
                          >
                            {formatRelativeDate(user.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 relative">
                            {isCurrentUser(user) ? (
                              <Button
                                isDisabled
                                isIconOnly
                                size="sm"
                                title="Vous ne pouvez pas modifier votre propre compte"
                                variant="light"
                              >
                                <MoreVertical className="w-4 h-4 text-default-300" />
                              </Button>
                            ) : (
                              <>
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu aria-label="Actions">
                                    <DropdownItem
                                      key="edit"
                                      startContent={
                                        <Edit className="w-4 h-4" />
                                      }
                                      onPress={() => openEditModal(user)}
                                    >
                                      Éditer
                                    </DropdownItem>
                                    <DropdownItem
                                      key="role"
                                      startContent={
                                        <UserCog className="w-4 h-4" />
                                      }
                                      onPress={() => setRoleChangeUser(user)}
                                    >
                                      Changer rôle
                                    </DropdownItem>
                                    <DropdownItem
                                      key="delete"
                                      className="text-danger"
                                      color="danger"
                                      startContent={
                                        <Trash2 className="w-4 h-4" />
                                      }
                                      onPress={() => handleDelete(user)}
                                    >
                                      Supprimer
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>

                                {/* Menu de changement de rôle */}
                                <RoleChangeMenu
                                  isOpen={roleChangeUser?.id === user.id}
                                  user={user}
                                  onClose={() => setRoleChangeUser(null)}
                                  onRoleChange={(newRole) =>
                                    handleChangeRole(user, newRole)
                                  }
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-default-500">
            Page {pagination.page} sur {pagination.pages} ({pagination.total}{" "}
            utilisateurs)
          </p>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              isDisabled={pagination.page === 1}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: 1 })}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              isDisabled={pagination.page === 1}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: pagination.page - 1 })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              isDisabled={pagination.page === pagination.pages}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: pagination.page + 1 })}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              isDisabled={pagination.page === pagination.pages}
              size="sm"
              variant="flat"
              onPress={() => setFilters({ page: pagination.pages })}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal Création/Édition */}
      <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {editingUser ? "Éditer l'utilisateur" : "Créer un utilisateur"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  {...register("name")}
                  errorMessage={errors.name?.message}
                  isInvalid={!!errors.name}
                  label="Nom"
                  placeholder="Nom complet"
                  variant="bordered"
                />

                <Input
                  {...register("email")}
                  errorMessage={errors.email?.message}
                  isInvalid={!!errors.email}
                  label="Email"
                  placeholder="email@exemple.com"
                  type="email"
                  variant="bordered"
                />

                <Select
                  {...register("role")}
                  defaultSelectedKeys={["etudiant"]}
                  errorMessage={errors.role?.message}
                  isInvalid={!!errors.role}
                  label="Rôle"
                  variant="bordered"
                >
                  <SelectItem key="admin">Admin</SelectItem>
                  <SelectItem key="enseignant">Enseignant</SelectItem>
                  <SelectItem key="etudiant">Étudiant</SelectItem>
                </Select>

                <Input
                  {...register("password")}
                  endContent={
                    <button
                      aria-label={
                        isPasswordVisible
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="w-4 h-4 text-default-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-default-400" />
                      )}
                    </button>
                  }
                  errorMessage={errors.password?.message}
                  isInvalid={!!errors.password}
                  label="Mot de passe"
                  placeholder={
                    editingUser
                      ? "Laisser vide pour ne pas changer"
                      : "Minimum 8 caractères"
                  }
                  type={isPasswordVisible ? "text" : "password"}
                  variant="bordered"
                />

                <div className="flex items-center gap-2">
                  <input
                    {...register("emailVerified")}
                    className="w-4 h-4"
                    id="emailVerified"
                    type="checkbox"
                  />
                  <label className="text-sm" htmlFor="emailVerified">
                    Compte actif
                  </label>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Annuler
              </Button>
              <Button
                className="bg-theme-primary text-white hover:bg-theme-primary/90"
                isLoading={isSubmitting}
                type="submit"
              >
                {editingUser ? "Mettre à jour" : "Créer"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        cancelLabel="Annuler"
        confirmColor="danger"
        confirmLabel="Supprimer"
        isOpen={isDeleteConfirmOpen}
        message={
          userToDelete
            ? `Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete.name} ?`
            : "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
        }
        title="Supprimer l'utilisateur"
        variant="danger"
        onClose={() => {
          onDeleteConfirmClose();
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
