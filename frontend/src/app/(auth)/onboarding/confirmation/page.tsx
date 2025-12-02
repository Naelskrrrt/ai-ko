"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { CheckCircle2 } from "lucide-react";
import axios from "axios";

import { useAuth } from "@/core/providers/AuthProvider";
import { matiereService } from "@/shared/services/api/matiere.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ConfirmationPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [matieres, setMatieres] = useState<string[]>([]);
  const [matieresDetails, setMatieresDetails] = useState<
    Array<{ id: string; nom: string; code?: string }>
  >([]);

  useEffect(() => {
    // Récupérer toutes les données du localStorage (côté client uniquement)
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("onboarding_role");
      const storedDetails = localStorage.getItem("onboarding_details");
      const storedNames = localStorage.getItem("onboarding_names");
      const storedMatieres = localStorage.getItem("onboarding_matieres");

      if (!storedRole || !storedDetails) {
        router.push("/onboarding/role-selection");

        return;
      }

      try {
        setRole(storedRole);
        setProfileData(JSON.parse(storedDetails));

        if (storedNames) {
          setNames(JSON.parse(storedNames));
        }

        if (storedMatieres) {
          const matieresIds = JSON.parse(storedMatieres);

          setMatieres(matieresIds);

          // Charger les détails des matières
          if (matieresIds.length > 0) {
            loadMatieresDetails(matieresIds);
          }
        }
      } catch {
        router.push("/onboarding/role-selection");
      }
    }
  }, [router]);

  // Recharger les matières si elles changent et ne sont pas encore chargées
  useEffect(() => {
    if (matieres.length > 0 && matieresDetails.length === 0) {
      loadMatieresDetails(matieres);
    }
  }, [matieres]);

  const loadMatieresDetails = async (matieresIds: string[]) => {
    try {
      // Charger toutes les matières (actives et inactives) pour être sûr de trouver toutes les matières sélectionnées
      const allMatieres = await matiereService.getMatieres(false);
      const selectedMatieres = allMatieres.filter((m) =>
        matieresIds.includes(m.id),
      );

      // Si certaines matières ne sont pas trouvées, essayer de les charger individuellement
      const foundIds = selectedMatieres.map((m) => m.id);
      const missingIds = matieresIds.filter((id) => !foundIds.includes(id));

      if (missingIds.length > 0) {
        // Essayer de charger les matières manquantes individuellement
        const missingMatieres = await Promise.all(
          missingIds.map(async (id) => {
            try {
              return await matiereService.getMatiereById(id);
            } catch {
              return null;
            }
          }),
        );

        const validMissingMatieres = missingMatieres.filter((m) => m !== null);

        selectedMatieres.push(...validMissingMatieres);
      }

      setMatieresDetails(
        selectedMatieres.map((m) => ({
          id: m.id,
          nom: m.nom || "Matière sans nom",
          code: m.code,
        })),
      );
    } catch {
      // En cas d'erreur, au moins afficher les IDs
      setMatieresDetails(
        matieresIds.map((id) => ({
          id,
          nom: `Matière ${id.substring(0, 8)}`,
          code: undefined,
        })),
      );
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Vérifier que nous sommes côté client
      if (typeof window === "undefined") {
        setError("Erreur de chargement. Veuillez réessayer.");

        return;
      }

      const role = localStorage.getItem("onboarding_role");
      const details = JSON.parse(
        localStorage.getItem("onboarding_details") || "{}",
      );

      if (!role || !details) {
        setError("Données manquantes. Veuillez recommencer.");
        router.push("/onboarding/role-selection");

        return;
      }

      // Récupérer le token
      let token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      if (!token) {
        token = localStorage.getItem("auth_token") || undefined;
      }

      // Si toujours pas de token, essayer onboarding_token (pendant l'onboarding)
      if (!token) {
        token = localStorage.getItem("onboarding_token") || undefined;
      }

      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        router.push("/login");

        return;
      }

      // Appeler l'API pour finaliser l'inscription
      const response = await axios.post(
        `${API_URL}/api/auth/complete-profile`,
        {
          role,
          ...details,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      // Récupérer le nouveau token retourné par le backend (avec le bon rôle)
      const newToken = response.data?.token;

      if (newToken && typeof window !== "undefined") {
        // Stocker le nouveau token dans localStorage
        localStorage.setItem("auth_token", newToken);

        // Mettre à jour le cookie aussi
        document.cookie = `auth_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      // Enregistrer les matières après la création du profil réussie
      if (typeof window !== "undefined") {
        const storedMatieres = localStorage.getItem("onboarding_matieres");

        if (storedMatieres) {
          try {
            const matieresIds = JSON.parse(storedMatieres);

            if (role === "etudiant" && matieresIds.length > 0) {
              // Enregistrer les matières de l'étudiant
              const anneeAdmission = details.anneeAdmission || "2024-2025";

              await axios.put(
                `${API_URL}/api/qcm-etudiant/matieres/mes-matieres`,
                {
                  matieres_ids: matieresIds,
                  annee_scolaire: anneeAdmission,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  withCredentials: true,
                },
              );
            } else if (role === "enseignant" && matieresIds.length > 0) {
              // Enregistrer les matières de l'enseignant
              const userId = response.data.user?.id;

              if (userId) {
                await axios.put(
                  `${API_URL}/api/enseignants/${userId}/matieres`,
                  {
                    matieres_ids: matieresIds,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    withCredentials: true,
                  },
                );
              }
            }
          } catch {
            // Ne pas bloquer le processus si l'enregistrement des matières échoue
          }
        }
      }

      // Nettoyer le localStorage après confirmation réussie (mais garder les tokens)
      if (typeof window !== "undefined") {
        localStorage.removeItem("onboarding_role");
        localStorage.removeItem("onboarding_details");
        localStorage.removeItem("onboarding_names");
        localStorage.removeItem("onboarding_matieres");
        localStorage.removeItem("onboarding_userId");
        localStorage.removeItem("onboarding_token"); // Supprimer l'ancien token d'onboarding
        // Le nouveau token est maintenant dans auth_token
      }

      // Rafraîchir les données utilisateur avec le nouveau token
      if (newToken) {
        // Le nouveau token est déjà dans localStorage et cookies
        // refreshUser() devrait l'utiliser automatiquement
        await refreshUser();
      }

      // Attendre un peu pour que le backend et le middleware se synchronisent
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Rediriger vers la page d'attente de validation
      // L'utilisateur sera activé par un admin avant de pouvoir accéder au dashboard
      if (typeof window !== "undefined") {
        window.location.href = "/onboarding/pending-validation";
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la création du profil. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatKey = (key: string): string => {
    // Convertir camelCase en français
    const keyMap: Record<string, string> = {
      numeroEtudiant: "Numéro étudiant",
      numeroEnseignant: "Numéro enseignant",
      etablissementId: "Établissement",
      niveauId: "Niveau",
      mentionId: "Mention",
      parcoursId: "Parcours",
      anneeAdmission: "Année d'admission",
      dateNaissance: "Date de naissance",
      telephone: "Téléphone",
      adresse: "Adresse",
      grade: "Grade",
      specialite: "Spécialité",
      departement: "Département",
      bureau: "Bureau",
      dateEmbauche: "Date d'embauche",
    };

    return keyMap[key] || key.replace(/([A-Z])/g, " $1").trim();
  };

  const getDisplayValue = (key: string, value: any): string => {
    if (!value) return "Non renseigné";

    // Si c'est un ID, utiliser le nom correspondant depuis le sessionStorage
    if (key === "etablissementId" && names.etablissementNom) {
      return names.etablissementNom;
    }
    if (key === "niveauId" && names.niveauNom) {
      return names.niveauNom;
    }
    if (key === "mentionId" && names.mentionNom) {
      return names.mentionNom;
    }
    if (key === "parcoursId" && names.parcoursNom) {
      return names.parcoursNom;
    }

    return String(value);
  };

  if (!profileData || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-default-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-success" />
          </div>
          <h1 className="text-3xl font-bold">Confirmez vos informations</h1>
          <p className="text-default-500">
            Vérifiez que tout est correct avant de finaliser votre inscription
          </p>
        </div>

        <Card className="px-4 py-2">
          <CardHeader>
            <h2 className="text-xl font-semibold">Récapitulatif</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg border border-danger/20">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-divider">
                <span className="text-default-500 font-medium">
                  Type de compte
                </span>
                <span className="font-semibold capitalize">{role}</span>
              </div>

              {Object.entries(profileData).map(([key, value]) => {
                if (!value || value === "") return null;

                return (
                  <div
                    key={key}
                    className="flex justify-between items-center py-2 border-b border-divider"
                  >
                    <span className="text-default-500">{formatKey(key)}</span>
                    <span className="font-medium text-right max-w-[60%] break-words">
                      {getDisplayValue(key, value)}
                    </span>
                  </div>
                );
              })}

              {/* Afficher les matières sélectionnées */}
              {matieres && matieres.length > 0 && (
                <div className="py-2 border-b border-divider">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-default-500">Matières</span>
                    <span className="text-sm text-default-400">
                      {matieres.length} sélectionnée
                      {matieres.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {matieresDetails.length > 0 ? (
                      matieresDetails.map((matiere) => (
                        <Chip
                          key={matiere.id}
                          color="primary"
                          size="sm"
                          variant="flat"
                        >
                          {matiere.nom}
                          {matiere.code && (
                            <span className="ml-1 text-xs opacity-70">
                              ({matiere.code})
                            </span>
                          )}
                        </Chip>
                      ))
                    ) : (
                      // Afficher un message de chargement au lieu des IDs
                      <div className="text-sm text-default-400">
                        Chargement des matières...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                variant="bordered"
                onClick={() => router.back()}
              >
                Modifier
              </Button>
              <Button
                className="flex-1 bg-theme-primary text-white"
                isLoading={isLoading}
                onClick={handleConfirm}
              >
                {isLoading ? "Création..." : "Confirmer et créer mon compte"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
