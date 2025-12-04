"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  School,
  Award,
} from "lucide-react";

interface DetailEleveModalProps {
  isOpen: boolean;
  onClose: () => void;
  eleveId: string;
  eleveData?: {
    id: string;
    nom?: string;
    name?: string;
    email?: string;
    numero_etudiant?: string;
    numeroEtudiant?: string;
    telephone?: string;
    adresse?: string;
    dateNaissance?: string;
    niveau?: { nom: string; id: string };
    parcours?: { nom: string; id: string };
    mention?: { nom: string; id: string };
    etablissement?: { nom: string; id: string };
    anneeAdmission?: string;
    matieres?: Array<{ id: string; nom: string; code?: string }>;
  };
}

export function DetailEleveModal({
  isOpen,
  onClose,
  eleveId: _eleveId,
  eleveData,
}: DetailEleveModalProps) {
  // Les enseignants n'ont pas accès à l'endpoint admin
  // On utilise directement les données passées en prop
  if (!eleveData) {
    return (
      <Modal isOpen={isOpen} size="md" onClose={onClose}>
        <ModalContent>
          <ModalHeader>Erreur</ModalHeader>
          <ModalBody>
            <p className="text-danger">
              Impossible de charger les détails de l'élève
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" onPress={onClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const eleve = eleveData;

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>Détails de l'élève</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Informations personnelles */}
            <Card className="border-none shadow-sm">
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">
                  Informations Personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">Nom complet</p>
                      <p className="font-medium">
                        {eleve.name || eleve.nom || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">Email</p>
                      <p className="font-medium">{eleve.email || "N/A"}</p>
                    </div>
                  </div>

                  {eleve.telephone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">Téléphone</p>
                        <p className="font-medium">{eleve.telephone}</p>
                      </div>
                    </div>
                  )}

                  {eleve.dateNaissance && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">
                          Date de naissance
                        </p>
                        <p className="font-medium">
                          {new Date(eleve.dateNaissance).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {eleve.adresse && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">Adresse</p>
                        <p className="font-medium">{eleve.adresse}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">
                        Numéro étudiant
                      </p>
                      <p className="font-medium">
                        {eleve.numeroEtudiant || eleve.numero_etudiant || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Informations académiques */}
            <Card className="border-none shadow-sm">
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">
                  Informations Académiques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eleve.niveau && (
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">Niveau</p>
                        <Chip color="primary" size="sm" variant="flat">
                          {typeof eleve.niveau === "object"
                            ? eleve.niveau.nom
                            : eleve.niveau}
                        </Chip>
                      </div>
                    </div>
                  )}

                  {eleve.parcours && (
                    <div className="flex items-start gap-3">
                      <School className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">Parcours</p>
                        <p className="font-medium">
                          {typeof eleve.parcours === "object"
                            ? eleve.parcours.nom
                            : eleve.parcours}
                        </p>
                      </div>
                    </div>
                  )}

                  {eleve.mention && (
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">Mention</p>
                        <p className="font-medium">
                          {typeof eleve.mention === "object"
                            ? eleve.mention.nom
                            : eleve.mention}
                        </p>
                      </div>
                    </div>
                  )}

                  {eleve.etablissement && (
                    <div className="flex items-start gap-3">
                      <School className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">
                          Établissement
                        </p>
                        <p className="font-medium">
                          {typeof eleve.etablissement === "object"
                            ? eleve.etablissement.nom
                            : eleve.etablissement}
                        </p>
                      </div>
                    </div>
                  )}

                  {eleve.anneeAdmission && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">
                          Année d'admission
                        </p>
                        <p className="font-medium">{eleve.anneeAdmission}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Matières (si disponibles) */}
            {eleve.matieres &&
              Array.isArray(eleve.matieres) &&
              eleve.matieres.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardBody>
                    <h3 className="text-lg font-semibold mb-4">Matières</h3>
                    <div className="flex flex-wrap gap-2">
                      {eleve.matieres.map((matiere: any) => (
                        <Chip
                          key={matiere.id || matiere}
                          color="secondary"
                          size="sm"
                          variant="flat"
                        >
                          {typeof matiere === "object" ? matiere.nom : matiere}
                        </Chip>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="flat" onPress={onClose}>
            Fermer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
