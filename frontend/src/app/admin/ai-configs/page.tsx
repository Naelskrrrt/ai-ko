"use client";

import type { AIModelConfig } from "@/shared/types/admin.types";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
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
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Play,
  RefreshCw,
} from "lucide-react";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { adminService } from "@/shared/services/api/admin.service";
import { useToast } from "@/hooks/use-toast";

export default function AIConfigsPage() {
  const { toast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();

  const [configs, setConfigs] = React.useState<AIModelConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingConfig, setEditingConfig] = React.useState<AIModelConfig | null>(null);
  const [configToDelete, setConfigToDelete] = React.useState<AIModelConfig | null>(null);

  React.useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAIConfigs();

      setConfigs(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors du chargement des configurations",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      await adminService.setDefaultAIConfig(configId);
      toast({
        title: "Succès",
        description: "Configuration définie par défaut",
        variant: "success",
      });
      fetchConfigs();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de la définition de la configuration par défaut",
        variant: "error",
      });
    }
  };

  const handleApply = async (configId: string) => {
    try {
      await adminService.applyAIConfig(configId);
      toast({
        title: "Succès",
        description: "Configuration appliquée avec succès",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de l'application de la configuration",
        variant: "error",
      });
    }
  };

  const handleInitDefaults = async () => {
    try {
      const response = await adminService.initDefaultAIConfigs();

      toast({
        title: "Succès",
        description: `${response.configs.length} configurations initialisées`,
        variant: "success",
      });
      fetchConfigs();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de l'initialisation des configurations",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      await adminService.deleteAIConfig(configToDelete.id);
      toast({
        title: "Succès",
        description: "Configuration supprimée avec succès",
        variant: "success",
      });
      onDeleteConfirmClose();
      fetchConfigs();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de la suppression de la configuration",
        variant: "error",
      });
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "huggingface":
        return "primary";
      case "openai":
        return "success";
      case "anthropic":
        return "secondary";
      case "local":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold">Configurations IA</h1>
          <p className="text-default-500">
            Gérer les modèles IA utilisés pour la génération de QCM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={handleInitDefaults}
          >
            Initialiser configs par défaut
          </Button>
          <Button
            className="bg-theme-primary text-white hover:bg-theme-primary/90"
            startContent={<Plus className="w-4 h-4" />}
            onPress={onOpen}
          >
            Nouvelle configuration
          </Button>
        </div>
      </div>

      {/* Grid de cartes */}
      {configs.length === 0 ? (
        <Card>
          <CardBody className="p-12 text-center">
            <p className="text-default-500 mb-4">
              Aucune configuration disponible
            </p>
            <Button
              color="primary"
              variant="flat"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={handleInitDefaults}
            >
              Initialiser les configurations par défaut
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card
              key={config.id}
              className={`${
                config.estDefaut ? "border-2 border-theme-primary" : ""
              }`}
            >
              <CardHeader className="flex justify-between items-start pb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {config.nom}
                    {config.estDefaut && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </h3>
                  <Chip
                    size="sm"
                    color={getProviderColor(config.provider)}
                    variant="flat"
                    className="mt-1"
                  >
                    {config.provider}
                  </Chip>
                </div>
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
                        setEditingConfig(config);
                        onOpen();
                      }}
                    >
                      Modifier
                    </DropdownItem>
                    {!config.estDefaut ? (
                      <DropdownItem
                        key="set-default"
                        startContent={<Star className="w-4 h-4" />}
                        onPress={() => handleSetDefault(config.id)}
                      >
                        Définir par défaut
                      </DropdownItem>
                    ) : null}
                    <DropdownItem
                      key="apply"
                      startContent={<Play className="w-4 h-4" />}
                      onPress={() => handleApply(config.id)}
                    >
                      Appliquer
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<Trash2 className="w-4 h-4" />}
                      onPress={() => {
                        setConfigToDelete(config);
                        onDeleteConfirmOpen();
                      }}
                    >
                      Supprimer
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-default-500 mb-1">Model ID</p>
                    <code className="text-xs bg-default-100 px-2 py-1 rounded block overflow-hidden text-ellipsis whitespace-nowrap">
                      {config.modelId}
                    </code>
                  </div>

                  {config.description && (
                    <div>
                      <p className="text-xs text-default-500 mb-1">Description</p>
                      <p className="text-sm line-clamp-2">{config.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-default-500">Max Tokens</p>
                      <p className="text-sm font-medium">{config.maxTokens}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Temperature</p>
                      <p className="text-sm font-medium">{config.temperature}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Top P</p>
                      <p className="text-sm font-medium">{config.topP}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Timeout</p>
                      <p className="text-sm font-medium">{config.timeoutSeconds}s</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-default-200">
                    <span className="text-xs text-default-500">Statut</span>
                    <Switch
                      size="sm"
                      isSelected={config.actif}
                      aria-label="Activer/Désactiver"
                    />
                  </div>

                  {config.estDefaut && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Configuration par défaut
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {editingConfig ? "Modifier la configuration" : "Nouvelle configuration"}
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
              {editingConfig ? "Enregistrer" : "Créer"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        onConfirm={handleDelete}
        title="Supprimer la configuration"
        message={`Êtes-vous sûr de vouloir supprimer la configuration "${configToDelete?.nom}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  );
}

