"use client";

import * as React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { Progress } from "@heroui/progress";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Upload, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { qcmService } from "../../services/qcm.service";
import { useTaskPolling } from "../../hooks/useTaskPolling";
import { profileService } from "@/shared/services/api/profile.service";
import { useAuth } from "@/core/providers/AuthProvider";

import { mentionService } from "@/shared/services/api/mention.service";
import { parcoursService } from "@/shared/services/api/parcours.service";
import { NIVEAUX_STATIQUES } from "@/shared/types/niveau.types";

import { useToast } from "@/hooks/use-toast";

// Schéma de validation Zod
const generateSchema = z
  .object({
    qcmId: z.string().optional(), // ID du QCM existant à utiliser comme référence
    titre: z
      .string()
      .min(3, "Le titre doit contenir au moins 3 caractères")
      .max(200),
    matiere: z.string().optional(),
    niveauId: z.string().optional(),
    mentionId: z.string().optional(),
    parcoursId: z.string().optional(),
    duree: z.number().min(5).max(300).optional(),
    num_questions: z.number().min(1).max(20).optional(),
    source: z.enum(["text", "document"]),
    text: z.string().optional(),
    file: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.source === "text") {
        return !!data.text && data.text.length >= 50;
      }
      if (data.source === "document") {
        return !!data.file;
      }

      return true;
    },
    {
      message: "Veuillez fournir du texte (min. 50 caractères) ou un document",
      path: ["text"],
    },
  );

type GenerateFormData = z.infer<typeof generateSchema>;

interface QCMGenerateFormProps {
  onClose?: () => void;
  onSuccess?: (qcmId: string) => void;
  isModal?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
  onStateChange?: (state: {
    isSubmitting: boolean;
    isPolling: boolean;
  }) => void;
}

