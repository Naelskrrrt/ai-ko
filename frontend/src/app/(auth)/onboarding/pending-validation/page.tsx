"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Clock, CheckCircle2, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/providers/AuthProvider";
import { useSocket } from "@/core/hooks/useSocket";

export default function PendingValidationPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isActivated, setIsActivated] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Timer pour afficher le temps écoulé
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Configuration du WebSocket pour écouter l'activation du compte
  useSocket({
    onUserActivated: (_notification) => {
      setIsActivated(true);

      // Rediriger automatiquement vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push("/login?message=account_activated");
      }, 3000);
    },
    onUserRejected: (notification) => {
      setIsRejected(true);
      setRejectionReason(notification.message);
    },
  });

  // Formatage du temps écoulé
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Gestionnaire de déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  // Gestionnaire de vérification manuelle
  const handleCheckStatus = async () => {
    try {
      // Rafraîchir les données utilisateur
      window.location.reload();
    } catch {
      toast.error("Erreur lors de la vérification du statut");
    }
  };

  if (isActivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success/10 to-success/5 dark:from-success/20 dark:to-success/10 p-4">
        <div className="w-full max-w-3xl space-y-6">
          <Card className="border-success/20">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-success animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-success">
                Félicitations !
              </h1>
              <p className="text-default-600 mt-2">
                Votre compte a été validé par un administrateur
              </p>
            </CardHeader>
            <CardBody className="text-center space-y-4">
              <Chip className="animate-bounce" color="success" variant="flat">
                Validation confirmée
              </Chip>
              <p className="text-sm text-default-500">
                Vous allez être redirigé vers la page de connexion...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-success" />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-danger/10 to-danger/5 dark:from-danger/20 dark:to-danger/10 p-4">
        <div className="w-full max-w-3xl space-y-6">
          <Card className="border-danger/20">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
              <h1 className="text-xl font-bold text-danger">Compte rejeté</h1>
              <p className="text-default-600 mt-2">
                Votre inscription n'a pas été validée
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="p-3 bg-danger/10 rounded-lg border border-danger/20">
                <p className="text-sm text-danger font-medium">
                  Raison du rejet :
                </p>
                <p className="text-sm text-danger/80 mt-1">{rejectionReason}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="bordered"
                  onClick={() => router.push("/register")}
                >
                  Créer un nouveau compte
                </Button>
                <Button
                  className="flex-1 bg-theme-primary text-white"
                  onClick={handleLogout}
                >
                  Se connecter
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900 p-4">
      <div className="w-full max-w-3xl space-y-6">
        <Card className="border-default-200">
          <CardHeader className="flex flex-col pb-4 w-full">
            <div className="flex items-center mb-4 gap-4">
              <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-8 h-8 text-warning" />
              </div>
              <h1 className="text-2xl font-bold">Inscription en attente</h1>
            </div>

            <div>
              <p className="text-default-600 mt-2">
                Votre compte a été créé avec succès !
              </p>
            </div>
          </CardHeader>

          <CardBody className="space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <h3 className="font-semibold text-warning mb-2">
                  Validation en cours
                </h3>
                <p className="text-sm text-warning/80">
                  Un administrateur doit valider votre inscription avant que
                  vous puissiez accéder à la plateforme.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-default-500">
                <span>Temps écoulé :</span>
                <Chip size="sm" variant="flat">
                  {formatTime(timeElapsed)}
                </Chip>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-default-50 dark:bg-default-800 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Vérification des informations
                  </p>
                  <p className="text-xs text-default-500 mt-1">
                    L'administrateur vérifie vos données d'inscription
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-default-50 dark:bg-default-800 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Activation du compte</p>
                  <p className="text-xs text-default-500 mt-1">
                    Une fois validé, vous recevrez une notification et pourrez
                    vous connecter
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-default-50 dark:bg-default-800 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Accès à la plateforme</p>
                  <p className="text-xs text-default-500 mt-1">
                    Vous pourrez alors utiliser toutes les fonctionnalités selon
                    votre rôle
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1"
                startContent={<RefreshCw className="w-4 h-4" />}
                variant="bordered"
                onClick={handleCheckStatus}
              >
                Vérifier le statut
              </Button>
              <Button
                className="flex-1"
                color="secondary"
                startContent={<LogOut className="w-4 h-4" />}
                variant="flat"
                onClick={handleLogout}
              >
                Se déconnecter
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-default-400">
                Cette page se mettra à jour automatiquement lorsqu'un
                administrateur validera votre compte.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
