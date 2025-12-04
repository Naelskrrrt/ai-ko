"use client";

import type { User, UserUpdate } from "@/shared/types/admin.types";
import type { Niveau } from "@/shared/types/niveau.types";
import type { Matiere } from "@/shared/types/matiere.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
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
import { useForm, Controller } from "react-hook-form";
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
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Switch } from "@heroui/switch";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { useUsers } from "@/shared/hooks/useUsers";
import { adminService } from "@/shared/services/api/admin.service";
import { niveauService } from "@/shared/services/api/niveau.service";
import { matiereService } from "@/shared/services/api/matiere.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/core/providers/AuthProvider";
import { RoleChangeMenu } from "@/components/admin/RoleChangeMenu";

/**
 * Parse les erreurs retournées par le backend Flask/Marshmallow
 * et retourne un message lisible pour l'utilisateur
 */
function parseBackendErrors(error: any): string {
  const data = error?.response?.data;

  if (!data) {
    return "Une erreur de connexion est survenue. Vérifiez votre réseau.";
  }

  // Cas 1: Message simple
  if (typeof data.message === "string") {
    return data.message;
  }

  // Cas 2: Erreurs de validation Marshmallow (objet avec champs)
  if (data.errors && typeof data.errors === "object") {
    const errorMessages: string[] = [];

    for (const [, messages] of Object.entries(data.errors)) {
      if (Array.isArray(messages)) {
        // Messages déjà formatés avec le nom du champ
        errorMessages.push(...messages);
      } else if (typeof messages === "string") {
        errorMessages.push(messages);
      } else if (typeof messages === "object" && messages !== null) {
        // Cas imbriqué (ex: { _schema: ["message"] })
        for (const subMessages of Object.values(messages)) {
          if (Array.isArray(subMessages)) {
            errorMessages.push(...(subMessages as string[]));
          }
        }
      }
    }

    if (errorMessages.length > 0) {
      // Retourner les erreurs séparées par des retours à la ligne
      return errorMessages.join("\n");
    }
  }

  // Cas 3: Message dans un tableau
  if (Array.isArray(data.message)) {
    return data.message.join("\n");
  }

  // Cas 4: Erreur générique avec status
  if (data.error) {
    return typeof data.error === "string"
      ? data.error
      : "Une erreur est survenue";
  }

  return "Une erreur inattendue est survenue";
}

