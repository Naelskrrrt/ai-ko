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
import { Textarea } from "@heroui/input";
import { Download, User, Mail, Phone, MapPin, Calendar, Award, Edit2, Save, X, RefreshCw } from "lucide-react";
import useSWR from "swr";

import { sessionService } from "../../services/session.service";
import { downloadPDF } from "@/lib/pdf-utils";
import { useToast } from "@/hooks/use-toast";

interface DetailEtudiantModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultatId: string;
}

export function DetailEtudiantModal({
  isOpen,
  onClose,
  resultatId,
}: DetailEtudiantModalProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);
  const [isEditingComment, setIsEditingComment] = React.useState(false);
  const [commentaire, setCommentaire] = React.useState("");
  const [isSavingComment, setIsSavingComment] = React.useState(false);
  const [isRegeneratingComment, setIsRegeneratingComment] = React.useState(false);

  // Récupérer les détails complets
  const {
    data,
    isLoading,
    error,
    mutate,
  } = useSWR(
    isOpen && resultatId ? ["details-etudiant", resultatId] : null,
    () => sessionService.getDetailsEtudiant(resultatId),
  );

  // Initialiser le commentaire quand les données sont chargées
  React.useEffect(() => {
    if (data?.resultat?.commentaireProf) {
      setCommentaire(data.resultat.commentaireProf);
    } else {
      setCommentaire("");
    }
    setIsEditingComment(false);
  }, [data]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const blob = await sessionService.exporterPDFResultat(resultatId);
      const etudiantName = data?.etudiant?.name?.replace(/\s+/g, "_") || "etudiant";
      const filename = `resultat_${etudiantName}.pdf`;

      downloadPDF(blob, filename);
      toast({
        title: "Export réussi",
        description: "Le PDF a été téléchargé avec succès",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur export PDF:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export PDF",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveComment = async () => {
    try {
      setIsSavingComment(true);
      await sessionService.ajouterCommentaire(resultatId, commentaire);
      // Rafraîchir les données
      mutate();
      setIsEditingComment(false);
      toast({
        title: "Commentaire enregistré",
        description: "Le commentaire a été enregistré avec succès",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur sauvegarde commentaire:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la sauvegarde du commentaire",
        variant: "error",
      });
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleCancelEdit = () => {
    // Restaurer le commentaire original
    if (data?.resultat?.commentaireProf) {
      setCommentaire(data.resultat.commentaireProf);
    } else {
      setCommentaire("");
    }
    setIsEditingComment(false);
  };

  const handleRegenererCommentaire = async () => {
    try {
      setIsRegeneratingComment(true);
      const result = await sessionService.regenererCommentaire(resultatId);
      // Rafraîchir les données
      mutate();
      // Mettre à jour le commentaire local
      if (result.commentaireProf) {
        setCommentaire(result.commentaireProf);
      }
      toast({
        title: "Commentaire régénéré",
        description: "Le commentaire a été régénéré avec succès",
        variant: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur régénération commentaire:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la régénération du commentaire",
        variant: "error",
      });
    } finally {
      setIsRegeneratingComment(false);
    }
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} size="3xl" onClose={onClose}>
        <ModalContent>
          <ModalHeader>Chargement...</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-default-100 animate-pulse rounded-lg"
                />
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (error || !data) {
    return (
      <Modal isOpen={isOpen} size="md" onClose={onClose}>
        <ModalContent>
          <ModalHeader>Erreur</ModalHeader>
          <ModalBody>
            <p className="text-danger">
              Impossible de charger les détails de l'étudiant
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

  const { resultat, etudiant } = data;
  const etudiantProfil = etudiant.etudiantProfil;

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Détails de l'étudiant</span>
            </div>
            <Button
              color="primary"
              isLoading={isExporting}
              size="sm"
              startContent={!isExporting && <Download className="h-4 w-4" />}
              variant="flat"
              onPress={handleExportPDF}
            >
              Exporter PDF
            </Button>
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
                      <p className="font-medium">{etudiant.name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">Email</p>
                      <p className="font-medium">{etudiant.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">Téléphone</p>
                      <p className="font-medium">
                        {etudiant.telephone || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-default-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-default-500">
                        Date de naissance
                      </p>
                      <p className="font-medium">
                        {etudiant.dateNaissance
                          ? new Date(etudiant.dateNaissance).toLocaleDateString(
                              "fr-FR",
                            )
                          : "Non renseignée"}
                      </p>
                    </div>
                  </div>

                  {etudiant.adresse && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-default-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-default-500">Adresse</p>
                        <p className="font-medium">{etudiant.adresse}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Informations académiques */}
            {etudiantProfil && (
              <Card className="border-none shadow-sm">
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4">
                    Informations Académiques
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {etudiantProfil.numeroEtudiant && (
                      <div>
                        <p className="text-sm text-default-500">
                          Numéro étudiant
                        </p>
                        <p className="font-medium">
                          {etudiantProfil.numeroEtudiant}
                        </p>
                      </div>
                    )}

                    {etudiantProfil.niveauActuel && (
                      <div>
                        <p className="text-sm text-default-500">
                          Niveau actuel
                        </p>
                        <Chip color="primary" size="sm" variant="flat">
                          {etudiantProfil.niveauActuel}
                        </Chip>
                      </div>
                    )}

                    {etudiantProfil.classeActuelle && (
                      <div>
                        <p className="text-sm text-default-500">
                          Classe actuelle
                        </p>
                        <p className="font-medium">
                          {etudiantProfil.classeActuelle}
                        </p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Résultats de l'examen */}
            <Card className="border-none shadow-sm">
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">
                  Résultats de l'Examen
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                    <div>
                      <p className="text-sm text-default-500">Note obtenue</p>
                      <p className="text-3xl font-bold text-primary">
                        {resultat.noteSur20?.toFixed(2) || "N/A"} / 20
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-default-500">Pourcentage</p>
                      <p className="text-2xl font-semibold">
                        {resultat.pourcentage?.toFixed(1) || "N/A"}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-default-100 rounded-lg">
                      <p className="text-xs text-default-500">Questions</p>
                      <p className="text-lg font-semibold">
                        {resultat.questionsTotal}
                      </p>
                    </div>

                    <div className="text-center p-3 bg-success-50 rounded-lg">
                      <p className="text-xs text-success-600">Correctes</p>
                      <p className="text-lg font-semibold text-success">
                        {resultat.questionsCorrectes}
                      </p>
                    </div>

                    <div className="text-center p-3 bg-danger-50 rounded-lg">
                      <p className="text-xs text-danger-600">Incorrectes</p>
                      <p className="text-lg font-semibold text-danger">
                        {resultat.questionsIncorrectes}
                      </p>
                    </div>

                    <div className="text-center p-3 bg-default-100 rounded-lg">
                      <p className="text-xs text-default-500">Durée</p>
                      <p className="text-lg font-semibold">
                        {resultat.dureeReelleSecondes
                          ? `${Math.floor(resultat.dureeReelleSecondes / 60)}min`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Award
                      className={`h-5 w-5 ${resultat.estReussi ? "text-success" : "text-danger"}`}
                    />
                    <Chip
                      color={resultat.estReussi ? "success" : "danger"}
                      variant="flat"
                    >
                      {resultat.estReussi ? "Réussi" : "Échoué"}
                    </Chip>
                    <Chip
                      color={resultat.estPublie ? "primary" : "warning"}
                      variant="flat"
                    >
                      {resultat.estPublie ? "Publié" : "Non publié"}
                    </Chip>
                  </div>

                  {/* Section commentaire */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-default-700">
                        Commentaire de l'enseignant
                      </p>
                      {!isEditingComment && (
                        <div className="flex gap-2">
                          <Button
                            color="default"
                            size="sm"
                            startContent={<RefreshCw className="h-4 w-4" />}
                            variant="flat"
                            isLoading={isRegeneratingComment}
                            onPress={handleRegenererCommentaire}
                          >
                            Régénérer
                          </Button>
                          <Button
                            color="default"
                            size="sm"
                            startContent={<Edit2 className="h-4 w-4" />}
                            variant="flat"
                            onPress={() => setIsEditingComment(true)}
                          >
                            {resultat.commentaireProf ? "Modifier" : "Ajouter"}
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditingComment ? (
                      <div className="space-y-2">
                        <Textarea
                          label="Commentaire"
                          placeholder="Ajoutez un commentaire pour cet étudiant..."
                          value={commentaire}
                          onValueChange={(value) => {
                            // Limiter à 200 caractères
                            if (value.length <= 200) {
                              setCommentaire(value);
                            }
                          }}
                          minRows={3}
                          maxRows={6}
                          maxLength={200}
                          description={`${commentaire.length}/200 caractères${commentaire.length > 100 ? ' (idéal: 100)' : ''}`}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            color="default"
                            size="sm"
                            startContent={<X className="h-4 w-4" />}
                            variant="flat"
                            onPress={handleCancelEdit}
                          >
                            Annuler
                          </Button>
                          <Button
                            color="primary"
                            isLoading={isSavingComment}
                            size="sm"
                            startContent={!isSavingComment && <Save className="h-4 w-4" />}
                            onPress={handleSaveComment}
                          >
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      resultat.commentaireProf ? (
                        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                          <p className="text-sm text-primary-700 whitespace-pre-wrap">
                            {resultat.commentaireProf}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-default-50 border border-default-200 rounded-lg">
                          <p className="text-sm text-default-400 italic">
                            Aucun commentaire pour le moment
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
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

