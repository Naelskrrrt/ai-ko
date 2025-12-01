"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import { qcmsService } from "@/features/etudiant/services/qcms.service";
import { QCMPlayer } from "@/features/etudiant/components/qcms/QCMPlayer";
import { useAuth } from "@/core/providers/AuthProvider";

export default function QCMPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const qcmId = params.id as string;

  const [canAccess, setCanAccess] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await qcmsService.verifierAcces(qcmId);

        setCanAccess(access);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Erreur vérification accès:", error);
        setCanAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (qcmId) {
      checkAccess();
    }
  }, [qcmId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (canAccess === false) {
    return (
      <Card className="border-danger-500">
        <CardBody>
          <div className="text-center py-8">
            <p className="text-danger font-semibold">Accès refusé</p>
            <p className="text-default-500 mt-2">
              Vous n'avez pas accès à ce QCM ou il n'est pas disponible.
            </p>
            <Button
              className="mt-4"
              color="primary"
              startContent={<ArrowLeft className="w-4 h-4" />}
              variant="flat"
              onPress={() => router.push("/etudiant/qcms")}
            >
              Retour aux QCMs
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!user?.id) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-danger font-semibold">
              Authentification requise
            </p>
            <p className="text-default-500 mt-2">
              Vous devez être connecté pour accéder à ce QCM.
            </p>
            <Button
              className="mt-4"
              color="primary"
              variant="flat"
              onPress={() => router.push("/login")}
            >
              Se connecter
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        startContent={<ArrowLeft className="w-4 h-4" />}
        variant="light"
        onPress={() => router.push("/etudiant/qcms")}
      >
        Retour
      </Button>

      <QCMPlayer qcmId={qcmId} userId={user.id} />
    </div>
  );
}
