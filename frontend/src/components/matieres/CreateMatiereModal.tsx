"use client";

import type { MatiereCreate } from "@/shared/types/matiere.types";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { matiereService } from "@/shared/services/api/matiere.service";
import { useToast } from "@/hooks/use-toast";

const matiereSchema = z.object({
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères"),
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  coefficient: z.number().min(0).max(10).optional(),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hex (#RRGGBB)")
    .optional()
    .or(z.literal(""))
    .or(z.undefined()),
  icone: z.string().optional(),
});

type MatiereFormValues = z.infer<typeof matiereSchema>;

interface CreateMatiereModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (matiere: any) => void;
}

export function CreateMatiereModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateMatiereModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MatiereFormValues>({
    resolver: zodResolver(matiereSchema),
    defaultValues: {
      code: "",
      nom: "",
      description: "",
      coefficient: 1.0,
      couleur: "",
      icone: "",
    },
  });

  // Réinitialiser le formulaire quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      reset({
        code: "",
        nom: "",
        description: "",
        coefficient: 1.0,
        couleur: "#3B82F6",
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: MatiereFormValues) => {
    try {
      setIsLoading(true);

      const createData: MatiereCreate = {
        code: data.code.trim(),
        nom: data.nom.trim(),
        description: data.description?.trim() || undefined,
        coefficient: data.coefficient || 1.0,
        couleur: data.couleur || undefined,
        actif: true,
      };

      const newMatiere = await matiereService.createMatiere(createData);

      toast({
        title: "Succès",
        description: "La matière a été créée avec succès",
      });

      onSuccess?.(newMatiere);
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message || "Impossible de créer la matière",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        {(onCloseModal: () => void) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">
                Créer une nouvelle matière
              </h2>
              <p className="text-sm text-default-500 font-normal">
                Ajoutez une nouvelle matière à la base de données
              </p>
            </ModalHeader>
            <ModalBody>
              <form
                className="space-y-4"
                id="create-matiere-form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <Controller
                  control={control}
                  name="code"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      errorMessage={errors.code?.message}
                      isInvalid={!!errors.code}
                      label="Code"
                      placeholder="Ex: INFO101"
                      variant="bordered"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="nom"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      errorMessage={errors.nom?.message}
                      isInvalid={!!errors.nom}
                      label="Nom"
                      placeholder="Ex: Programmation Python"
                      variant="bordered"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      errorMessage={errors.description?.message}
                      isInvalid={!!errors.description}
                      label="Description"
                      minRows={3}
                      placeholder="Description de la matière (optionnel)"
                      variant="bordered"
                    />
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="coefficient"
                    render={({ field }) => (
                      <Input
                        {...field}
                        errorMessage={errors.coefficient?.message}
                        isInvalid={!!errors.coefficient}
                        label="Coefficient"
                        max={10}
                        min={0}
                        placeholder="1.0"
                        step={0.5}
                        type="number"
                        value={field.value?.toString() || ""}
                        variant="bordered"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = parseFloat(e.target.value);

                          field.onChange(isNaN(value) ? undefined : value);
                        }}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="couleur"
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-default-700">
                          Couleur
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            className="h-10 w-20 rounded-lg border-2 border-default-200 cursor-pointer"
                            type="color"
                            value={field.value || "#3B82F6"}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => field.onChange(e.target.value)}
                          />
                          <Input
                            className="flex-1"
                            errorMessage={errors.couleur?.message}
                            isInvalid={!!errors.couleur}
                            placeholder="#3B82F6"
                            value={field.value || ""}
                            variant="bordered"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => field.onChange(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  />
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                isDisabled={isLoading}
                variant="light"
                onPress={onCloseModal}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                form="create-matiere-form"
                isLoading={isLoading}
                type="submit"
              >
                Créer la matière
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
