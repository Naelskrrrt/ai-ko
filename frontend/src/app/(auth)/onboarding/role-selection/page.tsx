"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { GraduationCap, User } from "lucide-react";

function RoleSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<
    "etudiant" | "enseignant" | null
  >(null);

  // Récupérer les données temporaires des query params ou sessionStorage
  const userId = searchParams.get("userId");

  const handleContinue = () => {
    if (!selectedRole) return;

    // Stocker le rôle choisi dans le localStorage (persiste après fermeture)
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_role", selectedRole);
      if (userId) {
        localStorage.setItem("onboarding_userId", userId);
      }
    }

    // Rediriger vers le formulaire spécifique
    router.push(`/onboarding/profile-details?role=${selectedRole}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Bienvenue sur AI-KO ! 👋</h1>
          <p className="text-default-500">
            Pour personnaliser votre expérience, dites-nous qui vous êtes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Étudiant */}
          <Card
            isPressable
            className={`cursor-pointer transition-all ${
              selectedRole === "etudiant"
                ? "ring-4 ring-primary scale-105"
                : "hover:scale-105"
            }`}
            onClick={() => setSelectedRole("etudiant")}
          >
            <CardBody className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div
                  className={`p-6 rounded-full ${
                    selectedRole === "etudiant"
                      ? "bg-primary/20"
                      : "bg-default-100"
                  }`}
                >
                  <GraduationCap
                    className={`w-16 h-16 ${
                      selectedRole === "etudiant"
                        ? "text-primary"
                        : "text-default-500"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Je suis Étudiant</h2>
                <p className="text-default-500">
                  Accédez aux cours, passez des QCM et suivez votre progression
                  académique
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === "etudiant"
                      ? "border-primary bg-primary"
                      : "border-default-300"
                  }`}
                >
                  {selectedRole === "etudiant" && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {selectedRole === "etudiant" ? "Sélectionné" : "Sélectionner"}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Card Enseignant */}
          <Card
            isPressable
            className={`cursor-pointer transition-all ${
              selectedRole === "enseignant"
                ? "ring-4 ring-secondary scale-105"
                : "hover:scale-105"
            }`}
            onClick={() => setSelectedRole("enseignant")}
          >
            <CardBody className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div
                  className={`p-6 rounded-full ${
                    selectedRole === "enseignant"
                      ? "bg-secondary/20"
                      : "bg-default-100"
                  }`}
                >
                  <User
                    className={`w-16 h-16 ${
                      selectedRole === "enseignant"
                        ? "text-secondary"
                        : "text-default-500"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Je suis Enseignant</h2>
                <p className="text-default-500">
                  Créez des cours, gérez des QCM et suivez les performances de
                  vos étudiants
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === "enseignant"
                      ? "border-secondary bg-secondary"
                      : "border-default-300"
                  }`}
                >
                  {selectedRole === "enseignant" && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {selectedRole === "enseignant"
                    ? "Sélectionné"
                    : "Sélectionner"}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            className="bg-theme-primary text-white px-12"
            disabled={!selectedRole}
            size="lg"
            onClick={handleContinue}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-default-500">Chargement...</p>
        </div>
      </div>
    }>
      <RoleSelectionContent />
    </Suspense>
  );
}
