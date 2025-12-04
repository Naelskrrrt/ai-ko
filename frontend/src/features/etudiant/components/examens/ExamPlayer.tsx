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
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Shield,
} from "lucide-react";

import { examensService } from "../../services/examens.service";
import { Question } from "../../types/examens.types";

import { QuestionDisplay } from "./QuestionDisplay";
import { ExamTimer } from "./ExamTimer";

import { useToast } from "@/hooks/use-toast";

interface ExamPlayerProps {
  examId: string;
  userId: string;
}

export function ExamPlayer({ examId, userId }: ExamPlayerProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [, setDateDebutExamen] = useState<string>("");
  const [, setDureeTotaleSecondes] = useState<number>(0);

  const {
    isOpen: isSubmitModalOpen,
    onOpen: onSubmitModalOpen,
    onClose: onSubmitModalClose,
  } = useDisclosure();
  const autoSaveInterval = useRef<NodeJS.Timeout>();
  const timerInterval = useRef<NodeJS.Timeout>();

  // Charger l'examen
  const { data: examen, isLoading } = useSWR(
    ["examen", examId],
    () => examensService.getById(examId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Démarrer l'examen au chargement (seulement si on est sur la page /start)
  useEffect(() => {
    if (examen && !isExamStarted && typeof window !== "undefined") {
      // Vérifier qu'on est bien sur la page /start
      if (window.location.pathname.includes("/start")) {
        startExam();
      }
    }
  }, [examen, isExamStarted]);

  const startExam = async () => {
    try {
      const response = await examensService.startExam(examId, userId);

      // eslint-disable-next-line no-console
      console.log("StartExam response:", response);

      setSessionId(response.session_id);
      setTimeRemaining(response.duree_restante_secondes);
      setDateDebutExamen(response.date_debut_examen || "");
      setDureeTotaleSecondes(response.duree_totale_secondes || 0);
      setIsExamStarted(true);

      // Stocker les questions retournées par startExam
      if (response.questions && response.questions.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`✅ ${response.questions.length} questions chargées`);
        setQuestions(response.questions);
      } else {
        // eslint-disable-next-line no-console
        console.error("❌ Aucune question dans la réponse:", response);
        toast({
          title: "Erreur",
          description: "Aucune question disponible pour cet examen",
          variant: "error",
        });
        router.push("/etudiant/examens");

        return;
      }

      // Charger les réponses sauvegardées si elles existent
      if (response.reponses_sauvegardees) {
        setReponses(response.reponses_sauvegardees);
      }

      toast({
        title: "Examen démarré",
        description: "Le chronomètre a commencé. Bonne chance !",
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur lors du démarrage de l'examen:", error);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          error.message ||
          "Erreur lors du démarrage de l'examen",
        variant: "error",
      });
      router.push("/etudiant/examens");
    }
  };

  // Timer countdown avec auto-submit et vérification périodique avec le serveur
  useEffect(() => {
    if (!isExamStarted || !sessionId || timeRemaining <= 0) return;

    // Vérifier le temps restant avec le serveur toutes les 10 secondes pour éviter la triche
    const syncInterval = setInterval(async () => {
      try {
        const timeData = await examensService.getTimeRemaining(sessionId);
        const serverTimeRemaining = timeData.duree_restante_secondes;

        // Utiliser le temps du serveur (source de vérité)
        setTimeRemaining(serverTimeRemaining);

        if (serverTimeRemaining <= 0) {
          handleAutoSubmit();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Erreur lors de la synchronisation du temps:", error);
        // En cas d'erreur, continuer avec le timer local mais décrémenter
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();

            return 0;
          }

          return prev - 1;
        });
      }
    }, 10000); // Vérifier toutes les 10 secondes

    // Timer local pour l'affichage (décrémente chaque seconde)
    timerInterval.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isExamStarted, sessionId, timeRemaining]);

  // Auto-save des réponses toutes les 30 secondes
  useEffect(() => {
    if (!isExamStarted || !sessionId) return;

    autoSaveInterval.current = setInterval(() => {
      saveAnswers();
    }, 30000); // 30 secondes

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [isExamStarted, sessionId, reponses]);

  // Bloquer la navigation (back button, refresh, fermeture)
  useEffect(() => {
    if (!isExamStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";

      return "";
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      toast({
        title: "Navigation bloquée",
        description: "Vous ne pouvez pas quitter l'examen en cours",
        variant: "warning",
      });
    };

    // Désactiver le clic droit
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Détecter les changements de visibilité (changement d'onglet)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // eslint-disable-next-line no-console
        console.warn("⚠️ Changement d'onglet détecté");
        // Optionnel: enregistrer l'événement côté backend
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Pousser un état initial pour empêcher le back
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isExamStarted]);

  const saveAnswers = async () => {
    if (!sessionId) return;

    try {
      await examensService.saveAnswers(examId, sessionId, reponses);
      // eslint-disable-next-line no-console
      console.log("✅ Réponses sauvegardées automatiquement");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Erreur lors de la sauvegarde automatique:", error);
    }
  };

  const handleReponseChange = (questionId: string, reponse: any) => {
    setReponses((prev) => ({
      ...prev,
      [questionId]: reponse,
    }));
  };

  const handleNextQuestion = () => {
    if (examQuestions && currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = async () => {
    if (!sessionId) {
      // eslint-disable-next-line no-console
      console.error("Session ID manquant pour la soumission automatique");

      return;
    }
    toast({
      title: "Temps écoulé",
      description: "Votre examen est soumis automatiquement",
      variant: "warning",
    });
    await submitExam();
  };

  const handleSubmitClick = () => {
    onSubmitModalOpen();
  };

  const submitExam = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const tempsTotal = examen?.duree_minutes
        ? examen.duree_minutes * 60 - timeRemaining
        : 0;

      // Utiliser sessionId (qui est en fait le resultat_id) au lieu de examId
      if (!sessionId) {
        toast({
          title: "Erreur",
          description: "Session ID manquant. Impossible de soumettre l'examen.",
          variant: "error",
        });

        return;
      }

      const response = await examensService.submitExam(
        sessionId,
        userId,
        reponses,
        tempsTotal,
      );

      // Nettoyer les intervals
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);

      toast({
        title: "Examen soumis",
        description: "Votre examen a été soumis avec succès",
      });

      // Rediriger vers la page de résultat
      // Utiliser sessionId (resultat_id) pour la redirection
      if (response?.resultat_id) {
        router.push(`/etudiant/notes/${response.resultat_id}`);
      } else {
        router.push(`/etudiant/examens`);
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

  if (isLoading || !examen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center py-12">
            <p className="text-lg">Chargement de l'examen...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Utiliser les questions de l'état si disponibles, sinon celles de l'examen
  const examQuestions =
    questions.length > 0 ? questions : examen.questions || [];

  if (!isExamStarted || examQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center py-12">
            {!isExamStarted ? (
              <>
                <p className="text-lg">Démarrage de l'examen...</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
                <p className="text-lg font-semibold">
                  Aucune question disponible
                </p>
                <Button
                  className="mt-4"
                  onPress={() => router.push("/etudiant/examens")}
                >
                  Retour aux examens
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  const currentQuestion = examQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;
  const nbReponses = Object.keys(reponses).filter((k) => {
    const r = reponses[k];

    return r !== null && r !== undefined && r !== "";
  }).length;

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-4">
      {/* Header fixe */}
      <Card className="sticky top-0 z-10 shadow-lg">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-theme-primary" />
              <div>
                <h1 className="text-xl font-bold">{examen.titre}</h1>
                <p className="text-sm text-default-500">{examen.matiere}</p>
              </div>
            </div>
            <ExamTimer timeRemaining={timeRemaining} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-default-500">
                {nbReponses} / {examQuestions.length} répondu
                {nbReponses > 1 ? "s" : ""}
              </span>
            </div>
            <Progress
              className="max-w-full [&>div]:bg-theme-primary border-theme-primary"
              size="sm"
              value={progress}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Question actuelle */}
      <QuestionDisplay
        numero={currentQuestionIndex + 1}
        question={currentQuestion}
        reponse={reponses[currentQuestion.id]}
        showAide={false} // Ne pas afficher l'aide pendant l'examen
        total={examQuestions.length}
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

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-default-400" />
              <span className="text-xs text-default-500">
                Mode sécurisé activé
              </span>
            </div>

            {currentQuestionIndex === examQuestions.length - 1 ? (
              <Button
                color="success"
                endContent={<Send className="h-4 w-4" />}
                onPress={handleSubmitClick}
              >
                Soumettre l'examen
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
              <p>Êtes-vous sûr de vouloir soumettre votre examen ?</p>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="text-sm text-warning-700">
                    <p className="font-semibold">Attention :</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Vous avez répondu à {nbReponses} sur{" "}
                        {examQuestions.length} questions
                      </li>
                      <li>
                        Une fois soumis, vous ne pourrez plus modifier vos
                        réponses
                      </li>
                      <li>
                        Temps restant: {Math.floor(timeRemaining / 60)} minutes
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
                submitExam();
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
