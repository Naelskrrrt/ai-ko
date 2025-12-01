"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseDate, DateValue } from "@internationalized/date";
import useSWR from "swr";

import type { ProfileData } from "@/shared/types/profile.types";
import type { Matiere } from "@/shared/types/matiere.types";
import type { Niveau } from "@/shared/types/niveau.types";
import type { Mention } from "@/shared/types/mention.types";
import type { Parcours } from "@/shared/types/parcours.types";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { matiereService } from "@/shared/services/api/matiere.service";
import { niveauService } from "@/shared/services/api/niveau.service";
import { mentionService } from "@/shared/services/api/mention.service";
import { parcoursService } from "@/shared/services/api/parcours.service";
import { HorairesInput } from "./HorairesInput";

// Schéma de validation pour les données User
const userSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  telephone: z
    .string()
    .max(20, "Le numéro de téléphone est trop long")
    .optional()
    .or(z.literal("")),
  adresse: z.string().optional().or(z.literal("")),
  dateNaissance: z.string().optional().or(z.literal("")),
});

// Schéma de validation pour les données Enseignant
const enseignantSchema = z.object({
  grade: z.string().optional().or(z.literal("")),
  specialite: z.array(z.string()).optional(), // IDs des matières
  departement: z.string().optional().or(z.literal("")),
  bureau: z.string().optional().or(z.literal("")),
  horairesDisponibilite: z.string().optional().or(z.literal("")),
  dateEmbauche: z.string().optional().or(z.literal("")),
});

// Schéma de validation pour les données Étudiant
const etudiantSchema = z.object({
  anneeAdmission: z.string().optional().or(z.literal("")),
  niveauId: z.string().optional().or(z.literal("")),
  mentionId: z.string().optional().or(z.literal("")),
  parcoursId: z.string().optional().or(z.literal("")),
  matieres: z.array(z.string()).optional(), // IDs des matières
});

