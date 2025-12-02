"use client";

import type {
  QCM,
  QCMFormData,
  Question,
} from "@/features/enseignant/types/enseignant.types";
import type { Matiere } from "@/shared/types/matiere.types";

import * as React from "react";
import { use } from "react";
import {
  ArrowLeft,
  FileText,
  Save,
  Trash2,
  Send,
  Link as LinkIcon,
  Plus,
  Edit2,
  ChevronUp,
  ChevronDown,
  X,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useForm, Controller } from "react-hook-form";
import { useDisclosure } from "@heroui/modal";

import { useAuth } from "@/core/providers/AuthProvider";
import { qcmService } from "@/features/enseignant/services/qcm.service";
import { profileService } from "@/shared/services/api/profile.service";
import { useToast } from "@/hooks/use-toast";
import { CreateSessionModal } from "@/features/enseignant/components/sessions/CreateSessionModal";
import { QCMStatsSummary } from "@/features/enseignant/components/qcm/QCMStatsSummary";
import { QCMStatisticsModal } from "@/features/enseignant/components/qcm/QCMStatisticsModal";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

interface QCMDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function QCMDetailPage({ params }: QCMDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user: _user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingQuestionId, setEditingQuestionId] = React.useState<
    string | null
  >(null);
  const [isAddingQuestion, setIsAddingQuestion] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const {
    isOpen: isSessionModalOpen,
    onOpen: onSessionModalOpen,
    onClose: onSessionModalClose,
  } = useDisclosure();
  const {
    isOpen: isStatsModalOpen,
    onOpen: onStatsModalOpen,
    onClose: onStatsModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteQuestionConfirmOpen,
    onOpen: onDeleteQuestionConfirmOpen,
    onClose: onDeleteQuestionConfirmClose,
  } = useDisclosure();
  const [questionToDelete, setQuestionToDelete] = React.useState<string | null>(
    null,
  );

  // Charger le QCM
  const {
    data: qcm,
    isLoading,
    error,
    mutate,
    isValidating: isValidatingQCM,
  } = useSWR<QCM>(["qcm-detail", id], () => qcmService.getQCMById(id), {
    revalidateOnFocus: false,
  });

  // Charger les questions
  const {
    data: questionsData,
    mutate: mutateQuestions,
    isValidating: isValidatingQuestions,
  } = useSWR<{ questions: Question[]; total: number }>(
    qcm ? ["qcm-questions", id] : null,
    () => qcmService.getQuestions(id),
    {
      revalidateOnFocus: false,
    },
  );

  // Fonction pour rafraîchir toutes les données
  const handleRefresh = async () => {
    await Promise.all([mutate(), mutateQuestions()]);
    toast({
      title: "Données rafraîchies",
      description: "Les informations du QCM ont été mises à jour",
      variant: "success",
    });
  };

  const isRefreshing = isValidatingQCM || isValidatingQuestions;

  // Charger les matières de l'enseignant connecté
  const { user } = useAuth();
  const { data: profileData } = useSWR(
    user?.role === "enseignant"
      ? ["profile-enseignant-qcm-edit", "enseignant"]
      : null,
    async () => {
      return await profileService.getMyProfile("enseignant");
    },
  );

  // Extraire les matières du profil enseignant
  const matieres = React.useMemo(() => {
    if (profileData && "matieres" in profileData && profileData.matieres) {
      return profileData.matieres;
    }

    return [];
  }, [profileData]);

  // Formulaire d'édition
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<QCMFormData>({
    defaultValues: qcm
      ? {
          titre: qcm.titre,
          description: qcm.description || "",
          duree: qcm.duree,
          matiere: qcm.matiere || "",
          matiereId:
            (qcm as any).matiereId || (qcm as any).matiereObj?.id || undefined,
          status: qcm.status,
        }
      : undefined,
  });

  // Réinitialiser le formulaire quand le QCM est chargé
  React.useEffect(() => {
    if (qcm && !isEditing) {
      // Si pas de matiereId mais qu'on a une matière en texte, essayer de la trouver
      let matiereId = (qcm as any).matiereId || (qcm as any).matiereObj?.id;

      if (!matiereId && qcm.matiere && matieres.length > 0) {
        const found = matieres.find(
          (m: Matiere) => m.code === qcm.matiere || m.nom === qcm.matiere,
        );

        if (found) {
          matiereId = found.id;
        }
      }

      reset({
        titre: qcm.titre,
        description: qcm.description || "",
        duree: qcm.duree,
        matiere: qcm.matiere || "",
        matiereId: matiereId,
        status: qcm.status,
      });
    }
  }, [qcm, reset, isEditing, matieres]);

  const onSubmit = async (data: QCMFormData) => {
    if (!qcm) return;

    setIsSaving(true);
    try {
      await qcmService.updateQCM(qcm.id, data);
      toast({
        title: "QCM mis à jour",
        description: "Le QCM a été modifié avec succès",
        variant: "success",
      });
      setIsEditing(false);
      mutate(); // Revalider le cache
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur mise à jour QCM:", error);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de la mise à jour du QCM",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!qcm) return;
    onDeleteConfirmOpen();
  };

  const confirmDelete = async () => {
    if (!qcm) return;
    try {
      await qcmService.deleteQCM(qcm.id);
      toast({
        title: "QCM supprimé",
        description: "Le QCM a été supprimé avec succès",
        variant: "success",
      });
      router.push("/enseignant/qcm");
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur suppression QCM:", error);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de la suppression du QCM",
        variant: "error",
      });
    }
  };

  const handlePublish = async () => {
    if (!qcm) return;

    try {
      await qcmService.publishQCM(qcm.id);
      toast({
        title: "QCM publié",
        description: "Le QCM a été publié avec succès",
        variant: "success",
      });
      mutate(); // Revalider le cache
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur publication QCM:", error);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de la publication du QCM",
        variant: "error",
      });
    }
  };

  const handleEnvoyerAuxEleves = async () => {
    if (!qcm) return;

    setIsSending(true);
    try {
      const result = await qcmService.envoyerAuxEleves(qcm.id);

      toast({
        title: "QCM envoyé aux élèves",
        description: `Le QCM a été envoyé à ${result.nombre_etudiants} élève${result.nombre_etudiants > 1 ? "s" : ""} suivant la matière "${result.matiere}"`,
        variant: "success",
      });
      mutate(); // Revalider le cache
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur envoi QCM aux élèves:", error);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors de l'envoi du QCM aux élèves",
        variant: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!qcm) return;

    try {
      const link = qcmService.getShareableLink(qcm.id);

      await navigator.clipboard.writeText(link);
      toast({
        title: "Lien copié",
        description: "Le lien du QCM a été copié dans le presse-papier",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur copie lien:", error);
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-lg">Chargement du QCM...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error || !qcm) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardBody className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-default-500 mb-4">
              {error?.response?.status === 404
                ? "Le QCM demandé n'existe pas."
                : "Une erreur est survenue lors du chargement du QCM."}
            </p>
            <Button
              startContent={<ArrowLeft className="w-4 h-4" />}
              variant="flat"
              onPress={() => router.push("/enseignant/qcm")}
            >
              Retour à la liste
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const questions = questionsData?.questions || [];

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Modifier le QCM" : qcm.titre}
            </h1>
            <p className="text-default-500">
              {isEditing
                ? "Modifiez les informations du QCM"
                : "Détails du QCM"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                startContent={<ArrowLeft className="h-4 w-4" />}
                variant="flat"
                onPress={() => router.push("/enseignant/qcm")}
              >
                Retour
              </Button>
              <Button
                isIconOnly
                aria-label="Rafraîchir les données"
                isLoading={isRefreshing}
                variant="flat"
                onPress={handleRefresh}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                color="primary"
                startContent={<FileText className="h-4 w-4" />}
                variant="flat"
                onPress={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="flat"
                onPress={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                isDisabled={!isDirty}
                isLoading={isSaving}
                startContent={<Save className="h-4 w-4" />}
                onPress={() => {
                  const submitHandler = handleSubmit(onSubmit);

                  submitHandler();
                }}
              >
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Formulaire d'édition ou affichage */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Informations du QCM</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Titre"
                placeholder="Titre du QCM"
                {...register("titre", { required: "Le titre est requis" })}
                errorMessage={errors.titre?.message}
                isInvalid={!!errors.titre}
              />

              <Textarea
                label="Description"
                placeholder="Description du QCM"
                {...register("description")}
                errorMessage={errors.description?.message}
                isInvalid={!!errors.description}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="matiereId"
                  render={({ field }) => (
                    <Select
                      errorMessage={errors.matiereId?.message}
                      isInvalid={!!errors.matiereId}
                      label="Matière"
                      placeholder="Sélectionner une matière"
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        if (selectedKey) {
                          // Trouver la matière sélectionnée pour mettre à jour aussi le nom
                          const matiereSelected = matieres.find(
                            (m: Matiere) => m.id === selectedKey,
                          );

                          field.onChange(selectedKey);
                          // Mettre à jour aussi le champ matiere (texte) pour compatibilité
                          if (matiereSelected) {
                            setValue("matiere", matiereSelected.nom);
                          }
                        } else {
                          field.onChange(undefined);
                          setValue("matiere", "");
                        }
                      }}
                    >
                      {matieres.map((matiere: Matiere) => (
                        <SelectItem key={matiere.id}>
                          {matiere.nom} ({matiere.code})
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />

                <Input
                  label="Durée (minutes)"
                  placeholder="Durée"
                  type="number"
                  {...register("duree", {
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "La durée doit être au moins 1 minute",
                    },
                  })}
                  errorMessage={errors.duree?.message}
                  isInvalid={!!errors.duree}
                />
              </div>

              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-default-200 rounded-lg bg-default-50"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </select>
                )}
              />
            </CardBody>
          </Card>
        </form>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-semibold">Informations</h2>
              <Chip
                color={
                  qcm.status === "published"
                    ? "success"
                    : qcm.status === "draft"
                      ? "warning"
                      : "default"
                }
                variant="flat"
              >
                {qcm.status === "published"
                  ? "Publié"
                  : qcm.status === "draft"
                    ? "Brouillon"
                    : "Archivé"}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-default-500">Titre</p>
                <p className="font-medium text-lg">{qcm.titre}</p>
              </div>
              {qcm.description && (
                <div>
                  <p className="text-sm text-default-500">Description</p>
                  <p className="font-medium">{qcm.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-default-500">Matière</p>
                  <p className="font-medium">
                    {qcm.matiere || "Non spécifiée"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">
                    Nombre de questions
                  </p>
                  <p className="font-medium">
                    {qcm.nombreQuestions || questions.length}
                  </p>
                </div>
                {qcm.duree && (
                  <div>
                    <p className="text-sm text-default-500">Durée</p>
                    <p className="font-medium">{qcm.duree} minutes</p>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Statistiques */}
      {!isEditing && qcm && (
        <QCMStatsSummary qcmId={qcm.id} onOpenModal={onStatsModalOpen} />
      )}

      {/* Actions */}
      {!isEditing && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 flex-wrap">
              {qcm.status === "draft" && (
                <>
                  <Button
                    color="success"
                    startContent={<Send className="w-4 h-4" />}
                    variant="flat"
                    onPress={handlePublish}
                  >
                    Publier
                  </Button>
                  <Button
                    color="primary"
                    isDisabled={isSending}
                    isLoading={isSending}
                    startContent={<Send className="w-4 h-4" />}
                    variant="solid"
                    onPress={handleEnvoyerAuxEleves}
                  >
                    Envoyer aux élèves
                  </Button>
                </>
              )}
              {qcm.status === "published" && (
                <>
                  <Button
                    color="primary"
                    isDisabled={isSending}
                    isLoading={isSending}
                    startContent={<Send className="w-4 h-4" />}
                    variant="solid"
                    onPress={handleEnvoyerAuxEleves}
                  >
                    Envoyer aux élèves
                  </Button>
                  <Button
                    color="primary"
                    startContent={<LinkIcon className="w-4 h-4" />}
                    variant="flat"
                    onPress={handleCopyLink}
                  >
                    Copier le lien
                  </Button>
                  <Button
                    color="primary"
                    startContent={<Calendar className="w-4 h-4" />}
                    variant="flat"
                    onPress={onSessionModalOpen}
                  >
                    Créer une session d'examen
                  </Button>
                </>
              )}
              <Button
                color="danger"
                startContent={<Trash2 className="w-4 h-4" />}
                variant="flat"
                onPress={handleDelete}
              >
                Supprimer
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal de création de session */}
      <CreateSessionModal
        isOpen={isSessionModalOpen}
        prefillQcmId={qcm?.id}
        onClose={onSessionModalClose}
        onSuccess={() => {
          onSessionModalClose();
          toast({
            title: "Session créée",
            description: "La session d'examen a été créée avec succès",
            variant: "success",
          });
        }}
      />

      {/* Modal de statistiques */}
      {qcm && (
        <QCMStatisticsModal
          isOpen={isStatsModalOpen}
          qcmId={qcm.id}
          onClose={onStatsModalClose}
        />
      )}

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold">
              Questions ({questions.length})
            </h2>
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="w-4 h-4" />}
              variant="flat"
              onPress={() => setIsAddingQuestion(true)}
            >
              Ajouter une question
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {questions.length === 0 && !isAddingQuestion ? (
            <div className="text-center py-8 text-default-500">
              <p>
                Aucune question. Cliquez sur "Ajouter une question" pour
                commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  index={index}
                  isEditing={editingQuestionId === question.id}
                  question={question}
                  total={questions.length}
                  onCancel={() => setEditingQuestionId(null)}
                  onDelete={async () => {
                    setQuestionToDelete(question.id);
                    onDeleteQuestionConfirmOpen();
                  }}
                  onEdit={() => setEditingQuestionId(question.id)}
                  onMoveDown={
                    index < questions.length - 1
                      ? async () => {
                          // TODO: Implémenter le réarrangement (nécessite un endpoint backend)
                          toast({
                            title: "Info",
                            description:
                              "Le réarrangement sera implémenté prochainement",
                            variant: "info",
                          });
                        }
                      : undefined
                  }
                  onMoveUp={
                    index > 0
                      ? async () => {
                          // TODO: Implémenter le réarrangement (nécessite un endpoint backend)
                          toast({
                            title: "Info",
                            description:
                              "Le réarrangement sera implémenté prochainement",
                            variant: "info",
                          });
                        }
                      : undefined
                  }
                  onSave={async (data) => {
                    try {
                      await qcmService.updateQuestion(id, question.id, data);
                      toast({
                        title: "Question mise à jour",
                        description: "La question a été modifiée avec succès",
                        variant: "success",
                      });
                      setEditingQuestionId(null);
                      mutateQuestions();
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description:
                          error.response?.data?.message ||
                          "Erreur lors de la mise à jour",
                        variant: "error",
                      });
                    }
                  }}
                />
              ))}

              {isAddingQuestion && (
                <QuestionEditor
                  index={questions.length}
                  isEditing={true}
                  question={null}
                  total={questions.length + 1}
                  onCancel={() => setIsAddingQuestion(false)}
                  onSave={async (data) => {
                    try {
                      await qcmService.createQuestion(id, data);
                      toast({
                        title: "Question ajoutée",
                        description: "La question a été ajoutée avec succès",
                        variant: "success",
                      });
                      setIsAddingQuestion(false);
                      mutateQuestions();
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description:
                          error.response?.data?.message ||
                          "Erreur lors de la création",
                        variant: "error",
                      });
                    }
                  }}
                />
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de confirmation de suppression QCM */}
      <ConfirmDialog
        cancelLabel="Annuler"
        confirmColor="danger"
        confirmLabel="Supprimer"
        isOpen={isDeleteConfirmOpen}
        message="Êtes-vous sûr de vouloir supprimer ce QCM ?"
        title="Supprimer le QCM"
        variant="danger"
        onClose={onDeleteConfirmClose}
        onConfirm={confirmDelete}
      />

      {/* Modal de confirmation de suppression question */}
      <ConfirmDialog
        cancelLabel="Annuler"
        confirmColor="danger"
        confirmLabel="Supprimer"
        isOpen={isDeleteQuestionConfirmOpen}
        message="Êtes-vous sûr de vouloir supprimer cette question ?"
        title="Supprimer la question"
        variant="danger"
        onClose={() => {
          onDeleteQuestionConfirmClose();
          setQuestionToDelete(null);
        }}
        onConfirm={async () => {
          if (!questionToDelete || !qcm) return;
          try {
            await qcmService.deleteQuestion(qcm.id, questionToDelete);
            toast({
              title: "Question supprimée",
              description: "La question a été supprimée avec succès",
              variant: "success",
            });
            mutateQuestions();
            setQuestionToDelete(null);
          } catch (error: any) {
            toast({
              title: "Erreur",
              description:
                error.response?.data?.message ||
                "Erreur lors de la suppression de la question",
              variant: "error",
            });
          }
        }}
      />
    </div>
  );
}

// Composant pour éditer une question
interface QuestionEditorProps {
  question: Question | null;
  index: number;
  total: number;
  isEditing: boolean;
  onEdit?: () => void;
  onCancel: () => void;
  onSave: (data: Partial<Question>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onMoveUp?: () => Promise<void>;
  onMoveDown?: () => Promise<void>;
}

function QuestionEditor({
  question,
  index,
  total: _total,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: QuestionEditorProps) {
  // Fonction pour mapper le type de question du backend vers le type local
  const mapTypeQuestion = (
    type: "qcm" | "qcm_multiple" | "vrai_faux" | "text",
  ): "qcm" | "vrai_faux" | "texte_libre" => {
    if (type === "text") return "texte_libre";
    if (type === "qcm_multiple") return "qcm";

    return type;
  };

  const [enonce, setEnonce] = React.useState(question?.enonce || "");
  const [points, setPoints] = React.useState(question?.points || 1);
  const [typeQuestion, setTypeQuestion] = React.useState<
    "qcm" | "vrai_faux" | "texte_libre"
  >(question?.typeQuestion ? mapTypeQuestion(question.typeQuestion) : "qcm");
  const [options, setOptions] = React.useState<any[]>(question?.options || []);
  const [reponseCorrecte, setReponseCorrecte] = React.useState(
    typeof question?.reponseCorrecte === "string"
      ? question.reponseCorrecte
      : Array.isArray(question?.reponseCorrecte)
        ? question.reponseCorrecte.join(", ")
        : "",
  );
  const [explication, setExplication] = React.useState(
    question?.explication || "",
  );
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (question) {
      setEnonce(question.enonce || "");
      setPoints(question.points || 1);
      setTypeQuestion(
        question.typeQuestion ? mapTypeQuestion(question.typeQuestion) : "qcm",
      );
      setOptions(question.options || []);
      setReponseCorrecte(
        typeof question.reponseCorrecte === "string"
          ? question.reponseCorrecte
          : Array.isArray(question.reponseCorrecte)
            ? question.reponseCorrecte.join(", ")
            : "",
      );
      setExplication(question.explication || "");
    } else {
      // Nouvelle question
      setEnonce("");
      setPoints(1);
      setTypeQuestion("qcm");
      setOptions([
        { id: "a", texte: "", estCorrecte: false },
        { id: "b", texte: "", estCorrecte: false },
      ]);
      setReponseCorrecte("");
      setExplication("");
    }
  }, [question, isEditing]);

  const handleAddOption = () => {
    const newId = String.fromCharCode(97 + options.length); // a, b, c, d...

    setOptions([...options, { id: newId, texte: "", estCorrecte: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleUpdateOption = (
    index: number,
    field: "texte" | "estCorrecte",
    value: any,
  ) => {
    const newOptions = [...options];

    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!enonce.trim()) {
      alert("L'énoncé est requis");

      return;
    }

    setIsSaving(true);
    try {
      const data: any = {
        enonce: enonce.trim(),
        points,
        type_question: typeQuestion,
        explication: explication.trim() || undefined,
      };

      if (typeQuestion === "qcm") {
        if (options.length < 2) {
          alert("Un QCM doit avoir au moins 2 options");
          setIsSaving(false);

          return;
        }
        const validOptions = options.filter(
          (opt) => opt.texte && opt.texte.trim(),
        );

        if (validOptions.length < 2) {
          alert("Toutes les options doivent avoir un texte");
          setIsSaving(false);

          return;
        }
        if (!validOptions.some((opt) => opt.estCorrecte)) {
          alert("Au moins une option doit être correcte");
          setIsSaving(false);

          return;
        }
        data.options = validOptions;
      } else {
        let reponseStr: string;

        if (typeof reponseCorrecte === "string") {
          reponseStr = reponseCorrecte;
        } else if (Array.isArray(reponseCorrecte)) {
          reponseStr = (reponseCorrecte as string[]).join(", ");
        } else {
          reponseStr = "";
        }
        if (!reponseStr.trim()) {
          alert("La réponse correcte est requise");
          setIsSaving(false);

          return;
        }
        data.reponse_correcte = reponseStr.trim();
      }

      await onSave(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing && question) {
    return (
      <Card className="border border-default-200">
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">Question {index + 1}</span>
                <Chip size="sm" variant="flat">
                  {points} point{points > 1 ? "s" : ""}
                </Chip>
                <Chip color="default" size="sm" variant="flat">
                  {typeQuestion === "qcm"
                    ? "QCM"
                    : typeQuestion === "vrai_faux"
                      ? "Vrai/Faux"
                      : "Texte libre"}
                </Chip>
              </div>
              <p className="text-lg mb-2">{enonce}</p>
              {typeQuestion === "qcm" && options.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-default-500 mb-1">
                    Options :
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {options.map((option: any, optIndex: number) => (
                      <li key={optIndex} className="text-default-700">
                        {typeof option === "string"
                          ? option
                          : option.texte ||
                            option.text ||
                            JSON.stringify(option)}
                        {typeof option === "object" && option.estCorrecte && (
                          <Chip
                            className="ml-2"
                            color="success"
                            size="sm"
                            variant="flat"
                          >
                            Correcte
                          </Chip>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(typeQuestion === "vrai_faux" ||
                typeQuestion === "texte_libre") &&
                reponseCorrecte && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-default-500">
                      Réponse correcte :
                    </p>
                    <p className="text-default-700">{reponseCorrecte}</p>
                  </div>
                )}
              {explication && (
                <div className="mt-2 p-2 bg-default-100 rounded-lg">
                  <p className="text-sm font-medium text-default-500 mb-1">
                    Explication :
                  </p>
                  <p className="text-sm text-default-700">{explication}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onMoveUp && (
                <Button isIconOnly size="sm" variant="flat" onPress={onMoveUp}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
              )}
              {onMoveDown && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={onMoveDown}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  startContent={<Edit2 className="w-4 h-4" />}
                  variant="flat"
                  onPress={onEdit}
                >
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button
                  color="danger"
                  size="sm"
                  startContent={<Trash2 className="w-4 h-4" />}
                  variant="flat"
                  onPress={onDelete}
                >
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <h3 className="font-semibold">
          {question ? `Modifier la question ${index + 1}` : "Nouvelle question"}
        </h3>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Énoncé *</label>
          <Textarea
            minRows={2}
            placeholder="Entrez l'énoncé de la question"
            value={enonce}
            onChange={(e) => setEnonce(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Points *</label>
            <Input
              max={100}
              min={1}
              type="number"
              value={points.toString()}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Type de question *
            </label>
            <select
              className="w-full px-3 py-2 border border-default-200 rounded-lg bg-default-50"
              value={typeQuestion}
              onChange={(e) => setTypeQuestion(e.target.value as any)}
            >
              <option value="qcm">QCM</option>
              <option value="vrai_faux">Vrai/Faux</option>
              <option value="texte_libre">Texte libre</option>
            </select>
          </div>
        </div>

        {typeQuestion === "qcm" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Options *</label>
              <Button
                size="sm"
                startContent={<Plus className="w-4 h-4" />}
                variant="flat"
                onPress={handleAddOption}
              >
                Ajouter une option
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    placeholder={`Option ${String.fromCharCode(97 + optIndex).toUpperCase()}`}
                    value={
                      typeof option === "string" ? option : option.texte || ""
                    }
                    onChange={(e) =>
                      handleUpdateOption(optIndex, "texte", e.target.value)
                    }
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      checked={
                        typeof option === "object" ? option.estCorrecte : false
                      }
                      className="w-4 h-4"
                      type="checkbox"
                      onChange={(e) =>
                        handleUpdateOption(
                          optIndex,
                          "estCorrecte",
                          e.target.checked,
                        )
                      }
                    />
                    <span className="text-sm">Correcte</span>
                  </label>
                  {options.length > 2 && (
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="flat"
                      onPress={() => handleRemoveOption(optIndex)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(typeQuestion === "vrai_faux" || typeQuestion === "texte_libre") && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Réponse correcte *
            </label>
            {typeQuestion === "vrai_faux" ? (
              <select
                className="w-full px-3 py-2 border border-default-200 rounded-lg bg-default-50"
                value={
                  typeof reponseCorrecte === "string"
                    ? reponseCorrecte
                    : Array.isArray(reponseCorrecte)
                      ? reponseCorrecte[0] || ""
                      : ""
                }
                onChange={(e) => setReponseCorrecte(e.target.value)}
              >
                <option value="">Sélectionnez...</option>
                <option value="Vrai">Vrai</option>
                <option value="Faux">Faux</option>
              </select>
            ) : (
              <Textarea
                minRows={2}
                placeholder="Entrez la réponse correcte attendue"
                value={
                  typeof reponseCorrecte === "string"
                    ? reponseCorrecte
                    : Array.isArray(reponseCorrecte)
                      ? (reponseCorrecte as string[]).join(", ")
                      : ""
                }
                onChange={(e) => setReponseCorrecte(e.target.value)}
              />
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Explication (optionnel)
          </label>
          <Textarea
            minRows={2}
            placeholder="Explication de la réponse"
            value={explication}
            onChange={(e) => setExplication(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button isDisabled={isSaving} variant="flat" onPress={onCancel}>
            Annuler
          </Button>
          <Button color="primary" isLoading={isSaving} onPress={handleSave}>
            Enregistrer
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
