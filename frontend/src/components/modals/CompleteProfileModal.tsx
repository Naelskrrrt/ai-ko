"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/core/providers/AuthProvider";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  missingFields: string[];
}

export function CompleteProfileModal({
  isOpen,
  onClose,
  onComplete,
  missingFields,
}: CompleteProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    telephone: "",
    adresse: "",
    grade: "",
    specialite: "",
    departement: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        grade: (user as any).enseignantProfil?.grade || "",
        specialite: (user as any).enseignantProfil?.specialite || "",
        departement: (user as any).enseignantProfil?.departement || "",
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Appeler l'API pour mettre à jour le profil
      const token =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1] || localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("Token non trouvé");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      // Mettre à jour les infos utilisateur de base
      const userUpdateResponse = await fetch(`${apiUrl}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telephone: formData.telephone,
          adresse: formData.adresse,
        }),
      });

      if (!userUpdateResponse.ok) {
        throw new Error("Erreur lors de la mise à jour du profil utilisateur");
      }

      // Mettre à jour le profil enseignant si nécessaire
      if (formData.grade || formData.specialite || formData.departement) {
        const enseignantUpdateResponse = await fetch(
          `${apiUrl}/api/enseignant/me`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              grade: formData.grade,
              specialite: formData.specialite,
              departement: formData.departement,
            }),
          }
        );

        if (!enseignantUpdateResponse.ok) {
          console.warn("Erreur lors de la mise à jour du profil enseignant");
        }
      }

      // Rafraîchir les données utilisateur
      await refreshUser();
      onComplete();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const grades = [
    "Maître de conférences",
    "Professeur",
    "Professeur assistant",
    "Chargé de cours",
    "Vacataire",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={false}
      hideCloseButton
      size="lg"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Complétez votre profil</h2>
          <p className="text-sm text-default-500">
            Quelques informations supplémentaires sont nécessaires pour une
            meilleure expérience
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {missingFields.includes("telephone") && (
              <Input
                label="Téléphone"
                placeholder="Votre numéro de téléphone"
                value={formData.telephone}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
                variant="bordered"
              />
            )}

            {missingFields.includes("adresse") && (
              <Input
                label="Adresse"
                placeholder="Votre adresse"
                value={formData.adresse}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
                variant="bordered"
              />
            )}

            {missingFields.includes("grade") && (
              <Select
                label="Grade"
                placeholder="Sélectionnez votre grade"
                selectedKeys={formData.grade ? [formData.grade] : []}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
                variant="bordered"
              >
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </Select>
            )}

            {missingFields.includes("specialite") && (
              <Input
                label="Spécialité"
                placeholder="Votre spécialité"
                value={formData.specialite}
                onChange={(e) =>
                  setFormData({ ...formData, specialite: e.target.value })
                }
                variant="bordered"
              />
            )}

            {missingFields.includes("departement") && (
              <Input
                label="Département"
                placeholder="Votre département"
                value={formData.departement}
                onChange={(e) =>
                  setFormData({ ...formData, departement: e.target.value })
                }
                variant="bordered"
              />
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Plus tard
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
