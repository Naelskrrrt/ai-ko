"use client";

import type { SessionFormData, Niveau } from "../../types/enseignant.types";
import type { Mention } from "@/shared/types/mention.types";
import type { Parcours } from "@/shared/types/parcours.types";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Textarea } from "@heroui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar } from "lucide-react";
import {
  parseZonedDateTime,
  getLocalTimeZone,
  ZonedDateTime,
} from "@internationalized/date";
import useSWR from "swr";

import { sessionService } from "../../services/session.service";
import { qcmService } from "../../services/qcm.service";
import { CreateQCMModal } from "../qcm/CreateQCMModal";

import { profileService } from "@/shared/services/api/profile.service";
import { useAuth } from "@/core/providers/AuthProvider";
import { mentionService } from "@/shared/services/api/mention.service";
import { parcoursService } from "@/shared/services/api/parcours.service";
import { NIVEAUX_STATIQUES } from "@/shared/types/niveau.types";

// Schéma de validation Zod
const sessionSchema = z
  .object({
    titre: z
      .string()
      .min(3, "Le titre doit contenir au moins 3 caractères")
      .max(200),
    description: z.string().optional(),
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().min(1, "La date de fin est requise"),
    dureeMinutes: z
      .number()
      .min(5, "La durée minimale est de 5 minutes")
      .max(480, "La durée maximale est de 480 minutes"),
    tentativesMax: z
      .number()
      .min(1, "Le nombre de tentatives doit être au moins 1")
      .optional(),
    melangeQuestions: z.boolean().optional(),
    melangeOptions: z.boolean().optional(),
    afficherCorrection: z.boolean().optional(),
    notePassage: z
      .number()
      .min(0, "La note de passage doit être au moins 0")
      .max(100, "La note de passage ne peut pas dépasser 100")
      .optional(),
    qcmId: z.string().min(1, "Veuillez sélectionner un QCM"),
    classeId: z.string().optional(),
    niveauId: z.string().optional(),
    mentionId: z.string().optional(),
    parcoursId: z.string().optional(),
  })
  .refine(
    (data) => {
      const dateDebut = new Date(data.dateDebut);
      const dateFin = new Date(data.dateFin);

      return dateFin > dateDebut;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["dateFin"],
    },
  );

type SessionFormDataInput = z.infer<typeof sessionSchema>;

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefillQcmId?: string;
}