// Schema de validation
const userSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nom : doit contenir au moins 2 caractères")
      .max(100, "Nom : ne peut pas dépasser 100 caractères"),
    email: z.string().email("Email : format invalide (ex: nom@domaine.com)"),
    role: z.enum(["admin", "enseignant", "etudiant"], {
      required_error: "Rôle : veuillez sélectionner un rôle",
    }),
    password: z.string().optional(),
    emailVerified: z.boolean().optional(),
    // Champs communs
    telephone: z.string().optional(),
    adresse: z.string().optional(),
    // Champs spécifiques étudiant
    numeroEtudiant: z.string().optional(),
    dateNaissance: z.string().optional(),
    anneeAdmission: z.string().optional(),
    niveauId: z.string().optional(),
    mentionId: z.string().optional(),
    parcoursId: z.string().optional(),
    // Champs spécifiques enseignant
    numeroEnseignant: z.string().optional(),
    grade: z.string().optional(),
    specialite: z.string().optional(),
    departement: z.string().optional(),
    bureau: z.string().optional(),
    dateEmbauche: z.string().optional(),
    matiereIds: z.array(z.string()).optional(),
    niveauIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // Validation conditionnelle pour les étudiants
    if (data.role === "etudiant" && (!data.niveauId || data.niveauId === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Niveau : obligatoire pour un étudiant",
        path: ["niveauId"],
      });
    }
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
  const [niveaux, setNiveaux] = React.useState<Niveau[]>([]);
  const [matieres, setMatieres] = React.useState<Matiere[]>([]);
  const [loadingReferentiels, setLoadingReferentiels] = React.useState(false);

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
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  // Surveiller le rôle sélectionné pour afficher le bloc conditionnel
  const selectedRole = watch("role");

  // Charger les référentiels (niveaux et matières) à l'ouverture du modal
  React.useEffect(() => {
    const loadReferentiels = async () => {
      if (
        isOpen &&
        (selectedRole === "etudiant" || selectedRole === "enseignant")
      ) {
        setLoadingReferentiels(true);
        try {
          const [niveauxData, matieresData] = await Promise.all([
            niveauService.getNiveaux(true),
            matiereService.getMatieres(true),
          ]);

          setNiveaux(niveauxData);
          setMatieres(matieresData);
        } catch (error) {
          console.error("Erreur chargement référentiels:", error);
        } finally {
          setLoadingReferentiels(false);
        }
      }
    };

    loadReferentiels();
  }, [isOpen, selectedRole]);

  const openCreateModal = () => {
    setEditingUser(null);
    setIsPasswordVisible(false);
    reset({
      name: "",
      email: "",
      role: "etudiant",
      password: "",
      emailVerified: true,
      // Champs communs
      telephone: "",
      adresse: "",
      // Champs étudiant
      numeroEtudiant: "",
      dateNaissance: "",
      anneeAdmission: "",
      niveauId: "",
      mentionId: "",
      parcoursId: "",
      // Champs enseignant
      numeroEnseignant: "",
      grade: "",
      specialite: "",
      departement: "",
      bureau: "",
      dateEmbauche: "",
      matiereIds: [],
      niveauIds: [],
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

        // Utiliser le bon endpoint selon le rôle
        if (data.role === "etudiant") {
          // Créer un étudiant avec les infos académiques
          await adminService.createEtudiant({
            name: data.name,
            email: data.email,
            password: data.password,
            numeroEtudiant: data.numeroEtudiant || undefined,
            telephone: data.telephone || undefined,
            dateNaissance: data.dateNaissance || undefined,
            niveauIds: data.niveauId ? [data.niveauId] : undefined,
            anneeScolaire: data.anneeAdmission || undefined,
          });
        } else if (data.role === "enseignant") {
          // Créer un enseignant avec les infos professionnelles
          await adminService.createProfesseur({
            name: data.name,
            email: data.email,
            password: data.password,
            numeroEnseignant: data.numeroEnseignant || undefined,
            telephone: data.telephone || undefined,
            matiereIds:
              data.matiereIds && data.matiereIds.length > 0
                ? data.matiereIds
                : undefined,
            niveauIds:
              data.niveauIds && data.niveauIds.length > 0
                ? data.niveauIds
                : undefined,
          });
        } else {
          // Créer un admin (utilisateur standard)
          await adminService.createUser({
            name: data.name,
            email: data.email,
            role: data.role,
            password: data.password,
            emailVerified: data.emailVerified,
          });
        }

        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
          variant: "success",
        });
      }
      mutate();
      onClose();
    } catch (error: any) {
      const errorMessage = parseBackendErrors(error);

      toast({
        title: "Erreur de validation",
        description: errorMessage,
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
      const errorMessage = parseBackendErrors(error);

      toast({
        title: "Erreur de suppression",
        description: errorMessage,
        variant: "error",
      });
    }
  };

  const handleToggleStatus = async (user: User) => {
    console.log(
      "[TOGGLE] Début - User:",
      user.id,
      user.email,
      "isActive:",
      user.isActive,
    );

    if (isCurrentUser(user)) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas modifier votre propre statut",
        variant: "error",
      });

      return;
    }

    setTogglingStatus(user.id);

    try {
      console.log("[TOGGLE] Appel API...");
      const result = await adminService.toggleUserStatus(user.id);

      console.log("[TOGGLE] Résultat API:", result);

      const statusText = result.isActive ? "activé" : "désactivé";

      // Rafraîchir les données
      mutate();

      toast({
        title: "Succès",
        description: `${user.name} a été ${statusText}`,
        variant: "success",
      });
    } catch (error: any) {
      console.error("[TOGGLE] Erreur:", error);
      const errorMessage = parseBackendErrors(error);

      toast({
        title: "Erreur de changement de statut",
        description: errorMessage,
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
      const errorMessage = parseBackendErrors(error);

      toast({
        title: "Erreur de changement de rôle",
        description: errorMessage,
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
                              isSelected={user.isActive}
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
      <Modal
        classNames={{
          base:
            selectedRole === "etudiant" || selectedRole === "enseignant"
              ? "max-h-[90vh]"
              : "",
          body: "py-6",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size={
          selectedRole === "etudiant" || selectedRole === "enseignant"
            ? "5xl"
            : "2xl"
        }
        onClose={onClose}
      >
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {editingUser ? "Éditer l'utilisateur" : "Créer un utilisateur"}
            </ModalHeader>
            <ModalBody>
              <div
                className={`grid gap-8 ${selectedRole === "etudiant" || selectedRole === "enseignant" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
              >
                {/* Colonne gauche - Informations générales */}
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

                {/* Colonne droite - Informations académiques (conditionnelle) */}
                {selectedRole === "etudiant" && (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                          Informations Étudiant
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                          Données académiques complémentaires
                        </p>
                      </div>
                    </div>

                    <Divider className="bg-blue-200 dark:bg-blue-700" />

                    <Input
                      {...register("numeroEtudiant")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Numéro étudiant *"
                      placeholder="Ex: ETU-2024-001"
                      variant="bordered"
                    />

                    <Input
                      {...register("telephone")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Téléphone"
                      placeholder="Ex: +261 34 00 000 00"
                      variant="bordered"
                    />

                    <Controller
                      control={control}
                      name="dateNaissance"
                      render={({ field }) => (
                        <DatePicker
                          showMonthAndYearPickers
                          classNames={{
                            base: "w-full",
                          }}
                          label="Date de naissance"
                          value={field.value ? parseDate(field.value) : null}
                          onChange={(date) => {
                            field.onChange(date ? date.toString() : "");
                          }}
                        />
                      )}
                    />

                    <Input
                      {...register("anneeAdmission")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Année d'admission"
                      placeholder="Ex: 2024-2025"
                      variant="bordered"
                    />

                    <Input
                      {...register("adresse")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Adresse"
                      placeholder="Adresse complète"
                      variant="bordered"
                    />

                    <Controller
                      control={control}
                      name="niveauId"
                      render={({ field }) => (
                        <Select
                          isRequired
                          classNames={{
                            trigger: "bg-white dark:bg-default-100",
                          }}
                          errorMessage={errors.niveauId?.message}
                          isInvalid={!!errors.niveauId}
                          isLoading={loadingReferentiels}
                          label="Niveau *"
                          placeholder="Sélectionner un niveau"
                          selectedKeys={
                            field.value ? new Set([field.value]) : new Set()
                          }
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string;

                            field.onChange(selectedKey || "");
                          }}
                        >
                          {niveaux.map((niveau) => (
                            <SelectItem key={niveau.id}>
                              {niveau.nom} ({niveau.code})
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                  </div>
                )}

                {selectedRole === "enseignant" && (
                  <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                        <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                          Informations Enseignant
                        </h3>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          Données professionnelles complémentaires
                        </p>
                      </div>
                    </div>

                    <Divider className="bg-green-200 dark:bg-green-700" />

                    <Input
                      {...register("numeroEnseignant")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Numéro enseignant *"
                      placeholder="Ex: ENS-2024-001"
                      variant="bordered"
                    />

                    <Input
                      {...register("telephone")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Téléphone"
                      placeholder="Ex: +261 34 00 000 00"
                      variant="bordered"
                    />

                    <Input
                      {...register("grade")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Grade"
                      placeholder="Ex: Maître de conférence, Professeur..."
                      variant="bordered"
                    />

                    <Input
                      {...register("specialite")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Spécialité"
                      placeholder="Ex: Intelligence Artificielle"
                      variant="bordered"
                    />

                    <Input
                      {...register("departement")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Département"
                      placeholder="Ex: Informatique"
                      variant="bordered"
                    />

                    <Input
                      {...register("bureau")}
                      classNames={{
                        inputWrapper: "bg-white dark:bg-default-100",
                      }}
                      label="Bureau"
                      placeholder="Ex: B-204"
                      variant="bordered"
                    />

                    <Controller
                      control={control}
                      name="dateEmbauche"
                      render={({ field }) => (
                        <DatePicker
                          showMonthAndYearPickers
                          classNames={{
                            base: "w-full",
                          }}
                          label="Date d'embauche"
                          value={field.value ? parseDate(field.value) : null}
                          onChange={(date) => {
                            field.onChange(date ? date.toString() : "");
                          }}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="matiereIds"
                      render={({ field }) => (
                        <Select
                          {...field}
                          classNames={{
                            trigger: "bg-white dark:bg-default-100",
                          }}
                          isLoading={loadingReferentiels}
                          label="Matières enseignées"
                          placeholder="Sélectionner les matières"
                          selectedKeys={new Set(field.value || [])}
                          selectionMode="multiple"
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const selectedKeys = Array.from(keys) as string[];

                            field.onChange(selectedKeys);
                          }}
                        >
                          {matieres.map((matiere) => (
                            <SelectItem key={matiere.id}>
                              {matiere.nom} ({matiere.code})
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />

                    {/* Afficher les matières sélectionnées */}
                    {watch("matiereIds") && watch("matiereIds")!.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {watch("matiereIds")!.map((matiereId) => {
                          const matiere = matieres.find(
                            (m) => m.id === matiereId,
                          );

                          return matiere ? (
                            <Chip
                              key={matiereId}
                              color="success"
                              size="sm"
                              variant="flat"
                            >
                              {matiere.nom}
                            </Chip>
                          ) : null;
                        })}
                      </div>
                    )}

                    <Controller
                      control={control}
                      name="niveauIds"
                      render={({ field }) => (
                        <Select
                          {...field}
                          classNames={{
                            trigger: "bg-white dark:bg-default-100",
                          }}
                          isLoading={loadingReferentiels}
                          label="Niveaux enseignés"
                          placeholder="Sélectionner les niveaux"
                          selectedKeys={new Set(field.value || [])}
                          selectionMode="multiple"
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const selectedKeys = Array.from(keys) as string[];

                            field.onChange(selectedKeys);
                          }}
                        >
                          {niveaux.map((niveau) => (
                            <SelectItem key={niveau.id}>
                              {niveau.nom} ({niveau.code})
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />

                    {/* Afficher les niveaux sélectionnés */}
                    {watch("niveauIds") && watch("niveauIds")!.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {watch("niveauIds")!.map((niveauId) => {
                          const niveau = niveaux.find((n) => n.id === niveauId);

                          return niveau ? (
                            <Chip
                              key={niveauId}
                              color="primary"
                              size="sm"
                              variant="flat"
                            >
                              {niveau.nom}
                            </Chip>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
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
