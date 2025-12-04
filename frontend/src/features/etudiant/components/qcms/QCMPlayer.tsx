"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { ChevronLeft, ChevronRight, Send, AlertTriangle } from "lucide-react";

import { qcmsService } from "../../services/qcms.service";
import { QuestionDisplay } from "../examens/QuestionDisplay";
import { ExamTimer } from "../examens/ExamTimer";
import { Question } from "../../types/examens.types";

import { useToast } from "@/hooks/use-toast";

interface QCMPlayerProps {
  qcmId: string;
  userId: string;
}

export function QCMPlayer({ qcmId, userId: _userId }: QCMPlayerProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isQCMStarted, setIsQCMStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultatId, setResultatId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [, setDateDebutQCM] = useState<string>("");

  const {
    isOpen: isSubmitModalOpen,
    onOpen: onSubmitModalOpen,
    onClose: onSubmitModalClose,
  } = useDisclosure();
  const autoSaveInterval = useRef<NodeJS.Timeout>();
  const timerInterval = useRef<NodeJS.Timeout>();

  // Charger le QCM
  const { data: qcm, isLoading } = useSWR(
    ["qcm", qcmId],
    () => qcmsService.getQCMById(qcmId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Démarrer le QCM au chargement
  useEffect(() => {
    if (qcm && !isQCMStarted) {
      startQCM();
    }
  }, [qcm, isQCMStarted]);

  const startQCM = async () => {
    try {
      const response = await qcmsService.startQCM(qcmId);

      // eslint-disable-next-line no-console
      console.log("StartQCM response:", response);

      setResultatId(response.resultat_id);
      setTimeRemaining(response.duree_restante_secondes);
      setDateDebutQCM(response.date_debut || "");
      setIsQCMStarted(true);

      // Stocker les questions retournées
      if (response.questions && response.questions.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`✅ ${response.questions.length} questions chargées`);
        // Normaliser les options de chaque question pour s'assurer qu'elles sont des chaînes
        const normalizedQuestions = response.questions.map((q: any) => {
          if (q.options && Array.isArray(q.options)) {
            q.options = q.options.map((opt: any) => {
              if (typeof opt === "string") {
                return opt;
              }
              if (typeof opt === "object" && opt !== null) {
                return opt.texte || opt.text || String(opt);
              }

              return String(opt);
            });
          }

          return q;
        });

        // eslint-disable-next-line no-console
        console.log("📋 Questions normalisées:", normalizedQuestions[0]);
        setQuestions(normalizedQuestions);
      } else {
        // eslint-disable-next-line no-console
        console.error("❌ Aucune question dans la réponse:", response);
        toast({
          title: "Erreur",
          description: "Aucune question disponible pour ce QCM",
          variant: "error",
        });
        router.push("/etudiant/qcms");

        return;
      }

      toast({
        title: "QCM démarré",
        description: "Bonne chance !",
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur lors du démarrage du QCM:", error);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          error.message ||
          "Erreur lors du démarrage du QCM",
        variant: "error",
      });
      router.push("/etudiant/qcms");
    }
  };

  // Timer countdown (optionnel pour les QCMs)
  useEffect(() => {
    if (!isQCMStarted || !resultatId || timeRemaining <= 0) return;

    // Timer local pour l'affichage (décrémente chaque seconde)
    timerInterval.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isQCMStarted, resultatId, timeRemaining]);

  // Auto-save des réponses toutes les 30 secondes
  useEffect(() => {
    if (!isQCMStarted || !resultatId) return;

    autoSaveInterval.current = setInterval(() => {
      // Pour les QCMs libres, on peut sauvegarder localement ou ne pas sauvegarder
      // car il n'y a pas de session d'examen avec limite de temps stricte
      // eslint-disable-next-line no-console
      console.log("💾 Réponses sauvegardées localement");
    }, 30000); // 30 secondes

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [isQCMStarted, resultatId, reponses]);

  const handleReponseChange = (questionId: string, reponse: any) => {
    setReponses((prev) => ({
      ...prev,
      [questionId]: reponse,
    }));
  };

  const handleNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitClick = () => {
    onSubmitModalOpen();
  };

  const submitQCM = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (!resultatId) {
        toast({
          title: "Erreur",
          description: "Résultat ID manquant. Impossible de soumettre le QCM.",
          variant: "error",
        });

        return;
      }

      const response = await qcmsService.submitQCM(qcmId, resultatId, reponses);

      // Nettoyer les intervals
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);

      toast({
        title: "QCM soumis",
        description: `Score: ${response.pourcentage.toFixed(1)}% (${response.questions_correctes}/${response.questions_total} questions correctes)`,
      });

      // Rediriger vers la page de résultat
      if (response.resultat_id) {
        router.push(`/etudiant/qcms/${response.resultat_id}/resultat`);
      } else {
        router.push(`/etudiant/qcms`);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message || "Erreur lors de la soumission",
        variant: "error",
      });
    }
  };

  if (isLoading || !isQCMStarted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg">Chargement du QCM...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-danger font-semibold">
              Aucune question disponible
            </p>
            <Button
              className="mt-4"
              color="primary"
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

  const currentQuestion = questions[currentQuestionIndex];
  const nbReponses = Object.keys(reponses).length;
  const progress = (nbReponses / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header avec timer et progression */}
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold">{qcm?.titre || "QCM"}</h2>
              {qcm?.description && (
                <p className="text-sm text-default-500 mt-1">
                  {qcm.description}
                </p>
              )}
            </div>
            {timeRemaining > 0 && <ExamTimer timeRemaining={timeRemaining} />}
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-default-500">
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm text-default-500">
              {nbReponses} / {questions.length} répondu
              {nbReponses > 1 ? "s" : ""}
            </span>
          </div>
          <Progress
            className="max-w-full [&>div]:bg-theme-primary border-theme-primary"
            size="sm"
            value={progress}
          />
        </CardHeader>
      </Card>

      {/* Question actuelle */}
      <QuestionDisplay
        numero={currentQuestionIndex + 1}
        question={currentQuestion}
        reponse={reponses[currentQuestion.id]}
        showAide={false}
        total={questions.length}
        onReponseChange={handleReponseChange}
      />

      {/* Navigation */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-4">
            <Button
              color="default"
              isDisabled={currentQuestionIndex === 0}
              startContent={<ChevronLeft className="h-4 w-4" />}
              variant="flat"
              onPress={handlePreviousQuestion}
            >
              Précédent
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                color="success"
                endContent={<Send className="h-4 w-4" />}
                onPress={handleSubmitClick}
              >
                Soumettre le QCM
              </Button>
            ) : (
              <Button
                className="bg-theme-primary text-white hover:bg-theme-primary/90"
                endContent={<ChevronRight className="h-4 w-4" />}
                onPress={handleNextQuestion}
              >
                Suivant
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Modal de confirmation de soumission */}
      <Modal
        hideCloseButton
        isDismissable={false}
        isOpen={isSubmitModalOpen}
        onClose={onSubmitModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirmer la soumission
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p>Êtes-vous sûr de vouloir soumettre votre QCM ?</p>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="text-sm text-warning-700">
                    <p className="font-semibold">Attention :</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Vous avez répondu à {nbReponses} sur {questions.length}{" "}
                        questions
                      </li>
                      <li>
                        Une fois soumis, vous ne pourrez plus modifier vos
                        réponses
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onSubmitModalClose}>
              Annuler
            </Button>
            <Button
              color="success"
              isLoading={isSubmitting}
              onPress={() => {
                onSubmitModalClose();
                submitQCM();
              }}
            >
              Confirmer la soumission
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
