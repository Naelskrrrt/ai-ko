"use client";

import {
  Edit,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Shield,
  Zap,
  Award,
  Clock,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import Image from "next/image";

import { DashboardContentArea } from "@/components/layout/content-area";

export default function ProfilePage() {
  return (
    <DashboardContentArea
      actions={
        <div className="flex gap-2">
          <Button
            className="font-medium bg-theme-primary text-white hover:bg-theme-primary/90"
            startContent={<Edit className="w-4 h-4" />}
            variant="solid"
          >
            Modifier le profil
          </Button>
        </div>
      }
      subtitle="Consultez et modifiez vos informations personnelles"
      title="Mon Profil"
    >
      <div className="w-full space-y-4">
        {/* Carte de profil principale */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 items-center lg:items-start">
          {/* Colonne gauche - Info principale */}
          <div className="lg:col-span-2 w-full max-w-md lg:max-w-none">
            <Card className="border-none shadow-md bg-gradient-to-br from-content1 to-content2 dark:from-content1 dark:to-content1">
              <CardBody className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="rounded-full overflow-hidden border-4 border-theme-primary/30 shadow-lg">
                        <Image
                          priority
                          alt="Photo de profil"
                          className="object-cover object-top"
                          height={112}
                          src="/profile.webp"
                          width={112}
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-background dark:border-content1 shadow-md" />
                    </div>
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-foreground mb-1">
                        Nicolas Supiot
                      </h2>
                      <p className="text-base text-theme-primary font-semibold mb-1">
                        Administrateur
                      </p>
                      <p className="text-xs text-default-500 dark:text-default-400">
                        nicolas.supiot@capt-ia.com
                      </p>
                    </div>

                    {/* Badges de statut */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-xs font-medium">Actif</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <span className="text-xs font-medium">Vérifié</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-theme-secondary" />
                        <span className="text-xs font-medium">Admin</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider className="my-3" />

                {/* Grille d'infos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-theme-primary flex-shrink-0" />
                      <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                        Email
                      </span>
                    </div>
                    <p className="text-sm font-medium ml-6">
                      nicolas.supiot@capt-ia.com
                    </p>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-theme-primary flex-shrink-0" />
                      <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                        Téléphone
                      </span>
                    </div>
                    <p className="text-sm font-medium ml-6">
                      +33 7 89 45 23 67
                    </p>
                  </div>

                  {/* Localisation */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-theme-primary flex-shrink-0" />
                      <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                        Localisation
                      </span>
                    </div>
                    <p className="text-sm font-medium ml-6">Paris, France</p>
                  </div>

                  {/* Membre depuis */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-theme-primary flex-shrink-0" />
                      <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                        Membre depuis
                      </span>
                    </div>
                    <p className="text-sm font-medium ml-6">Mars 2025</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Colonne droite - Stats rapides */}
          <div className="space-y-3 w-full max-w-md lg:max-w-none">
            {/* Statut */}
            <Card className="border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 p-2">
                    <Zap className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500">Statut</p>
                    <p className="text-sm font-semibold text-success">Actif</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Dernière connexion */}
            <Card className="border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-theme-primary/10 flex items-center justify-center flex-shrink-0 p-2">
                    <Clock className="w-4 h-4 text-theme-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500 dark:text-default-400">
                      Dernière connexion
                    </p>
                    <p className="text-sm font-semibold">Aujourd'hui</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Sécurité */}
            <Card className="border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 p-2">
                    <Shield className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500 dark:text-default-400">Sécurité</p>
                    <p className="text-sm font-semibold text-success">Vérifiée</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Permissions */}
            <Card className="border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-theme-secondary/10 flex items-center justify-center flex-shrink-0 p-2">
                    <Award className="w-4 h-4 text-theme-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500 dark:text-default-400">Permissions</p>
                    <p className="text-sm font-semibold">Complètes</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Section supplémentaire - Activité */}
        <Card className="border-none shadow-md max-w-md lg:max-w-none w-full">
          <CardBody className="p-6">
            <h3 className="text-lg font-bold mb-4">Activité récente</h3>
            <div className="space-y-2">
              {[
                {
                  action: "Connexion à l'application",
                  time: "Il y a 2 heures",
                  icon: "🔐",
                },
                {
                  action: "Modification du profil",
                  time: "Il y a 1 jour",
                  icon: "✏️",
                },
                {
                  action: "Changement de mot de passe",
                  time: "Il y a 3 jours",
                  icon: "🔑",
                },
                { action: "Création du compte", time: "Mars 2025", icon: "✨" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-default-100 dark:hover:bg-default-100/5 transition-colors"
                >
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {item.action}
                    </p>
                    <p className="text-xs text-default-500 dark:text-default-400">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardContentArea>
  );
}