export function QCMGenerateForm({
  onClose,
  onSuccess,
  isModal = false,
  formRef,
  onStateChange,
}: QCMGenerateFormProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [taskId, setTaskId] = React.useState<string | null>(null);
  const [generatedQCMId, setGeneratedQCMId] = React.useState<string | null>(
    null,
  );
  const [sourceType, setSourceType] = React.useState<"text" | "document">(
    "text",
  );

  // Récupérer les matières de l'enseignant connecté
  const { user } = useAuth();
  const { data: profileData } = useSWR(
    user?.role === "enseignant" ? ["profile-enseignant-qcm", "enseignant"] : null,
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

  // Utiliser les niveaux statiques (L1, L2, L3, M1, M2)
  const niveaux = React.useMemo(() => {
    return NIVEAUX_STATIQUES;
  }, []);

  // Charger la liste des QCMs pour le sélecteur
  const { data: qcmsData } = useSWR(
    user?.role === "enseignant" ? ["qcms-for-generate"] : null,
    async () => {
      const response = await qcmService.getQCMs({ status: "published" });
      return response.data || [];
    },
  );

  const qcms = React.useMemo(() => qcmsData || [], [qcmsData]);

  // Charger les mentions depuis le profil ou depuis l'API
  const { data: mentionsFromProfile } = useSWR(
    user?.role === "enseignant" && profileData && "mentions" in profileData
      ? ["mentions-profile", profileData.id]
      : null,
    async () => {
      if (profileData && "mentions" in profileData && profileData.mentions && profileData.mentions.length > 0) {
        return profileData.mentions;
      }
      return null;
    },
  );

  const { data: allMentions } = useSWR(
    ["mentions-all"],
    async () => {
      return await mentionService.getMentions(true); // Seulement les actives
    },
  );

  const mentions = React.useMemo(() => {
    // Utiliser les mentions du profil s'ils existent, sinon toutes les mentions actives
    if (mentionsFromProfile && mentionsFromProfile.length > 0) {
      return mentionsFromProfile;
    }
    return allMentions || [];
  }, [mentionsFromProfile, allMentions]);

  // Charger les parcours depuis le profil ou depuis l'API
  const { data: parcoursFromProfile } = useSWR(
    user?.role === "enseignant" && profileData && "parcours" in profileData
      ? ["parcours-profile", profileData.id]
      : null,
    async () => {
      if (profileData && "parcours" in profileData && profileData.parcours) {
        const parcoursArray = Array.isArray(profileData.parcours)
          ? profileData.parcours
          : [profileData.parcours];
        return parcoursArray.length > 0 ? parcoursArray : null;
      }
      return null;
    },
  );

  const { data: allParcours } = useSWR(
    ["parcours-all"],
    async () => {
      return await parcoursService.getParcours(true); // Seulement les actifs
    },
  );

  const parcours = React.useMemo(() => {
    // Utiliser les parcours du profil s'ils existent, sinon tous les parcours actifs
    if (parcoursFromProfile && parcoursFromProfile.length > 0) {
      return parcoursFromProfile;
    }
    return allParcours || [];
  }, [parcoursFromProfile, allParcours]);

  // Formulaire avec React Hook Form + Zod
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      source: "text",
      num_questions: 10,
      duree: 60,
    },
  });

  // Surveiller le QCM sélectionné pour pré-remplir les champs
  const selectedQcmId = watch("qcmId");
  const selectedQcm = React.useMemo(() => {
    if (!selectedQcmId) return null;
    return qcms.find((q) => q.id === selectedQcmId);
  }, [qcms, selectedQcmId]);

  // Pré-remplir les champs quand un QCM est sélectionné
  React.useEffect(() => {
    if (selectedQcm) {
      if (selectedQcm.niveauId && !watch("niveauId")) {
        setValue("niveauId", selectedQcm.niveauId);
      }
      if (selectedQcm.mentionId && !watch("mentionId")) {
        setValue("mentionId", selectedQcm.mentionId);
      }
      if (selectedQcm.parcoursId && !watch("parcoursId")) {
        setValue("parcoursId", selectedQcm.parcoursId);
      }
      if (selectedQcm.matiere && !watch("matiere")) {
        // Utiliser directement le code de la matière si disponible
        setValue("matiere", selectedQcm.matiere);
      }
      if (selectedQcm.titre && !watch("titre")) {
        setValue("titre", selectedQcm.titre);
      }
    }
  }, [selectedQcm, setValue, watch, matieres]);

  const [estimatedDuration, setEstimatedDuration] = React.useState<
    number | null
  >(null);

  // Polling de la tâche de génération
  const { taskStatus, isPolling, progress, estimatedRemainingSeconds } =
    useTaskPolling({
      taskId,
      interval: 2000,
      timeout: 120000, // 2 minutes
      estimatedDurationSeconds: estimatedDuration || undefined,
      onSuccess: (result) => {
        // eslint-disable-next-line no-console
        console.log("✅ Génération réussie:", result);
        const qcmId = generatedQCMId || result?.qcm_id;

        if (qcmId) {
          toast({
            title: "QCM généré avec succès !",
            description:
              result?.message ||
              `Le QCM a été généré avec ${result?.num_questions || 0} questions.`,
            variant: "success",
          });

          if (isModal && onSuccess) {
            onSuccess(qcmId);
          } else if (!isModal) {
            router.push(`/enseignant/qcm/${qcmId}`);
          }
        } else {
          toast({
            title: "Génération terminée",
            description: "Le QCM a été généré avec succès.",
            variant: "success",
          });
        }
      },
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error("❌ Erreur génération:", error);
        toast({
          title: "Erreur lors de la génération",
          description:
            error ||
            "Une erreur est survenue lors de la génération du QCM. Veuillez réessayer.",
          variant: "error",
        });
        setTaskId(null);
      },
      onTimeout: () => {
        toast({
          title: "Timeout de génération",
          description:
            "La génération a pris trop de temps. Veuillez réessayer avec un texte plus court ou moins de questions.",
          variant: "error",
        });
        setTaskId(null);
      },
    });

  // Exposer les états au parent si en mode modal
  React.useEffect(() => {
    if (isModal && onStateChange) {
      onStateChange({ isSubmitting, isPolling });
    }
  }, [isModal, isSubmitting, isPolling, onStateChange]);

  const onSubmit = async (data: GenerateFormData) => {
    try {
      let response;

      if (data.source === "text" && data.text) {
        // Génération depuis du texte
        response = await qcmService.generateFromText({
          titre: data.titre,
          text: data.text,
          num_questions: data.num_questions || 10,
          matiere: data.matiere,
          niveau_id: data.niveauId,
          mention_id: data.mentionId,
          parcours_id: data.parcoursId,
          duree: data.duree,
        });
      } else if (data.source === "document" && data.file) {
        // Génération depuis un document
        const file = data.file[0] as File;
        const fileType = file.name.endsWith(".pdf") ? "pdf" : "docx";
        const base64Content = await qcmService.fileToBase64(file);

        response = await qcmService.generateFromDocument({
          titre: data.titre,
          file_content: base64Content,
          file_type: fileType,
          num_questions: data.num_questions || 10,
          matiere: data.matiere,
          niveau_id: data.niveauId,
          mention_id: data.mentionId,
          parcours_id: data.parcoursId,
          duree: data.duree,
        });
      } else {
        throw new Error("Source de génération invalide");
      }

      // Démarrer le polling
      setTaskId(response.task_id);
      setGeneratedQCMId(response.qcm_id || null);

      // Stocker l'estimation de temps si fournie
      if (response.estimated_duration_seconds) {
        setEstimatedDuration(response.estimated_duration_seconds);
      }

      toast({
        title: "Génération démarrée",
        description: `La génération du QCM a été lancée. Temps estimé: ${response.estimated_duration_seconds ? Math.ceil(response.estimated_duration_seconds / 60) : "quelques"} minute(s)...`,
        variant: "info",
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur lors du lancement de la génération:", error);
      toast({
        title: "Erreur lors du lancement",
        description:
          error.response?.data?.message ||
          "Erreur lors du lancement de la génération. Veuillez réessayer.",
        variant: "error",
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Formulaire */}
      <form
        ref={formRef}
        className="space-y-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Informations de base */}
        <div className="space-y-4">
          {/* Sélecteur de QCM existant (optionnel) */}
          <Controller
            control={control}
            name="qcmId"
            render={({ field }) => (
              <Select
                isDisabled={isSubmitting || isPolling}
                label="QCM (optionnel - pour pré-remplir les champs)"
                placeholder="Sélectionner un QCM existant"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  field.onChange(selectedKey || undefined);
                }}
              >
                {qcms.map((qcm) => (
                  <SelectItem key={qcm.id}>{qcm.titre}</SelectItem>
                ))}
              </Select>
            )}
          />

          <Input
            label="Titre du QCM"
            placeholder="Ex: QCM de Mathématiques - Chapitre 5"
            {...register("titre")}
            isRequired
            errorMessage={errors.titre?.message}
            isDisabled={isSubmitting || isPolling}
            isInvalid={!!errors.titre}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="matiere"
              render={({ field }) => (
                <Select
                  isDisabled={isSubmitting || isPolling}
                  label="Matière"
                  placeholder="Sélectionner une matière"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    field.onChange(selectedKey || undefined);
                  }}
                >
                  {matieres.map((matiere: { code: string; nom: string }) => (
                    <SelectItem key={matiere.code}>{matiere.nom}</SelectItem>
                  ))}
                </Select>
              )}
            />
            <Controller
              control={control}
              name="niveauId"
              render={({ field }) => (
                <Select
                  isDisabled={isSubmitting || isPolling}
                  label="Niveau"
                  placeholder="Sélectionner un niveau"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    field.onChange(selectedKey || undefined);
                  }}
                >
                  {niveaux.map((niveau) => (
                    <SelectItem key={niveau.code}>{niveau.nom}</SelectItem>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            

            <Controller
              control={control}
              name="mentionId"
              render={({ field }) => (
                <Select
                  isDisabled={isSubmitting || isPolling}
                  label="Mention"
                  placeholder="Sélectionner une mention"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    field.onChange(selectedKey || undefined);
                  }}
                >
                  {mentions.map((mention: { id: string; nom: string }) => (
                    <SelectItem key={mention.id}>{mention.nom}</SelectItem>
                  ))}
                </Select>
              )}
            />

            <Controller
              control={control}
              name="parcoursId"
              render={({ field }) => (
                <Select
                  isDisabled={isSubmitting || isPolling}
                  label="Parcours"
                  placeholder="Sélectionner un parcours"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    field.onChange(selectedKey || undefined);
                  }}
                >
                  {parcours.map((p: { id: string; nom: string }) => (
                    <SelectItem key={p.id}>{p.nom}</SelectItem>
                  ))}
                </Select>
              )}
            />
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Durée estimée (minutes)"
                  type="number"
                  placeholder="60"
                  {...register('duree', { valueAsNumber: true })}
                  isInvalid={!!errors.duree}
                  errorMessage={errors.duree?.message}
                />
              </div> */}

          <div className="flex items-center gap-4">
            <Input
              label="Durée estimée (minutes)"
              placeholder="60"
              type="number"
              {...register("duree", { valueAsNumber: true })}
              errorMessage={errors.duree?.message}
              isDisabled={isSubmitting || isPolling}
              isInvalid={!!errors.duree}
            />
            <Input
              label="Nombre de questions"
              max={20}
              min={1}
              placeholder="10"
              type="number"
              {...register("num_questions", { valueAsNumber: true })}
              errorMessage={errors.num_questions?.message}
              isDisabled={isSubmitting || isPolling}
              isInvalid={!!errors.num_questions}
            />
          </div>
        </div>

        {/* Source de génération */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Source de génération
          </label>
          <Tabs
            isDisabled={isSubmitting || isPolling}
            selectedKey={sourceType}
            variant="bordered"
            onSelectionChange={(key) => {
              if (!isSubmitting && !isPolling) {
                const newSource = key as "text" | "document";

                setSourceType(newSource);
                setValue("source", newSource);
              }
            }}
          >
            <Tab
              key="text"
              title={
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Texte libre</span>
                </div>
              }
            >
              <div className="mt-4">
                <textarea
                  className="w-full min-h-[200px] p-3 rounded-lg border border-default-300 focus:border-primary focus:outline-none resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Collez ici le contenu de votre cours (minimum 50 caractères)..."
                  {...register("text")}
                  disabled={isSubmitting || isPolling}
                />
                {errors.text && (
                  <p className="text-xs text-danger mt-1">
                    {errors.text.message as string}
                  </p>
                )}
                <p className="text-xs text-default-400 mt-2">
                  L'IA analysera ce texte pour générer des questions pertinentes
                </p>
              </div>
            </Tab>

            <Tab
              key="document"
              title={
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Document (PDF/DOCX)</span>
                </div>
              }
            >
              <div className="mt-4">
                <input
                  accept=".pdf,.docx"
                  className="w-full p-3 rounded-lg border border-default-300 focus:border-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="file"
                  {...register("file")}
                  disabled={isSubmitting || isPolling}
                />
                {errors.file && (
                  <p className="text-xs text-danger mt-1">
                    {errors.file.message as string}
                  </p>
                )}
                <p className="text-xs text-default-400 mt-2">
                  Formats acceptés: PDF, DOCX (max 10 Mo)
                </p>
              </div>
            </Tab>
          </Tabs>
        </div>

        {/* Boutons d'action - seulement si pas en modal */}
        {!isModal && (
          <div className="flex items-center gap-3">
            <Button
              color="primary"
              isDisabled={isPolling}
              isLoading={isSubmitting || isPolling}
              startContent={<Sparkles className="w-4 h-4" />}
              type="submit"
            >
              {isPolling ? "Génération en cours..." : "Générer le QCM"}
            </Button>
            <Button
              isDisabled={isPolling}
              type="button"
              variant="flat"
              onPress={() => {
                if (isModal && onClose) {
                  onClose();
                } else {
                  router.back();
                }
              }}
            >
              Annuler
            </Button>
          </div>
        )}
      </form>

      {/* Progression de la génération */}
      {isPolling && taskStatus && (
        <div className="space-y-4 pt-4 border-t border-divider">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <div className="flex-1">
              <p className="font-medium">Génération en cours...</p>
              <p className="text-sm text-default-500">
                {taskStatus.result?.status ||
                  taskStatus.result?.message ||
                  taskStatus.message ||
                  "L'IA analyse votre contenu et génère les questions"}
              </p>
            </div>
          </div>

          <Progress
            showValueLabel
            className="w-full"
            color="primary"
            label="Progression"
            value={progress}
          />

          <div className="flex items-center justify-between text-xs text-default-400">
            <p>
              {taskStatus.status === "PENDING" && "En attente de traitement..."}
              {taskStatus.status === "PROGRESS" &&
                (taskStatus.result?.status || "En cours de traitement...")}
              {taskStatus.status === "SUCCESS" && "Terminé avec succès!"}
            </p>
            {estimatedRemainingSeconds !== null &&
              estimatedRemainingSeconds > 0 && (
                <p className="font-medium text-primary">
                  Temps restant estimé: {Math.ceil(estimatedRemainingSeconds)}s
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
