"use client";

import type { ProfileData } from "@/shared/types/profile.types";

import * as React from "react";
import {
  Edit,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Zap,
  UserCheck,
  GraduationCap,
  Building2,
  Briefcase,
  BookOpen,
  Users,
  Award,
  Hash,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import Image from "next/image";
import useSWR from "swr";

import { DashboardContentArea } from "@/components/layout/content-area";
import { useAuth } from "@/core/providers/AuthProvider";
import { profileService } from "@/shared/services/api/profile.service";
import { EditProfileModal } from "@/features/profile/components/EditProfileModal";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Charger le profil complet selon le rôle
  const {
    data: profileData,
    isLoading: profileLoading,
    mutate: mutateProfile,
  } = useSWR<ProfileData>(
    user?.role && user.role !== "admin"
      ? [`profile-${user.role}`, user.role]
      : null,
    async ([, role]: [string, string]) => {
      return await profileService.getMyProfile(role);
    },
  );

  const formatRole = (role?: string): string => {
    const roleMap: Record<string, string> = {
      admin: "Administrateur",
      etudiant: "Étudiant",
      enseignant: "Enseignant",
    };

    return roleMap[role || ""] || role || "Utilisateur";
  };

  const getInitials = (name: string | null) => {
    if (!name) return "";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "Non disponible";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      return new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(dateObj);
    } catch {
      return "Non disponible";
    }
  };

  const formatRelativeTime = (date: Date | string | undefined): string => {
    if (!date) return "";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffInSeconds = Math.floor(
        (now.getTime() - dateObj.getTime()) / 1000,
      );

      if (diffInSeconds < 60) return "À l'instant";
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);

        return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);

        return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);

        return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
      }
      if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);

        return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
      }
      if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);

        return `Il y a ${months} mois`;
      }
      const years = Math.floor(diffInSeconds / 31536000);

      return `Il y a ${years} an${years > 1 ? "s" : ""}`;
    } catch {
      return "";
    }
  };

  // Générer les activités basées sur les données réelles
  const getActivities = () => {
    if (!user) return [];

    const activities = [];

    // Activité de mise à jour du profil
    if (user.updatedAt) {
      activities.push({
        icon: <Edit className="w-4 h-4" />,
        action: "Modification du profil",
        time: formatRelativeTime(user.updatedAt),
        date: new Date(user.updatedAt),
        color: "text-warning",
        bgColor: "bg-warning/10",
      });
    }

    // Vérification de l'email
    if (user.emailVerified) {
      activities.push({
        icon: <UserCheck className="w-4 h-4" />,
        action: "Email vérifié",
        time: "Compte vérifié",
        date: user.createdAt ? new Date(user.createdAt) : new Date(),
        color: "text-success",
        bgColor: "bg-success/10",
      });
    }

    // Création du compte
    if (user.createdAt) {
      activities.push({
        icon: <Zap className="w-4 h-4" />,
        action: "Création du compte",
        time: formatDate(user.createdAt),
        date: new Date(user.createdAt),
        color: "text-theme-primary",
        bgColor: "bg-theme-primary/10",
      });
    }

    // Trier par date décroissante
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const activities = getActivities();

  // Utiliser les données du profil complet si disponibles, sinon les données de base
  const displayUser = profileData || user;
  const isLoading = authLoading || profileLoading;

  // Type étendu pour inclure les champs optionnels du backend
  const userData = displayUser as typeof displayUser & {
    telephone?: string;
    adresse?: string;
    dateNaissance?: string;
  };

  // Vérifier si c'est un profil enseignant
  const isEnseignant =
    profileData && "role" in profileData && profileData.role === "enseignant";
  const enseignantData = isEnseignant
    ? (profileData as Extract<ProfileData, { role: "enseignant" }>)
    : null;

  // Vérifier si c'est un profil étudiant
  const isEtudiant =
    profileData && "role" in profileData && profileData.role === "etudiant";
  const etudiantData = isEtudiant
    ? (profileData as Extract<ProfileData, { role: "etudiant" }>)
    : null;

  if (isLoading) {
    return (
      <DashboardContentArea>
        <div className="flex items-center justify-center h-64">
          <p className="text-default-500">Chargement des données...</p>
        </div>
      </DashboardContentArea>
    );
  }

  if (!user) {
    return (
      <DashboardContentArea>
        <div className="flex items-center justify-center h-64">
          <p className="text-default-500">Aucun utilisateur connecté</p>
        </div>
      </DashboardContentArea>
    );
  }

  return (
    <DashboardContentArea
      actions={
        <div className="flex gap-2">
          <Button
            className="font-medium bg-theme-primary text-white hover:bg-theme-primary/90"
            startContent={<Edit className="w-4 h-4" />}
            variant="solid"
            onPress={() => setIsEditModalOpen(true)}
          >
            Modifier le profil
          </Button>
        </div>
      }
    >
      <div className="w-full space-y-4 px-2">
        {/* Carte de profil principale */}
        <div className="flex flex-col ">
          {/* Colonne gauche - Info principale */}
          <div className="lg:col-span-2 w-full max-w-md lg:max-w-none">
            <Card className="border-none shadow-md bg-gradient-to-br from-content1 to-content2 dark:from-content1 dark:to-content1">
              <CardBody className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="rounded-full overflow-hidden border-4 border-theme-primary/30 shadow-lg">
                        {displayUser?.avatar || user?.avatar ? (
                          <Image
                            priority
                            alt={
                              displayUser?.name ||
                              user?.name ||
                              displayUser?.email ||
                              user?.email ||
                              "Photo de profil"
                            }
                            className="object-cover object-top"
                            height={112}
                            src={displayUser?.avatar || user?.avatar || ""}
                            width={112}
                          />
                        ) : (
                          <div className="w-28 h-28 bg-theme-primary/20 flex items-center justify-center text-2xl font-semibold text-theme-primary">
                            {getInitials(
                              displayUser?.name || user?.name || null,
                            )}
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-background dark:border-content1 shadow-md" />
                    </div>
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-foreground mb-1">
                        {displayUser?.name ||
                          displayUser?.email ||
                          user?.name ||
                          user?.email}
                      </h2>
                      <p className="text-base text-theme-primary font-semibold mb-1">
                        {formatRole(displayUser?.role || user?.role)}
                        {enseignantData?.grade && ` - ${enseignantData.grade}`}
                      </p>
                      <p className="text-xs text-default-500 dark:text-default-400">
                        {displayUser?.email || user?.email}
                      </p>
                      {enseignantData?.numeroEnseignant && (
                        <p className="text-xs text-default-400 mt-1">
                          N° {enseignantData.numeroEnseignant}
                        </p>
                      )}
                      {etudiantData?.numeroEtudiant && (
                        <p className="text-xs text-default-400 mt-1">
                          N° {etudiantData.numeroEtudiant}
                        </p>
                      )}
                    </div>

                    {/* Badges de statut */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-xs font-medium">Actif</span>
                      </div>
                      {user?.emailVerified && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-warning" />
                          <span className="text-xs font-medium">Vérifié</span>
                        </div>
                      )}
                      {user.role === "admin" && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-theme-secondary" />
                          <span className="text-xs font-medium">Admin</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Divider className="my-3" />

                {/* Grille d'infos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                  {/* Email */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-theme-primary flex-shrink-0" />
                      <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                        Email
                      </span>
                    </div>
                    <p className="text-sm font-medium ml-6">
                      {displayUser?.email || user?.email}
                    </p>
                  </div>

                  {/* Téléphone */}
                  {userData.telephone && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Téléphone
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {userData.telephone}
                      </p>
                    </div>
                  )}

                  {/* Localisation */}
                  {userData.adresse && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Localisation
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {userData.adresse}
                      </p>
                    </div>
                  )}

                  {/* Membre depuis */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-theme-primary flex-shrink-0" />
                      <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                        Membre depuis
                      </span>
                    </div>
                    <p className="text-sm font-medium ml-6">
                      {formatDate(displayUser?.createdAt || user?.createdAt)}
                    </p>
                  </div>

                  {/* Date de naissance */}
                  {userData.dateNaissance && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Date de naissance
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {formatDate(userData.dateNaissance)}
                      </p>
                    </div>
                  )}

                  {/* Établissement - Enseignant */}
                  {enseignantData?.etablissement && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Établissement
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {enseignantData.etablissement.nom}
                      </p>
                    </div>
                  )}

                  {/* Établissement - Étudiant */}
                  {etudiantData?.etablissement && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Établissement
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {etudiantData.etablissement.nom}
                      </p>
                    </div>
                  )}

                  {/* Grade - Enseignant */}
                  {enseignantData?.grade && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Grade
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {enseignantData.grade}
                      </p>
                    </div>
                  )}

                  {/* Spécialité - Enseignant */}
                  {enseignantData?.specialite && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Spécialité
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {enseignantData.specialite}
                      </p>
                    </div>
                  )}

                  {/* Département - Enseignant */}
                  {enseignantData?.departement && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Département
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {enseignantData.departement}
                      </p>
                    </div>
                  )}

                  {/* Bureau - Enseignant */}
                  {enseignantData?.bureau && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Bureau
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {enseignantData.bureau}
                      </p>
                    </div>
                  )}

                  {/* Date d'embauche - Enseignant */}
                  {enseignantData?.dateEmbauche && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Date d'embauche
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {formatDate(enseignantData.dateEmbauche)}
                      </p>
                    </div>
                  )}

                  {/* Mention - Étudiant */}
                  {etudiantData?.mention && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Mention
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {etudiantData.mention.nom}
                      </p>
                    </div>
                  )}

                  {/* Parcours - Étudiant */}
                  {etudiantData?.parcours && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Parcours
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {etudiantData.parcours.nom}
                      </p>
                    </div>
                  )}

                  {/* Niveau - Étudiant */}
                  {etudiantData?.niveau && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Niveau
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {etudiantData.niveau.nom}
                      </p>
                    </div>
                  )}

                  {/* Année d'admission - Étudiant */}
                  {etudiantData?.anneeAdmission && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-theme-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-default-600 dark:text-default-400">
                          Année d'admission
                        </span>
                      </div>
                      <p className="text-sm font-medium ml-6">
                        {etudiantData.anneeAdmission}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Section informations spécifiques selon le rôle */}
        {enseignantData && (
          <div className="space-y-4">
            {/* Matières enseignées */}
            {enseignantData.matieres && enseignantData.matieres.length > 0 && (
              <Card className="border-none shadow-md">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-theme-primary" />
                    Matières enseignées
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {enseignantData.matieres.map((matiere) => (
                      <Chip
                        key={matiere.id}
                        color="primary"
                        size="sm"
                        variant="flat"
                      >
                        {matiere.nom}
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Niveaux enseignés */}
            {enseignantData.niveaux && enseignantData.niveaux.length > 0 && (
              <Card className="border-none shadow-md">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-theme-primary" />
                    Niveaux enseignés
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {enseignantData.niveaux.map((niveau) => (
                      <Chip
                        key={niveau.id}
                        color="secondary"
                        size="sm"
                        variant="flat"
                      >
                        {niveau.nom}
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {etudiantData && (
          <div className="space-y-4">
            {/* Matières inscrites */}
            {etudiantData.matieres && etudiantData.matieres.length > 0 && (
              <Card className="border-none shadow-md">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-theme-primary" />
                    Matières inscrites
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {etudiantData.matieres.map((matiere) => (
                      <Chip
                        key={matiere.id}
                        color="primary"
                        size="sm"
                        variant="flat"
                      >
                        {matiere.nom}
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Classes suivies */}
            {etudiantData.classes && etudiantData.classes.length > 0 && (
              <Card className="border-none shadow-md">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-theme-primary" />
                    Classes suivies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {etudiantData.classes.map((classe) => (
                      <Chip
                        key={classe.id}
                        color="secondary"
                        size="sm"
                        variant="flat"
                      >
                        {classe.nom}
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {/* Section supplémentaire - Activité */}
        <Card className="border-none shadow-md max-w-md lg:max-w-none w-full">
          <CardBody className="p-6">
            <h3 className="text-lg font-bold mb-4">Activité récente</h3>
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100 dark:hover:bg-default-100/5 transition-colors"
                  >
                    <div
                      className={`rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0 p-2`}
                    >
                      <div className={item.color}>{item.icon}</div>
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
            ) : (
              <p className="text-sm text-default-500 text-center py-4">
                Aucune activité récente
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal d'édition */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        profileData={profileData || (user as ProfileData)}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          // Recharger les données
          if (user?.role && user.role !== "admin") {
            mutateProfile();
          }
        }}
      />
    </DashboardContentArea>
  );
}