type UserFormData = z.infer<typeof userSchema>;
type EnseignantFormData = z.infer<typeof enseignantSchema>;
type EtudiantFormData = z.infer<typeof etudiantSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData | null;
  onSuccess?: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profileData,
  onSuccess,
}: EditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const role = profileData?.role;
  const { updateProfile } = useUpdateProfile(role);

  // Charger les matières disponibles
  const { data: matieres } = useSWR<Matiere[]>(
    "matieres-list",
    () => matiereService.getMatieres(true),
  );

  // Charger les niveaux
  const { data: niveaux } = useSWR<Niveau[]>(
    role === "etudiant" ? "niveaux-list" : null,
    () => niveauService.getNiveaux(true),
  );

  // Charger les mentions
  const { data: mentions } = useSWR<Mention[]>(
    role === "etudiant" ? "mentions-list" : null,
    () => mentionService.getMentions(true),
  );

  // Charger les parcours
  const { data: parcours } = useSWR<Parcours[]>(
    role === "etudiant" ? "parcours-list" : null,
    () => parcoursService.getParcours(true),
  );

  // Formulaire User
  const {
    control: userControl,
    handleSubmit: handleUserSubmit,
    formState: { errors: userErrors },
    reset: resetUser,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: profileData?.name || profileData?.email || "",
      telephone: (profileData as any)?.telephone || "",
      adresse: (profileData as any)?.adresse || "",
      dateNaissance: (profileData as any)?.dateNaissance || "",
    },
  });

  // Formulaire Enseignant
  const {
    control: enseignantControl,
    handleSubmit: handleEnseignantSubmit,
    formState: { errors: enseignantErrors },
    reset: resetEnseignant,
  } = useForm<EnseignantFormData>({
    resolver: zodResolver(enseignantSchema),
    defaultValues: role === "enseignant" && profileData
      ? {
          grade: (profileData as any)?.grade || "",
          specialite: (profileData as any)?.matieres?.map((m: any) => m.id) || [],
          departement: (profileData as any)?.departement || "",
          bureau: (profileData as any)?.bureau || "",
          horairesDisponibilite: (profileData as any)?.horairesDisponibilite || "",
          dateEmbauche: (profileData as any)?.dateEmbauche || "",
        }
      : undefined,
  });

  // Formulaire Étudiant
  const {
    control: etudiantControl,
    handleSubmit: handleEtudiantSubmit,
    formState: { errors: etudiantErrors },
    reset: resetEtudiant,
  } = useForm<EtudiantFormData>({
    resolver: zodResolver(etudiantSchema),
    defaultValues: role === "etudiant" && profileData
      ? {
          anneeAdmission: (profileData as any)?.anneeAdmission || "",
          niveauId: (profileData as any)?.niveauId || "",
          mentionId: (profileData as any)?.mentionId || "",
          parcoursId: (profileData as any)?.parcoursId || "",
          matieres: (profileData as any)?.matieres?.map((m: any) => m.id) || [],
        }
      : undefined,
  });

  // Réinitialiser les formulaires quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen && profileData) {
      resetUser({
        name: profileData.name || profileData.email || "",
        telephone: (profileData as any)?.telephone || "",
        adresse: (profileData as any)?.adresse || "",
        dateNaissance: (profileData as any)?.dateNaissance || "",
      });

      if (role === "enseignant") {
        resetEnseignant({
          grade: (profileData as any)?.grade || "",
          specialite: (profileData as any)?.specialite || "",
          departement: (profileData as any)?.departement || "",
          bureau: (profileData as any)?.bureau || "",
          horairesDisponibilite: (profileData as any)?.horairesDisponibilite || "",
          dateEmbauche: (profileData as any)?.dateEmbauche || "",
        });
      }

      if (role === "etudiant") {
        resetEtudiant({
          anneeAdmission: (profileData as any)?.anneeAdmission || "",
          niveauId: (profileData as any)?.niveauId || "",
          mentionId: (profileData as any)?.mentionId || "",
          parcoursId: (profileData as any)?.parcoursId || "",
          matieres: (profileData as any)?.matieres?.map((m: any) => m.id) || [],
        });
      }
    }
  }, [isOpen, profileData, role, resetUser, resetEnseignant, resetEtudiant]);

  const onSubmit = async (
    userData: UserFormData,
    enseignantData?: EnseignantFormData,
    etudiantData?: EtudiantFormData,
  ) => {
    try {
      setIsSubmitting(true);

      await updateProfile({
        user: userData,
        enseignant: role === "enseignant" ? enseignantData : undefined,
        etudiant: role === "etudiant" ? etudiantData : undefined,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      // L'erreur est déjà gérée dans useUpdateProfile
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async () => {
    // Valider et soumettre le formulaire User
    handleUserSubmit(async (userData) => {
      if (role === "enseignant") {
        handleEnseignantSubmit(async (enseignantData) => {
          await onSubmit(userData, enseignantData);
        })();
      } else if (role === "etudiant") {
        handleEtudiantSubmit(async (etudiantData) => {
          await onSubmit(userData, undefined, etudiantData);
        })();
      } else {
        await onSubmit(userData);
      }
    })();
  };

  const formatDateForPicker = (dateString?: string | null): DateValue | null => {
    if (!dateString) return null;
    try {
      return parseDate(dateString.split("T")[0]);
    } catch {
      return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Modifier le profil
            </ModalHeader>
            <ModalBody>
              <form id="profile-form" onSubmit={(e) => e.preventDefault()}>
                {/* Section Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Informations personnelles
                  </h3>

                  <Controller
                    name="name"
                    control={userControl}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Nom complet"
                        placeholder="Votre nom complet"
                        errorMessage={userErrors.name?.message}
                        isInvalid={!!userErrors.name}
                      />
                    )}
                  />

                  <Controller
                    name="telephone"
                    control={userControl}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        label="Téléphone"
                        placeholder="+33 6 12 34 56 78"
                        errorMessage={userErrors.telephone?.message}
                        isInvalid={!!userErrors.telephone}
                      />
                    )}
                  />

                  <Controller
                    name="adresse"
                    control={userControl}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        label="Adresse"
                        placeholder="Votre adresse complète"
                        errorMessage={userErrors.adresse?.message}
                        isInvalid={!!userErrors.adresse}
                        minRows={2}
                      />
                    )}
                  />

                  <Controller
                    name="dateNaissance"
                    control={userControl}
                    render={({ field }) => (
                      <DatePicker
                        label="Date de naissance"
                        value={formatDateForPicker(field.value)}
                        onChange={(date) => {
                          field.onChange(
                            date ? date.toString() : null,
                          );
                        }}
                        errorMessage={userErrors.dateNaissance?.message}
                        isInvalid={!!userErrors.dateNaissance}
                        showMonthAndYearPickers 
                      />
                    )}
                  />
                </div>

                {/* Section Informations professionnelles (Enseignant) */}
                {role === "enseignant" && (
                  <>
                    <Divider className="my-6" />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Informations professionnelles
                      </h3>

                      <Controller
                        name="grade"
                        control={enseignantControl}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            label="Grade"
                            placeholder="Maître de conférence, Professeur, etc."
                            errorMessage={enseignantErrors.grade?.message}
                            isInvalid={!!enseignantErrors.grade}
                          />
                        )}
                      />

                      <Controller
                        name="specialite"
                        control={enseignantControl}
                        render={({ field }) => (
                          <Select
                            label="Spécialités (Matières enseignées)"
                            placeholder="Sélectionnez vos matières"
                            selectedKeys={field.value || []}
                            selectionMode="multiple"
                            errorMessage={enseignantErrors.specialite?.message}
                            isInvalid={!!enseignantErrors.specialite}
                            onSelectionChange={(keys) => {
                              field.onChange(Array.from(keys) as string[]);
                            }}
                          >
                            {(matieres || []).map((matiere) => (
                              <SelectItem key={matiere.id}>
                                {matiere.nom}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        name="departement"
                        control={enseignantControl}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            label="Département"
                            placeholder="Votre département"
                            errorMessage={enseignantErrors.departement?.message}
                            isInvalid={!!enseignantErrors.departement}
                          />
                        )}
                      />

                      <Controller
                        name="bureau"
                        control={enseignantControl}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            label="Bureau"
                            placeholder="Numéro de bureau"
                            errorMessage={enseignantErrors.bureau?.message}
                            isInvalid={!!enseignantErrors.bureau}
                          />
                        )}
                      />

                      <Controller
                        name="horairesDisponibilite"
                        control={enseignantControl}
                        render={({ field }) => (
                          <HorairesInput
                            value={field.value}
                            errorMessage={
                              enseignantErrors.horairesDisponibilite?.message
                            }
                            isInvalid={!!enseignantErrors.horairesDisponibilite}
                            onChange={field.onChange}
                          />
                        )}
                      />

                      <Controller
                        name="dateEmbauche"
                        control={enseignantControl}
                        render={({ field }) => (
                          <DatePicker
                            label="Date d'embauche"
                            value={formatDateForPicker(field.value)}
                            onChange={(date) => {
                              field.onChange(
                                date ? date.toString() : null,
                              );
                            }}
                            errorMessage={enseignantErrors.dateEmbauche?.message}
                            isInvalid={!!enseignantErrors.dateEmbauche}
                            showMonthAndYearPickers 
                          />
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Section Informations académiques (Étudiant) */}
                {role === "etudiant" && (
                  <>
                    <Divider className="my-6" />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Informations académiques
                      </h3>

                      <Controller
                        name="anneeAdmission"
                        control={etudiantControl}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            label="Année d'admission"
                            placeholder="2024-2025"
                            errorMessage={etudiantErrors.anneeAdmission?.message}
                            isInvalid={!!etudiantErrors.anneeAdmission}
                          />
                        )}
                      />

                      <Controller
                        name="niveauId"
                        control={etudiantControl}
                        render={({ field }) => (
                          <Select
                            label="Niveau"
                            placeholder="Sélectionner un niveau"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              field.onChange(selected || null);
                            }}
                            errorMessage={etudiantErrors.niveauId?.message}
                            isInvalid={!!etudiantErrors.niveauId}
                          >
                            {(niveaux || []).map((niveau) => (
                              <SelectItem key={niveau.id}>
                                {niveau.nom}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        name="mentionId"
                        control={etudiantControl}
                        render={({ field }) => (
                          <Select
                            label="Mention"
                            placeholder="Sélectionner une mention"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              field.onChange(selected || null);
                            }}
                            errorMessage={etudiantErrors.mentionId?.message}
                            isInvalid={!!etudiantErrors.mentionId}
                          >
                            {(mentions || []).map((mention) => (
                              <SelectItem key={mention.id}>
                                {mention.nom}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        name="parcoursId"
                        control={etudiantControl}
                        render={({ field }) => (
                          <Select
                            label="Parcours"
                            placeholder="Sélectionner un parcours"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              field.onChange(selected || null);
                            }}
                            errorMessage={etudiantErrors.parcoursId?.message}
                            isInvalid={!!etudiantErrors.parcoursId}
                          >
                            {(parcours || []).map((p) => (
                              <SelectItem key={p.id}>
                                {p.nom}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        name="matieres"
                        control={etudiantControl}
                        render={({ field }) => (
                          <Select
                            label="Matières"
                            placeholder="Sélectionner vos matières"
                            selectionMode="multiple"
                            selectedKeys={new Set(field.value || [])}
                            onSelectionChange={(keys) => {
                              field.onChange(Array.from(keys));
                            }}
                            errorMessage={etudiantErrors.matieres?.message}
                            isInvalid={!!etudiantErrors.matieres}
                          >
                            {(matieres || []).map((matiere) => (
                              <SelectItem key={matiere.id}>
                                {matiere.nom}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />
                    </div>
                  </>
                )}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                onPress={handleFormSubmit}
                isLoading={isSubmitting}
              >
                Enregistrer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

