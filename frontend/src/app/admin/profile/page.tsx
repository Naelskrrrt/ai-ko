"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { User, Mail, Shield, Calendar, Edit } from "lucide-react";
import { useDisclosure } from "@heroui/modal";

import { useAuth } from "@/core/providers/AuthProvider";
import { EditProfileModal } from "@/features/profile/components/EditProfileModal";

export default function AdminProfilePage() {
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-default-500">Chargement...</p>
      </div>
    );
  }

  const profileData = user
    ? {
        ...user,
        role: "admin" as const,
      }
    : null;

  return (
    <>
      <EditProfileModal
        isOpen={isOpen}
        onClose={onClose}
        profileData={profileData}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mon Profil</h1>
            <p className="text-default-500 mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Edit className="w-4 h-4" />}
            onPress={onOpen}
          >
            Modifier
          </Button>
        </div>

        {/* Informations du profil */}
        <Card className="border-none shadow-sm">
          <CardBody className="p-6">
            <div className="space-y-6">
              {/* Avatar et nom */}
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-6">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{user.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm text-default-500">
                      Administrateur
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-default-200">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-default-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-default-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {user.telephone && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">Téléphone</p>
                      <p className="font-medium">{user.telephone}</p>
                    </div>
                  </div>
                )}

                {user.dateNaissance && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">
                        Date de naissance
                      </p>
                      <p className="font-medium">
                        {new Date(user.dateNaissance).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {user.adresse && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">Adresse</p>
                      <p className="font-medium">{user.adresse}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
