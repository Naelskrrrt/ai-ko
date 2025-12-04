"use client";

import type { Niveau, NiveauCreate } from "@/shared/types/niveau.types";
import type { Mention, MentionCreate } from "@/shared/types/mention.types";
import type { Parcours, ParcoursCreate } from "@/shared/types/parcours.types";
import type { Matiere, MatiereCreate } from "@/shared/types/matiere.types";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  BookMarked,
  Route,
  BookOpen,
  Loader2,
} from "lucide-react";

import { niveauService } from "@/shared/services/api/niveau.service";
import { mentionService } from "@/shared/services/api/mention.service";
import { parcoursService } from "@/shared/services/api/parcours.service";
import { matiereService } from "@/shared/services/api/matiere.service";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

// Types pour la gestion des entités
type EntityType = "niveau" | "mention" | "parcours" | "matiere";

interface StructureBlockProps<T> {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: T[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  renderChip?: (item: T) => React.ReactNode;
}

// Composant générique pour un bloc de structure
function StructureBlock<T extends { id: string; nom: string; code: string }>({
  title,
  icon,
  color,
  items,
  loading,
  onAdd,
  onEdit,
  onDelete,
  renderItem,
  renderChip,
}: StructureBlockProps<T>) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-default-500">{items.length} éléments</p>
          </div>
        </div>
        <Button
          isIconOnly
          className="bg-theme-primary text-white hover:bg-theme-primary/90"
          size="sm"
          onPress={onAdd}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardBody className="pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-default-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-default-500 text-sm">Aucun élément</p>
            <Button className="mt-2" size="sm" variant="flat" onPress={onAdd}>
              Ajouter le premier
            </Button>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.nom}</span>
                    <Chip size="sm" variant="flat">
                      {item.code}
                    </Chip>
                    {renderChip?.(item)}
                  </div>
                  {renderItem(item)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => onDelete(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function StructurePage() {
  const { toast } = useToast();

  // États pour les données
  const [niveaux, setNiveaux] = React.useState<Niveau[]>([]);
  const [mentions, setMentions] = React.useState<Mention[]>([]);
  const [parcours, setParcours] = React.useState<Parcours[]>([]);
  const [matieres, setMatieres] = React.useState<Matiere[]>([]);

  // États de chargement
  const [loadingNiveaux, setLoadingNiveaux] = React.useState(true);
  const [loadingMentions, setLoadingMentions] = React.useState(true);
  const [loadingParcours, setLoadingParcours] = React.useState(true);
  const [loadingMatieres, setLoadingMatieres] = React.useState(true);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalType, setModalType] = React.useState<EntityType>("niveau");
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Formulaire
  const [formData, setFormData] = React.useState({
    code: "",
    nom: "",
    description: "",
    ordre: 1,
    cycle: "licence",
    mentionId: "",
    coefficient: 1,
    couleur: "",
  });

  // Confirmation de suppression
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteItem, setDeleteItem] = React.useState<{
    type: EntityType;
    item: any;
  } | null>(null);

  // Charger les données au montage
  React.useEffect(() => {
    loadNiveaux();
    loadMentions();
    loadParcours();
    loadMatieres();
  }, []);

  const loadNiveaux = async () => {
    try {
      setLoadingNiveaux(true);
      const data = await niveauService.getNiveaux();

      setNiveaux(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les niveaux",
        variant: "error",
      });
    } finally {
      setLoadingNiveaux(false);
    }
  };

  const loadMentions = async () => {
    try {
      setLoadingMentions(true);
      const data = await mentionService.getMentions();

      setMentions(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les mentions",
        variant: "error",
      });
    } finally {
      setLoadingMentions(false);
    }
  };

  const loadParcours = async () => {
    try {
      setLoadingParcours(true);
      const data = await parcoursService.getParcours();

      setParcours(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les parcours",
        variant: "error",
      });
    } finally {
      setLoadingParcours(false);
    }
  };

  const loadMatieres = async () => {
    try {
      setLoadingMatieres(true);
      const data = await matiereService.getMatieres();

      setMatieres(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les matières",
        variant: "error",
      });
    } finally {
      setLoadingMatieres(false);
    }
  };

  // Ouvrir le modal pour ajout
  const handleAdd = (type: EntityType) => {
    setModalType(type);
    setEditingItem(null);
    setFormData({
      code: "",
      nom: "",
      description: "",
      ordre: type === "niveau" ? niveaux.length + 1 : 1,
      cycle: "licence",
      mentionId: mentions.length > 0 ? mentions[0].id : "",
      coefficient: 1,
      couleur: "",
    });
    onOpen();
  };

  // Ouvrir le modal pour édition
  const handleEdit = (type: EntityType, item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({
      code: item.code || "",
      nom: item.nom || "",
      description: item.description || "",
      ordre: item.ordre || 1,
      cycle: item.cycle || "licence",
      mentionId: item.mentionId || "",
      coefficient: item.coefficient || 1,
      couleur: item.couleur || "",
    });
    onOpen();
  };

  // Confirmer la suppression
  const handleDelete = (type: EntityType, item: any) => {
    setDeleteItem({ type, item });
    onDeleteOpen();
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      switch (modalType) {
        case "niveau":
          const niveauData: NiveauCreate = {
            code: formData.code,
            nom: formData.nom,
            description: formData.description || undefined,
            ordre: formData.ordre,
            cycle: formData.cycle,
          };

          if (editingItem) {
            await niveauService.updateNiveau(editingItem.id, niveauData);
            toast({
              title: "Succès",
              description: "Niveau mis à jour",
              variant: "success",
            });
          } else {
            await niveauService.createNiveau(niveauData);
            toast({
              title: "Succès",
              description: "Niveau créé",
              variant: "success",
            });
          }
          loadNiveaux();
          break;

        case "mention":
          const mentionData: MentionCreate = {
            code: formData.code,
            nom: formData.nom,
            description: formData.description || undefined,
            etablissementId: "default", // À adapter selon le contexte
            couleur: formData.couleur || undefined,
          };

          if (editingItem) {
            await mentionService.updateMention(editingItem.id, mentionData);
            toast({
              title: "Succès",
              description: "Mention mise à jour",
              variant: "success",
            });
          } else {
            await mentionService.createMention(mentionData);
            toast({
              title: "Succès",
              description: "Mention créée",
              variant: "success",
            });
          }
          loadMentions();
          break;

        case "parcours":
          if (!formData.mentionId) {
            toast({
              title: "Erreur",
              description: "Veuillez sélectionner une mention",
              variant: "error",
            });

            return;
          }
          const parcoursData: ParcoursCreate = {
            code: formData.code,
            nom: formData.nom,
            description: formData.description || undefined,
            mentionId: formData.mentionId,
          };

          if (editingItem) {
            await parcoursService.updateParcours(editingItem.id, parcoursData);
            toast({
              title: "Succès",
              description: "Parcours mis à jour",
              variant: "success",
            });
          } else {
            await parcoursService.createParcours(parcoursData);
            toast({
              title: "Succès",
              description: "Parcours créé",
              variant: "success",
            });
          }
          loadParcours();
          break;

        case "matiere":
          const matiereData: MatiereCreate = {
            code: formData.code,
            nom: formData.nom,
            description: formData.description || undefined,
            coefficient: formData.coefficient,
            couleur: formData.couleur || undefined,
          };

          if (editingItem) {
            await matiereService.updateMatiere(editingItem.id, matiereData);
            toast({
              title: "Succès",
              description: "Matière mise à jour",
              variant: "success",
            });
          } else {
            await matiereService.createMatiere(matiereData);
            toast({
              title: "Succès",
              description: "Matière créée",
              variant: "success",
            });
          }
          loadMatieres();
          break;
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (!deleteItem) return;

    try {
      switch (deleteItem.type) {
        case "niveau":
          await niveauService.deleteNiveau(deleteItem.item.id);
          loadNiveaux();
          break;
        case "mention":
          await mentionService.deleteMention(deleteItem.item.id);
          loadMentions();
          break;
        case "parcours":
          await parcoursService.deleteParcours(deleteItem.item.id);
          loadParcours();
          break;
        case "matiere":
          await matiereService.deleteMatiere(deleteItem.item.id);
          loadMatieres();
          break;
      }

      toast({
        title: "Succès",
        description: "Élément supprimé",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de supprimer",
        variant: "error",
      });
    }

    onDeleteClose();
    setDeleteItem(null);
  };

  // Titres du modal
  const getModalTitle = () => {
    const action = editingItem ? "Modifier" : "Ajouter";

    switch (modalType) {
      case "niveau":
        return `${action} un niveau`;
      case "mention":
        return `${action} une mention`;
      case "parcours":
        return `${action} un parcours`;
      case "matiere":
        return `${action} une matière`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion de la structure</h1>
        <p className="text-default-500">
          Gérez les niveaux, mentions, parcours et matières
        </p>
      </div>

      {/* Grille des blocs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bloc Niveaux */}
        <StructureBlock<Niveau>
          color="bg-blue-100 dark:bg-blue-900/30"
          icon={
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          }
          items={niveaux}
          loading={loadingNiveaux}
          renderChip={(item) => (
            <Chip color="primary" size="sm" variant="flat">
              {item.cycle}
            </Chip>
          )}
          renderItem={(item) => (
            <p className="text-sm text-default-500 mt-1">Ordre: {item.ordre}</p>
          )}
          title="Niveaux"
          onAdd={() => handleAdd("niveau")}
          onDelete={(item) => handleDelete("niveau", item)}
          onEdit={(item) => handleEdit("niveau", item)}
        />

        {/* Bloc Mentions */}
        <StructureBlock<Mention>
          color="bg-purple-100 dark:bg-purple-900/30"
          icon={
            <BookMarked className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          }
          items={mentions}
          loading={loadingMentions}
          renderItem={(item) =>
            item.description ? (
              <p className="text-sm text-default-500 mt-1 truncate">
                {item.description}
              </p>
            ) : null
          }
          title="Mentions"
          onAdd={() => handleAdd("mention")}
          onDelete={(item) => handleDelete("mention", item)}
          onEdit={(item) => handleEdit("mention", item)}
        />

        {/* Bloc Parcours */}
        <StructureBlock<Parcours>
          color="bg-green-100 dark:bg-green-900/30"
          icon={
            <Route className="w-5 h-5 text-green-600 dark:text-green-400" />
          }
          items={parcours}
          loading={loadingParcours}
          renderChip={(item) =>
            item.mention ? (
              <Chip color="secondary" size="sm" variant="flat">
                {item.mention.code}
              </Chip>
            ) : null
          }
          renderItem={(item) =>
            item.description ? (
              <p className="text-sm text-default-500 mt-1 truncate">
                {item.description}
              </p>
            ) : null
          }
          title="Parcours"
          onAdd={() => handleAdd("parcours")}
          onDelete={(item) => handleDelete("parcours", item)}
          onEdit={(item) => handleEdit("parcours", item)}
        />

        {/* Bloc Matières */}
        <StructureBlock<Matiere>
          color="bg-orange-100 dark:bg-orange-900/30"
          icon={
            <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          }
          items={matieres}
          loading={loadingMatieres}
          renderChip={(item) =>
            item.coefficient ? (
              <Chip color="warning" size="sm" variant="flat">
                Coef. {item.coefficient}
              </Chip>
            ) : null
          }
          renderItem={(item) =>
            item.description ? (
              <p className="text-sm text-default-500 mt-1 truncate">
                {item.description}
              </p>
            ) : null
          }
          title="Matières"
          onAdd={() => handleAdd("matiere")}
          onDelete={(item) => handleDelete("matiere", item)}
          onEdit={(item) => handleEdit("matiere", item)}
        />
      </div>

      {/* Modal de création/édition */}
      <Modal isOpen={isOpen} size="lg" onClose={onClose}>
        <ModalContent>
          <ModalHeader>{getModalTitle()}</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              isRequired
              label="Code"
              placeholder="Ex: L1, INFO, MATH..."
              value={formData.code}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />

            <Input
              isRequired
              label="Nom"
              placeholder="Nom complet"
              value={formData.nom}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
            />

            <Input
              label="Description"
              placeholder="Description (optionnel)"
              value={formData.description}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            {/* Champs spécifiques selon le type */}
            {modalType === "niveau" && (
              <>
                <Input
                  label="Ordre"
                  min={1}
                  type="number"
                  value={formData.ordre.toString()}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ordre: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <Select
                  label="Cycle"
                  selectedKeys={[formData.cycle]}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, cycle: e.target.value })
                  }
                >
                  <SelectItem key="licence">Licence</SelectItem>
                  <SelectItem key="master">Master</SelectItem>
                  <SelectItem key="doctorat">Doctorat</SelectItem>
                </Select>
              </>
            )}

            {modalType === "parcours" && (
              <Select
                isRequired
                label="Mention"
                placeholder="Sélectionner une mention"
                selectedKeys={formData.mentionId ? [formData.mentionId] : []}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, mentionId: e.target.value })
                }
              >
                {mentions.map((mention) => (
                  <SelectItem key={mention.id}>
                    {mention.nom} ({mention.code})
                  </SelectItem>
                ))}
              </Select>
            )}

            {modalType === "matiere" && (
              <Input
                label="Coefficient"
                min={1}
                type="number"
                value={formData.coefficient.toString()}
                variant="bordered"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coefficient: parseInt(e.target.value) || 1,
                  })
                }
              />
            )}

            {(modalType === "mention" || modalType === "matiere") && (
              <Input
                label="Couleur"
                placeholder="Ex: #3b82f6"
                type="color"
                value={formData.couleur || "#3b82f6"}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, couleur: e.target.value })
                }
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Annuler
            </Button>
            <Button
              className="bg-theme-primary text-white hover:bg-theme-primary/90"
              isDisabled={!formData.code || !formData.nom}
              isLoading={isSubmitting}
              onPress={handleSubmit}
            >
              {editingItem ? "Mettre à jour" : "Créer"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        cancelLabel="Annuler"
        confirmColor="danger"
        confirmLabel="Supprimer"
        isOpen={isDeleteOpen}
        message={
          deleteItem
            ? `Êtes-vous sûr de vouloir supprimer "${deleteItem.item.nom}" ?`
            : "Êtes-vous sûr de vouloir supprimer cet élément ?"
        }
        title="Confirmer la suppression"
        variant="danger"
        onClose={() => {
          onDeleteClose();
          setDeleteItem(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
