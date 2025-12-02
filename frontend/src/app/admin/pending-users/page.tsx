"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Tooltip } from "@heroui/tooltip";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { adminService } from "@/shared/services/api/admin.service";
import { useSocket } from "@/core/hooks/useSocket";

interface PendingUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  numeroEtudiant?: string;
  numeroEnseignant?: string;
  user?: {
    isActive?: boolean;
    name?: string;
    email?: string;
  };
  pendingSince: string;
  hasNotification: boolean;
}

export default function PendingUsersPage() {
  const {
    isOpen: isActivateModalOpen,
    onOpen: onActivateModalOpen,
    onClose: onActivateModalClose,
  } = useDisclosure();
  const {
    isOpen: isRejectModalOpen,
    onOpen: onRejectModalOpen,
    onClose: onRejectModalClose,
  } = useDisclosure();

  const [users, setUsers] = useState<PendingUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [rejectReason, setRejectReason] = useState("");

  // Charger les utilisateurs en attente
  const loadPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getPendingUsers(
        roleFilter === "all" ? undefined : roleFilter,
      );

      setUsers(response.users);
      setFilteredUsers(response.users);
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs en attente");
    } finally {
      setIsLoading(false);
    }
  };

  // Configuration du WebSocket pour recevoir les nouvelles demandes
  useSocket({
    onPendingUser: () => {
      toast.info("Nouvel utilisateur en attente de validation", {
        action: {
          label: "Actualiser",
          onClick: () => loadPendingUsers(),
        },
      });
      // Recharger automatiquement après 2 secondes
      setTimeout(() => loadPendingUsers(), 2000);
    },
  });

  // Effet pour charger les données initiales
  useEffect(() => {
    loadPendingUsers();
  }, [roleFilter]);

  // Filtrage des utilisateurs
  useEffect(() => {
    let filtered = users;

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.numeroEtudiant?.includes(searchTerm) ||
          user.numeroEnseignant?.includes(searchTerm),
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  // Gestionnaire d'activation
  const handleActivateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsActionLoading(true);
      await adminService.activateUser(selectedUser.id);

      toast.success(`Utilisateur ${selectedUser.name} activé avec succès`);
      onActivateModalClose();
      setSelectedUser(null);

      // Recharger la liste
      await loadPendingUsers();
    } catch {
      toast.error("Erreur lors de l'activation de l'utilisateur");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Gestionnaire de rejet
  const handleRejectUser = async () => {
    if (!selectedUser || !rejectReason.trim()) {
      toast.error("Veuillez saisir une raison pour le rejet");

      return;
    }

    try {
      setIsActionLoading(true);
      await adminService.rejectUser(selectedUser.id, rejectReason);

      toast.success(`Utilisateur ${selectedUser.name} rejeté`);
      onRejectModalClose();
      setSelectedUser(null);
      setRejectReason("");

      // Recharger la liste
      await loadPendingUsers();
    } catch {
      toast.error("Erreur lors du rejet de l'utilisateur");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Ouvrir la modal d'activation
  const openActivateModal = (user: PendingUser) => {
    setSelectedUser(user);
    onActivateModalOpen();
  };

  // Ouvrir la modal de rejet
  const openRejectModal = (user: PendingUser) => {
    setSelectedUser(user);
    onRejectModalOpen();
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Calculer le temps d'attente
  const getWaitingTime = (pendingSince: string) => {
    try {
      const pendingDate = new Date(pendingSince);
      const now = new Date();
      const diffMs = now.getTime() - pendingDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );

      if (diffDays > 0) {
        return `${diffDays}j ${diffHours}h`;
      } else if (diffHours > 0) {
        return `${diffHours}h`;
      } else {
        return "< 1h";
      }
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs en attente</h1>
          <p className="text-default-600">
            Gérez les nouveaux inscrits nécessitant une validation
          </p>
        </div>
        <Button
          color="primary"
          isLoading={isLoading}
          startContent={<RefreshCw className="w-4 h-4" />}
          variant="flat"
          onClick={loadPendingUsers}
        >
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 py-6">
            <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7 text-warning" />
            </div>
            <div className="flex flex-col">
              <p className="text-3xl font-bold text-default-900">
                {filteredUsers.length}
              </p>
              <p className="text-sm text-default-500 mt-1">En attente</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 py-6">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="text-3xl font-bold text-default-900">
                {filteredUsers.filter((u) => u.role === "etudiant").length}
              </p>
              <p className="text-sm text-default-500 mt-1">Étudiants</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 py-6">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-secondary" />
            </div>
            <div className="flex flex-col">
              <p className="text-3xl font-bold text-default-900">
                {filteredUsers.filter((u) => u.role === "enseignant").length}
              </p>
              <p className="text-sm text-default-500 mt-1">Enseignants</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              className="flex-1"
              placeholder="Rechercher par nom, email ou numéro..."
              startContent={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              className="w-full sm:w-48"
              placeholder="Filtrer par rôle"
              startContent={<Filter className="w-4 h-4" />}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <SelectItem key="all">Tous les rôles</SelectItem>
              <SelectItem key="etudiant">Étudiants</SelectItem>
              <SelectItem key="enseignant">Enseignants</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Table des utilisateurs */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Utilisateurs en attente de validation
          </h3>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-default-400 mx-auto mb-4" />
              <p className="text-default-500">
                Aucun utilisateur en attente de validation
              </p>
            </div>
          ) : (
            <Table aria-label="Utilisateurs en attente">
              <TableHeader>
                <TableColumn>UTILISATEUR</TableColumn>
                <TableColumn>RÔLE</TableColumn>
                <TableColumn>DATE D'INSCRIPTION</TableColumn>
                <TableColumn>TEMPS D'ATTENTE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-default-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-default-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                          {user.numeroEtudiant && (
                            <p className="text-xs text-default-400">
                              Étudiant: {user.numeroEtudiant}
                            </p>
                          )}
                          {user.numeroEnseignant && (
                            <p className="text-xs text-default-400">
                              Enseignant: {user.numeroEnseignant}
                            </p>
                          )}
                        </div>
                        {user.hasNotification && (
                          <Chip color="warning" size="sm" variant="dot">
                            Nouveau
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          user.role === "etudiant" ? "primary" : "secondary"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {user.role === "etudiant" ? "Étudiant" : "Enseignant"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.pendingSince)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          getWaitingTime(user.pendingSince).includes("j")
                            ? "warning"
                            : "default"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {getWaitingTime(user.pendingSince)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Tooltip content="Valider l'utilisateur">
                          <Button
                            color="success"
                            size="sm"
                            startContent={<CheckCircle className="w-4 h-4" />}
                            variant="flat"
                            onClick={() => openActivateModal(user)}
                          >
                            Valider
                          </Button>
                        </Tooltip>
                        <Tooltip content="Rejeter l'utilisateur">
                          <Button
                            color="danger"
                            size="sm"
                            startContent={<XCircle className="w-4 h-4" />}
                            variant="flat"
                            onClick={() => openRejectModal(user)}
                          >
                            Rejeter
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal d'activation */}
      <Modal isOpen={isActivateModalOpen} onClose={onActivateModalClose}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">Confirmer l'activation</h3>
          </ModalHeader>
          <ModalBody>
            {selectedUser && (
              <div className="space-y-4">
                <p>
                  Êtes-vous sûr de vouloir activer le compte de{" "}
                  <strong>{selectedUser.name}</strong> ?
                </p>
                <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-sm text-success">
                    L'utilisateur pourra se connecter et accéder à toutes les
                    fonctionnalités de son rôle.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onActivateModalClose}>
              Annuler
            </Button>
            <Button
              color="success"
              isLoading={isActionLoading}
              onClick={handleActivateUser}
            >
              Activer le compte
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de rejet */}
      <Modal isOpen={isRejectModalOpen} onClose={onRejectModalClose}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">Rejeter l'utilisateur</h3>
          </ModalHeader>
          <ModalBody>
            {selectedUser && (
              <div className="space-y-4">
                <p>
                  Êtes-vous sûr de vouloir rejeter l'inscription de{" "}
                  <strong>{selectedUser.name}</strong> ?
                </p>
                <div className="p-3 bg-danger/10 rounded-lg border border-danger/20">
                  <p className="text-sm text-danger">
                    Cette action supprimera définitivement le compte
                    utilisateur.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Raison du rejet <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="w-full p-3 border border-default-200 rounded-lg resize-none"
                    placeholder="Expliquez la raison du rejet..."
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onRejectModalClose}>
              Annuler
            </Button>
            <Button
              color="danger"
              isDisabled={!rejectReason.trim()}
              isLoading={isActionLoading}
              onClick={handleRejectUser}
            >
              Rejeter l'utilisateur
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
