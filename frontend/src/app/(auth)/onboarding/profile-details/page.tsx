"use client";

import type { Etablissement } from "@/shared/types/etablissement.types";
import type { Niveau } from "@/shared/types/niveau.types";
import type { Mention } from "@/shared/types/mention.types";
import type { Parcours } from "@/shared/types/parcours.types";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";

import { etablissementService } from "@/shared/services/api/etablissement.service";
import { niveauService } from "@/shared/services/api/niveau.service";
import { mentionService } from "@/shared/services/api/mention.service";
import { parcoursService } from "@/shared/services/api/parcours.service";

// Schémas de validation
const etudiantSchema = z.object({
  numeroEtudiant: z
    .string()
    .min(3, "Le numéro étudiant doit contenir au moins 3 caractères")
    .max(50, "Le numéro étudiant ne peut pas dépasser 50 caractères")
    .regex(
      /^[A-Za-z0-9\-_\s]+$/,
      "Le numéro étudiant ne peut contenir que des lettres, chiffres, tirets et espaces",
    ),
  etablissementId: z
    .string()
    .min(1, "L'établissement est requis")
    .uuid("Sélectionnez un établissement valide"),
  niveauId: z
    .string()
    .min(1, "Le niveau est requis")
    .uuid("Sélectionnez un niveau valide"),
  mentionId: z
    .string()
    .min(1, "La mention est requise")
    .uuid("Sélectionnez une mention valide"),
  parcoursId: z
    .string()
    .min(1, "Le parcours est requis")
    .uuid("Sélectionnez un parcours valide"),
  anneeAdmission: z
    .string()
    .min(1, "L'année d'admission est requise")
    .regex(/^\d{4}-\d{4}$/, "Format attendu : 2024-2025"),
  telephone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(\+?[0-9\s\-]{8,20})?$/.test(val),
      "Numéro de téléphone invalide",
    ),
  adresse: z
    .string()
    .max(255, "L'adresse ne peut pas dépasser 255 caractères")
    .optional(),
  dateNaissance: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const minAge = 15; // Âge minimum
      const maxAge = 100; // Âge maximum
      const age =
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      return age >= minAge && age <= maxAge;
    }, "La date de naissance doit correspondre à un âge entre 15 et 100 ans"),
});

const enseignantSchema = z.object({
  numeroEnseignant: z
    .string()
    .min(3, "Le numéro enseignant doit contenir au moins 3 caractères")
    .max(50, "Le numéro enseignant ne peut pas dépasser 50 caractères")
    .regex(
      /^[A-Za-z0-9\-_\s]+$/,
      "Le numéro enseignant ne peut contenir que des lettres, chiffres, tirets et espaces",
    ),
  etablissementId: z
    .string()
    .min(1, "L'établissement est requis")
    .uuid("Sélectionnez un établissement valide"),
  grade: z
    .string()
    .max(100, "Le grade ne peut pas dépasser 100 caractères")
    .optional(),
  specialite: z
    .string()
    .max(200, "La spécialité ne peut pas dépasser 200 caractères")
    .optional(),
  departement: z
    .string()
    .max(100, "Le département ne peut pas dépasser 100 caractères")
    .optional(),
  bureau: z
    .string()
    .max(50, "Le bureau ne peut pas dépasser 50 caractères")
    .optional(),
  dateEmbauche: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();

      return date <= now; // La date d'embauche ne peut pas être dans le futur
    }, "La date d'embauche ne peut pas être dans le futur"),
  telephone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(\+?[0-9\s\-]{8,20})?$/.test(val),
      "Numéro de téléphone invalide",
    ),
  adresse: z
    .string()
    .max(255, "L'adresse ne peut pas dépasser 255 caractères")
    .optional(),
});

type EtudiantFormValues = z.infer<typeof etudiantSchema>;
type EnseignantFormValues = z.infer<typeof enseignantSchema>;

function ProfileDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") as "etudiant" | "enseignant";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMentions, setLoadingMentions] = useState(false);
  const [loadingParcours, setLoadingParcours] = useState(false);

  // Charger les données de référence
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoadingData(true);
        const [etabRes, niveauxRes, mentionsRes, parcoursRes] =
          await Promise.all([
            etablissementService.getEtablissements(true),
            niveauService.getNiveaux(true),
            mentionService.getMentions(true),
            parcoursService.getParcours(true),
          ]);

        setEtablissements(etabRes);
        setNiveaux(niveauxRes);
        setMentions(mentionsRes);
        setParcours(parcoursRes);
      } catch (err) {
        console.error(
          "[Onboarding] Erreur chargement données de référence:",
          err,
        );
        setError(
          "Erreur lors du chargement des données de référence. Vérifiez votre connexion.",
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadReferenceData();
  }, []);

  // Vérifier que le rôle est présent et cohérent avec le localStorage
  useEffect(() => {
    if (!role || (role !== "etudiant" && role !== "enseignant")) {
      router.push("/onboarding/role-selection");

      return;
    }

    // Vérifier la cohérence avec le localStorage
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("onboarding_role");

      if (storedRole && storedRole !== role) {
        // Le rôle URL ne correspond pas au localStorage - mettre à jour le localStorage
        localStorage.setItem("onboarding_role", role);
        // Réinitialiser les données précédentes car le rôle a changé
        localStorage.removeItem("onboarding_details");
        localStorage.removeItem("onboarding_names");
        localStorage.removeItem("onboarding_matieres");
      } else if (!storedRole) {
        // Pas de rôle stocké, le sauvegarder
        localStorage.setItem("onboarding_role", role);
      }
    }
  }, [role, router]);

  const schema = role === "etudiant" ? etudiantSchema : enseignantSchema;

  // Récupérer les données existantes depuis localStorage si elles existent
  const getDefaultValues = () => {
    // Vérifier que nous sommes côté client
    if (typeof window !== "undefined") {
      const storedDetails = localStorage.getItem("onboarding_details");

      if (storedDetails) {
        try {
          return JSON.parse(storedDetails);
        } catch {
          // Ignore parsing errors
        }
      }
    }

    // Valeurs par défaut si aucune donnée stockée
    return role === "etudiant"
      ? {
          numeroEtudiant: "",
          etablissementId: "",
          niveauId: "",
          mentionId: "",
          parcoursId: "",
          anneeAdmission: "",
          telephone: "",
          adresse: "",
          dateNaissance: "",
        }
      : {
          numeroEnseignant: "",
          etablissementId: "",
          grade: "",
          specialite: "",
          departement: "",
          bureau: "",
          dateEmbauche: "",
          telephone: "",
          adresse: "",
        };
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  // Charger les valeurs pré-remplies au montage du composant
  useEffect(() => {
    // Vérifier que nous sommes côté client
    if (typeof window !== "undefined") {
      const storedDetails = localStorage.getItem("onboarding_details");

      if (storedDetails) {
        try {
          const data = JSON.parse(storedDetails);

          reset(data);
        } catch {
          // Ignore loading errors
        }
      }
    }
  }, [reset]);

  // Filtrer les mentions et parcours selon l'établissement sélectionné
  const selectedEtablissementId = watch("etablissementId");
  const selectedMentionId = watch("mentionId");

  // Réinitialiser mentionId et parcoursId quand l'établissement change
  const [previousEtablissementId, setPreviousEtablissementId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const loadFilteredData = async () => {
      if (selectedEtablissementId) {
        // Si l'établissement a changé, réinitialiser les champs dépendants
        if (
          previousEtablissementId &&
          previousEtablissementId !== selectedEtablissementId
        ) {
          reset((values: any) => ({
            ...values,
            mentionId: "",
            parcoursId: "",
          }));
          setParcours([]);
        }
        setPreviousEtablissementId(selectedEtablissementId);

        try {
          setLoadingMentions(true);
          const mentionsFiltered = await mentionService.getByEtablissement(
            selectedEtablissementId,
          );

          setMentions(mentionsFiltered);
        } catch (err) {
          console.error(
            "[Onboarding] Erreur chargement mentions filtrées:",
            err,
          );
        } finally {
          setLoadingMentions(false);
        }
      }
    };

    loadFilteredData();
  }, [selectedEtablissementId, previousEtablissementId, reset]);

  const [previousMentionId, setPreviousMentionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const loadFilteredParcours = async () => {
      if (selectedMentionId) {
        // Si la mention a changé, réinitialiser le parcours
        if (previousMentionId && previousMentionId !== selectedMentionId) {
          reset((values: any) => ({
            ...values,
            parcoursId: "",
          }));
        }
        setPreviousMentionId(selectedMentionId);

        try {
          setLoadingParcours(true);
          const parcoursFiltered =
            await parcoursService.getByMention(selectedMentionId);

          setParcours(parcoursFiltered);
        } catch (err) {
          console.error(
            "[Onboarding] Erreur chargement parcours filtrés:",
            err,
          );
        } finally {
          setLoadingParcours(false);
        }
      }
    };

    loadFilteredParcours();
  }, [selectedMentionId, previousMentionId, reset]);

  const onSubmit = async (data: EtudiantFormValues | EnseignantFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Stocker les données dans le localStorage (persiste après fermeture)
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_details", JSON.stringify(data));

        // Stocker également les noms pour l'affichage dans la confirmation
        const names: Record<string, string> = {};

        if ("etablissementId" in data && data.etablissementId) {
          const etab = etablissements.find(
            (e) => e.id === data.etablissementId,
          );

          if (etab) names.etablissementNom = etab.nom;
        }

        if ("niveauId" in data && data.niveauId) {
          const niveau = niveaux.find((n) => n.id === data.niveauId);

          if (niveau) names.niveauNom = niveau.nom;
        }

        if ("mentionId" in data && data.mentionId) {
          const mention = mentions.find((m) => m.id === data.mentionId);

          if (mention) names.mentionNom = mention.nom;
        }

        if ("parcoursId" in data && data.parcoursId) {
          const parcoursItem = parcours.find((p) => p.id === data.parcoursId);

          if (parcoursItem) names.parcoursNom = parcoursItem.nom;
        }

        localStorage.setItem("onboarding_names", JSON.stringify(names));
      }

      router.push("/onboarding/select-matieres");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde des données");
    } finally {
      setIsLoading(false);
    }
  };

  if (!role || (role !== "etudiant" && role !== "enseignant")) {
    return null;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-default-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">
            Informations {role === "etudiant" ? "Étudiant" : "Enseignant"}
          </h1>
          <p className="text-default-500">
            Complétez votre profil pour finaliser votre inscription
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Vos informations</h2>
          </CardHeader>
          <CardBody>
            {error && (
              <div className="mb-4 p-3 text-sm text-danger bg-danger/10 rounded-lg border border-danger/20">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Champs communs */}
              <Input
                {...register(
                  role === "etudiant" ? "numeroEtudiant" : "numeroEnseignant",
                )}
                isRequired
                errorMessage={
                  errors[
                    role === "etudiant" ? "numeroEtudiant" : "numeroEnseignant"
                  ]?.message as string
                }
                isInvalid={
                  !!(role === "etudiant"
                    ? errors.numeroEtudiant
                    : errors.numeroEnseignant)
                }
                label={`Numéro ${role === "etudiant" ? "étudiant" : "enseignant"}`}
                placeholder={`Votre numéro ${role === "etudiant" ? "étudiant" : "enseignant"}`}
                variant="bordered"
              />

              <Controller
                control={control}
                name="etablissementId"
                render={({ field }) => (
                  <Select
                    isRequired
                    errorMessage={errors.etablissementId?.message as string}
                    isInvalid={!!errors.etablissementId}
                    label="Établissement"
                    placeholder="Sélectionnez votre établissement"
                    selectedKeys={field.value ? [field.value] : []}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      field.onChange(selectedKey || "");
                    }}
                  >
                    {etablissements.map((etab) => (
                      <SelectItem key={etab.id}>{etab.nom}</SelectItem>
                    ))}
                  </Select>
                )}
              />

              {/* Champs spécifiques Étudiant */}
              {role === "etudiant" && (
                <>
                  <Controller
                    control={control}
                    name="niveauId"
                    render={({ field }) => (
                      <Select
                        isRequired
                        errorMessage={errors.niveauId?.message as string}
                        isInvalid={!!errors.niveauId}
                        label="Niveau"
                        placeholder="Sélectionnez votre niveau"
                        selectedKeys={field.value ? [field.value] : []}
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;

                          field.onChange(selectedKey || "");
                        }}
                      >
                        {niveaux.map((niveau) => (
                          <SelectItem key={niveau.id}>{niveau.nom}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  <Controller
                    control={control}
                    name="mentionId"
                    render={({ field }) => (
                      <Select
                        isRequired
                        description={
                          !selectedEtablissementId
                            ? "Veuillez d'abord sélectionner un établissement"
                            : loadingMentions
                              ? "Chargement des mentions..."
                              : undefined
                        }
                        errorMessage={errors.mentionId?.message as string}
                        isDisabled={!selectedEtablissementId || loadingMentions}
                        isInvalid={!!errors.mentionId}
                        isLoading={loadingMentions}
                        label="Mention"
                        placeholder={
                          !selectedEtablissementId
                            ? "Sélectionnez d'abord un établissement"
                            : loadingMentions
                              ? "Chargement..."
                              : "Sélectionnez votre mention"
                        }
                        selectedKeys={field.value ? [field.value] : []}
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;

                          field.onChange(selectedKey || "");
                        }}
                      >
                        {mentions.map((mention) => (
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
                        isRequired
                        description={
                          !selectedMentionId
                            ? "Veuillez d'abord sélectionner une mention"
                            : loadingParcours
                              ? "Chargement des parcours..."
                              : undefined
                        }
                        errorMessage={errors.parcoursId?.message as string}
                        isDisabled={!selectedMentionId || loadingParcours}
                        isInvalid={!!errors.parcoursId}
                        isLoading={loadingParcours}
                        label="Parcours"
                        placeholder={
                          !selectedMentionId
                            ? "Sélectionnez d'abord une mention"
                            : loadingParcours
                              ? "Chargement..."
                              : "Sélectionnez votre parcours"
                        }
                        selectedKeys={field.value ? [field.value] : []}
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;

                          field.onChange(selectedKey || "");
                        }}
                      >
                        {parcours.map((p) => (
                          <SelectItem key={p.id}>{p.nom}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  <Controller
                    control={control}
                    name="anneeAdmission"
                    render={({ field }) => (
                      <Select
                        isRequired
                        errorMessage={errors.anneeAdmission?.message as string}
                        isInvalid={!!errors.anneeAdmission}
                        label="Année d'admission"
                        placeholder="Sélectionnez l'année scolaire"
                        selectedKeys={field.value ? [field.value] : []}
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;

                          field.onChange(selectedKey || "");
                        }}
                      >
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const startYear = currentYear - 1;
                          const years = Array.from({ length: 10 }, (_, i) => {
                            const year = startYear + i;

                            return {
                              value: `${year}-${year + 1}`,
                              label: `${year}-${year + 1}`,
                            };
                          });

                          return years.map((year) => (
                            <SelectItem key={year.value}>
                              {year.label}
                            </SelectItem>
                          ));
                        })()}
                      </Select>
                    )}
                  />

                  <Controller
                    control={control}
                    name="dateNaissance"
                    render={({ field }) => (
                      <DatePicker
                        showMonthAndYearPickers
                        errorMessage={
                          (errors as any).dateNaissance?.message as string
                        }
                        isInvalid={!!(errors as any).dateNaissance}
                        label="Date de naissance"
                        value={
                          field.value
                            ? (() => {
                                try {
                                  return parseDate(field.value);
                                } catch {
                                  return null;
                                }
                              })()
                            : null
                        }
                        variant="bordered"
                        onChange={(date) => {
                          field.onChange(date ? date.toString() : "");
                        }}
                      />
                    )}
                  />
                </>
              )}

              {/* Champs spécifiques Enseignant */}
              {role === "enseignant" && (
                <>
                  <Input
                    {...register("grade")}
                    errorMessage={(errors as any).grade?.message as string}
                    isInvalid={!!(errors as any).grade}
                    label="Grade"
                    placeholder="Professeur, Maître de conférence, etc."
                    variant="bordered"
                  />

                  <Input
                    {...register("specialite")}
                    errorMessage={(errors as any).specialite?.message as string}
                    isInvalid={!!(errors as any).specialite}
                    label="Spécialité"
                    placeholder="Votre domaine de spécialité"
                    variant="bordered"
                  />

                  <Input
                    {...register("departement")}
                    errorMessage={
                      (errors as any).departement?.message as string
                    }
                    isInvalid={!!(errors as any).departement}
                    label="Département"
                    placeholder="Département d'affectation"
                    variant="bordered"
                  />

                  <Input
                    {...register("bureau")}
                    errorMessage={(errors as any).bureau?.message as string}
                    isInvalid={!!(errors as any).bureau}
                    label="Bureau"
                    placeholder="Numéro de bureau"
                    variant="bordered"
                  />

                  <Controller
                    control={control}
                    name="dateEmbauche"
                    render={({ field }) => (
                      <DatePicker
                        showMonthAndYearPickers
                        errorMessage={
                          (errors as any).dateEmbauche?.message as string
                        }
                        isInvalid={!!(errors as any).dateEmbauche}
                        label="Date d'embauche"
                        value={
                          field.value
                            ? (() => {
                                try {
                                  return parseDate(field.value);
                                } catch {
                                  return null;
                                }
                              })()
                            : null
                        }
                        variant="bordered"
                        onChange={(date) => {
                          field.onChange(date ? date.toString() : "");
                        }}
                      />
                    )}
                  />
                </>
              )}

              {/* Champs communs suite */}
              <Input
                {...register("telephone")}
                description="Format: +261 XX XX XXX XX ou 0XX XX XXX XX"
                errorMessage={errors.telephone?.message as string}
                isInvalid={!!errors.telephone}
                label="Téléphone"
                placeholder="+261 XX XX XXX XX"
                type="tel"
                variant="bordered"
              />

              <Input
                {...register("adresse")}
                errorMessage={errors.adresse?.message as string}
                isInvalid={!!errors.adresse}
                label="Adresse"
                placeholder="Votre adresse"
                variant="bordered"
              />

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1"
                  disabled={isLoading}
                  variant="bordered"
                  onClick={() => router.back()}
                >
                  Retour
                </Button>
                <Button
                  className="flex-1 bg-theme-primary text-white"
                  isLoading={isLoading}
                  type="submit"
                >
                  Continuer
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function ProfileDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-default-500">Chargement...</p>
          </div>
        </div>
      }
    >
      <ProfileDetailsContent />
    </Suspense>
  );
}