export function CreateSessionModal({
  isOpen,
  onClose,
  onSuccess,
  prefillQcmId,
}: CreateSessionModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const {
    isOpen: isQCMOpen,
    onOpen: onQCMOpen,
    onClose: onQCMClose,
  } = useDisclosure();

  // Récupérer le profil enseignant pour obtenir niveaux, mentions, parcours
  const { data: profileData } = useSWR(
    user?.role === "enseignant"
      ? ["profile-enseignant-session", "enseignant"]
      : null,
    async () => {
      return await profileService.getMyProfile("enseignant");
    },
  );

  // Utiliser les niveaux statiques (L1, L2, L3, M1, M2)
  const niveaux = React.useMemo(() => {
    return NIVEAUX_STATIQUES as Niveau[];
  }, []);

  // Charger les mentions depuis le profil ou depuis l'API
  const { data: mentionsFromProfile } = useSWR(
    user?.role === "enseignant" && profileData && "mentions" in profileData
      ? ["mentions-profile-session", profileData.id]
      : null,
    async () => {
      if (
        profileData &&
        "mentions" in profileData &&
        profileData.mentions &&
        profileData.mentions.length > 0
      ) {
        return profileData.mentions as Mention[];
      }

      return null;
    },
  );

  const { data: allMentions } = useSWR(["mentions-all-session"], async () => {
    return await mentionService.getMentions(true); // Seulement les actives
  });

  const mentions = React.useMemo(() => {
    // Utiliser les mentions du profil s'ils existent, sinon toutes les mentions actives
    if (mentionsFromProfile && mentionsFromProfile.length > 0) {
      return mentionsFromProfile;
    }

    return (allMentions || []) as Mention[];
  }, [mentionsFromProfile, allMentions]);

  // Charger les parcours depuis le profil ou depuis l'API
  const { data: parcoursFromProfile } = useSWR(
    user?.role === "enseignant" && profileData && "parcours" in profileData
      ? ["parcours-profile-session", profileData.id]
      : null,
    async () => {
      if (profileData && "parcours" in profileData && profileData.parcours) {
        const parcours = profileData.parcours;

        if (Array.isArray(parcours) && parcours.length > 0) {
          return parcours;
        }
      }

      return null;
    },
  );

  const { data: allParcours } = useSWR(["parcours-all-session"], async () => {
    return await parcoursService.getParcours(true); // Seulement les actifs
  });

  const parcours = React.useMemo(() => {
    // Utiliser les parcours du profil s'ils existent, sinon tous les parcours actifs
    if (parcoursFromProfile && parcoursFromProfile.length > 0) {
      return parcoursFromProfile;
    }

    return (allParcours || []) as Parcours[];
  }, [parcoursFromProfile, allParcours]);

  // Récupérer les QCMs (publiés + le QCM pré-rempli si fourni)
  const { data: qcmsData, mutate: mutateQCMs } = useSWR(
    ["qcms-for-session", prefillQcmId],
    async () => {
      const published = await qcmService.getQCMs({
        status: "published",
        limit: 100,
      });

      // Si un QCM est pré-rempli, s'assurer qu'il est dans la liste
      if (prefillQcmId) {
        try {
          const prefilledQcm = await qcmService.getQCMById(prefillQcmId);
          // Vérifier si le QCM pré-rempli est déjà dans la liste
          const exists = published.data.some((q) => q.id === prefillQcmId);

          if (!exists && prefilledQcm) {
            // Ajouter le QCM pré-rempli à la liste même s'il n'est pas publié
            return {
              data: [prefilledQcm, ...published.data],
              total: published.total + 1,
            };
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("Impossible de charger le QCM pré-rempli:", error);
        }
      }

      return published;
    },
  );
  const qcms = qcmsData?.data || [];

  // Formulaire avec React Hook Form + Zod
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SessionFormDataInput>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      melangeQuestions: false,
      melangeOptions: false,
      afficherCorrection: false,
      tentativesMax: 1,
      notePassage: 50,
      dureeMinutes: 60,
      qcmId: prefillQcmId || "",
    },
  });

  // Pré-remplir le QCM si fourni
  React.useEffect(() => {
    if (prefillQcmId && isOpen) {
      setValue("qcmId", prefillQcmId);
    }
  }, [prefillQcmId, isOpen, setValue]);

  // Surveiller le QCM sélectionné et les critères pour détecter les différences
  const selectedQcmId = watch("qcmId");
  const selectedNiveauId = watch("niveauId");
  const selectedMentionId = watch("mentionId");
  const selectedParcoursId = watch("parcoursId");

  const selectedQcm = React.useMemo(() => {
    if (!selectedQcmId) return null;

    return qcms.find((q) => q.id === selectedQcmId);
  }, [selectedQcmId, qcms]);

  // Vérifier si les critères du QCM diffèrent de ceux du formulaire
  const hasMismatch = React.useMemo(() => {
    if (!selectedQcm) return false;

    return (
      (selectedQcm.niveauId &&
        selectedNiveauId &&
        selectedQcm.niveauId !== selectedNiveauId) ||
      (selectedQcm.mentionId &&
        selectedMentionId &&
        selectedQcm.mentionId !== selectedMentionId) ||
      (selectedQcm.parcoursId &&
        selectedParcoursId &&
        selectedQcm.parcoursId !== selectedParcoursId)
    );
  }, [selectedQcm, selectedNiveauId, selectedMentionId, selectedParcoursId]);

  // Pré-remplir les critères depuis le QCM sélectionné si disponibles
  React.useEffect(() => {
    if (selectedQcm && isOpen) {
      if (selectedQcm.niveauId && !selectedNiveauId) {
        setValue("niveauId", selectedQcm.niveauId);
      }

      if (selectedQcm.mentionId && !selectedMentionId) {
        setValue("mentionId", selectedQcm.mentionId);
      }

      if (selectedQcm.parcoursId && !selectedParcoursId) {
        setValue("parcoursId", selectedQcm.parcoursId);
      }
    }
  }, [
    selectedQcm,
    isOpen,
    setValue,
    selectedNiveauId,
    selectedMentionId,
    selectedParcoursId,
  ]);

  const onSubmit = async (data: SessionFormDataInput) => {
    setIsSubmitting(true);
    try {
      const sessionData: SessionFormData = {
        titre: data.titre,
        description: data.description,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        dureeMinutes: data.dureeMinutes,
        tentativesMax: data.tentativesMax,
        melangeQuestions: data.melangeQuestions ?? false,
        melangeOptions: data.melangeOptions ?? false,
        afficherCorrection: data.afficherCorrection ?? false,
        notePassage: data.notePassage ?? 50,
        qcmId: data.qcmId,
        classeId: data.classeId,
        niveauId: data.niveauId,
        mentionId: data.mentionId,
        parcoursId: data.parcoursId,
        status: "programmee",
      };

      await sessionService.createSession(sessionData);
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur lors de la création de la session:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la création de la session",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreateNewQuiz = () => {
    onQCMOpen();
  };

  const handleQCMCreated = (qcmId: string) => {
    // Mettre à jour la liste des QCMs
    mutateQCMs();
    // Sélectionner automatiquement le QCM créé
    setValue("qcmId", qcmId);
    onQCMClose();
  };

  return (
    <>
      <Modal
        classNames={{
          base: "bg-background max-h-[90vh]",
          header: "border-b border-divider flex-shrink-0",
          body: "py-6 overflow-y-auto",
          footer: "border-t border-divider flex-shrink-0",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="3xl"
        onClose={handleClose}
      >
        <ModalContent className="max-h-[90vh] flex flex-col">
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Créer une nouvelle session
              </h2>
            </div>
          </ModalHeader>

          <form
            className="flex flex-col flex-1 overflow-hidden"
            onSubmit={handleSubmit(onSubmit)}
          >
            <ModalBody className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <Input
                    label="Titre de la session"
                    placeholder="Ex: Examen de Mathématiques - Session 1"
                    {...register("titre")}
                    isRequired
                    errorMessage={errors.titre?.message as string}
                    isInvalid={!!errors.titre}
                  />

                  <Textarea
                    label="Description"
                    placeholder="Description de la session (optionnel)"
                    {...register("description")}
                    errorMessage={errors.description?.message as string}
                    isInvalid={!!errors.description}
                    minRows={2}
                  />

                  {/* Sélection du QCM */}
                  <div className="space-y-2">
                    <Controller
                      control={control}
                      name="qcmId"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Select
                            isRequired
                            errorMessage={errors.qcmId?.message as string}
                            isInvalid={!!errors.qcmId}
                            label="QCM"
                            placeholder="Sélectionner un QCM"
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
                          <Button
                            className="w-full"
                            color="primary"
                            size="sm"
                            startContent={<Plus className="w-3 h-3" />}
                            variant="light"
                            onPress={handleCreateNewQuiz}
                          >
                            Créer un nouveau quiz
                          </Button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Avertissement si les critères diffèrent */}
                  {hasMismatch && (
                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                      <p className="text-sm text-warning-800">
                        ⚠️ Les critères sélectionnés (Niveau, Mention, Parcours)
                        diffèrent de ceux du QCM sélectionné. Vous pouvez
                        continuer, mais cela peut créer une incohérence.
                      </p>
                    </div>
                  )}

                  {/* Sélection Niveau, Mention, Parcours */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Controller
                      control={control}
                      name="niveauId"
                      render={({ field }) => (
                        <Select
                          isDisabled={!!selectedQcm || isSubmitting}
                          label="Niveau"
                          placeholder="Sélectionner un niveau"
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string;

                            field.onChange(selectedKey || undefined);
                          }}
                        >
                          {niveaux.map((niveau: Niveau) => (
                            <SelectItem key={niveau.code}>
                              {niveau.nom}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />

                    <Controller
                      control={control}
                      name="mentionId"
                      render={({ field }) => (
                        <Select
                          isDisabled={!!selectedQcm || isSubmitting}
                          label="Mention"
                          placeholder="Sélectionner une mention"
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string;

                            field.onChange(selectedKey || undefined);
                          }}
                        >
                          {mentions.map((mention: Mention) => (
                            <SelectItem key={mention.id}>
                              {mention.nom}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />

                    <Controller
                      control={control}
                      name="parcoursId"
                      render={({ field }) => (
                        <Select
                          isDisabled={!!selectedQcm || isSubmitting}
                          label="Parcours"
                          placeholder="Sélectionner un parcours"
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string;

                            field.onChange(selectedKey || undefined);
                          }}
                        >
                          {parcours.map((p: Parcours) => (
                            <SelectItem key={p.id}>{p.nom}</SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Dates et durée */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="dateDebut"
                    render={({ field }) => {
                      // Convertir la chaîne datetime-local en ZonedDateTime
                      const getValue = () => {
                        if (!field.value) return null;
                        try {
                          // Format attendu: YYYY-MM-DDTHH:mm
                          // Convertir en format ISO avec timezone pour parseZonedDateTime
                          const timeZone = getLocalTimeZone();
                          const isoString = `${field.value}:00[${timeZone}]`;

                          return parseZonedDateTime(isoString);
                        } catch {
                          return null;
                        }
                      };

                      return (
                        <DatePicker
                          isRequired
                          errorMessage={errors.dateDebut?.message as string}
                          granularity="minute"
                          isInvalid={!!errors.dateDebut}
                          minValue={(() => {
                            // aujourd'hui à la minute près, dans le fuseau local
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(now.getDate()).padStart(2, "0");
                            const hour = String(now.getHours()).padStart(
                              2,
                              "0",
                            );
                            const minute = String(now.getMinutes()).padStart(
                              2,
                              "0",
                            );
                            const timeZone = getLocalTimeZone();

                            // Création d'une string ISO sans les secondes, avec timeZone
                            return parseZonedDateTime(
                              `${year}-${month}-${day}T${hour}:${minute}:00[${timeZone}]`,
                            );
                          })()}
                          onChange={(value: ZonedDateTime | null) => {
                            if (value) {
                              // Format: YYYY-MM-DDTHH:mm
                              const formatted = `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}T${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;

                              field.onChange(formatted);
                            } else {
                              field.onChange("");
                            }
                          }}
                          label="Date et heure de début"
                          // selectorIcon={<Calendar className="w-4 h-4" />}
                          value={getValue()}
                        />
                      );
                    }}
                  />
                  <Controller
                    control={control}
                    name="dateFin"
                    render={({ field }) => {
                      // Convertir la chaîne datetime-local en ZonedDateTime
                      const getValue = () => {
                        if (!field.value) return null;
                        try {
                          // Format attendu: YYYY-MM-DDTHH:mm
                          // Convertir en format ISO avec timezone pour parseZonedDateTime
                          const timeZone = getLocalTimeZone();
                          const isoString = `${field.value}:00[${timeZone}]`;

                          return parseZonedDateTime(isoString);
                        } catch {
                          return null;
                        }
                      };

                      return (
                        <DatePicker
                          isRequired
                          errorMessage={errors.dateFin?.message as string}
                          granularity="minute"
                          isInvalid={!!errors.dateFin}
                          minValue={(() => {
                            // On ne peut pas choisir une date fin antérieure à la date de début (si saisie)
                            if (field.value) {
                              try {
                                // Cette instance de field est pour dateFin, mais on veut la dateDebut du form
                                const dateDebut =
                                  control._formValues?.dateDebut;

                                if (dateDebut) {
                                  const timeZone = getLocalTimeZone();

                                  return parseZonedDateTime(
                                    `${dateDebut}:00[${timeZone}]`,
                                  );
                                }
                              } catch {
                                // fallback à aucun minimum
                                return undefined;
                              }
                            } else {
                              // On veut bloquer toute date avant la dateDebut, ou la date actuelle si pas de dateDebut
                              const dateDebut = control._formValues?.dateDebut;
                              const timeZone = getLocalTimeZone();

                              if (dateDebut) {
                                try {
                                  return parseZonedDateTime(
                                    `${dateDebut}:00[${timeZone}]`,
                                  );
                                } catch {
                                  // fallback possible plus bas
                                }
                              }
                              // sinon on fallback à "maintenant" comme dans dateDebut
                              const now = new Date();
                              const year = now.getFullYear();
                              const month = String(now.getMonth() + 1).padStart(
                                2,
                                "0",
                              );
                              const day = String(now.getDate()).padStart(
                                2,
                                "0",
                              );
                              const hour = String(now.getHours()).padStart(
                                2,
                                "0",
                              );
                              const minute = String(now.getMinutes()).padStart(
                                2,
                                "0",
                              );

                              return parseZonedDateTime(
                                `${year}-${month}-${day}T${hour}:${minute}:00[${timeZone}]`,
                              );
                            }
                          })()}
                          onChange={(value: ZonedDateTime | null) => {
                            if (value) {
                              // Format: YYYY-MM-DDTHH:mm
                              const formatted = `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}T${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;

                              field.onChange(formatted);
                            } else {
                              field.onChange("");
                            }
                          }}
                          label="Date et heure de fin"
                          // selectorIcon={<Calendar className="w-4 h-4" />}
                          value={getValue()}
                        />
                      );
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Durée (minutes)"
                    max={480}
                    min={5}
                    placeholder="60"
                    type="number"
                    {...register("dureeMinutes", { valueAsNumber: true })}
                    isRequired
                    errorMessage={errors.dureeMinutes?.message as string}
                    isInvalid={!!errors.dureeMinutes}
                  />

                  <Input
                    label="Nombre de tentatives maximum"
                    min={1}
                    placeholder="1"
                    type="number"
                    {...register("tentativesMax", { valueAsNumber: true })}
                    errorMessage={errors.tentativesMax?.message as string}
                    isInvalid={!!errors.tentativesMax}
                  />
                </div>

                {/* Options de configuration */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-default-700">
                    Options de configuration
                  </h3>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name="melangeQuestions"
                      render={({ field }) => (
                        <Switch
                          isSelected={field.value}
                          onValueChange={field.onChange}
                        >
                          Mélanger les questions
                        </Switch>
                      )}
                    />

                    <Controller
                      control={control}
                      name="melangeOptions"
                      render={({ field }) => (
                        <Switch
                          isSelected={field.value}
                          onValueChange={field.onChange}
                        >
                          Mélanger les options de réponse
                        </Switch>
                      )}
                    />

                    {/* <Controller
                      control={control}
                      name="afficherCorrection"
                      render={({ field }) => (
                        <Switch
                          isSelected={field.value}
                          onValueChange={field.onChange}
                        >
                          Afficher la correction après la session
                        </Switch>
                      )}
                    /> */}
                  </div>
                </div>

                {/* Note de passage */}
                <Input
                  label="Note de passage (%)"
                  max={100}
                  min={0}
                  placeholder="50"
                  type="number"
                  {...register("notePassage", { valueAsNumber: true })}
                  description="Note minimale requise pour réussir la session (en pourcentage)"
                  errorMessage={errors.notePassage?.message as string}
                  isInvalid={!!errors.notePassage}
                />
              </div>
            </ModalBody>

            <ModalFooter className="flex justify-end gap-2">
              <Button
                isDisabled={isSubmitting}
                variant="light"
                onPress={handleClose}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                isLoading={isSubmitting}
                startContent={<Plus className="w-4 h-4" />}
                type="submit"
              >
                Créer la session
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal de création de QCM */}
      <CreateQCMModal
        isOpen={isQCMOpen}
        onClose={onQCMClose}
        onSuccess={handleQCMCreated}
      />
    </>
  );
}
