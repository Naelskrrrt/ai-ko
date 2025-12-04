/**
 * Transformateurs pour convertir les données backend vers les formats frontend
 */

import type { Examen, Question } from "../types/examens.types";
import type { Resultat } from "../types/notes.types";

/**
 * Type pour une question backend
 */
interface QuestionBackend {
  id: string;
  numero?: number;
  enonce: string;
  type_question: string;
  options?: any[];
  points: number;
  aide?: string;
  explication?: string;
}

/**
 * Type pour un résultat backend
 */
interface ResultatBackend {
  id: string;
  etudiantId: string;
  sessionId: string;
  session?: {
    id: string;
    titre: string;
  };
  qcmId: string;
  qcm?: {
    id: string;
    titre: string;
    matiere?: string;
  };
  noteSur20?: number;
  pourcentage?: number;
  scoreTotal: number;
  scoreMaximum: number;
  status: string;
  estPublie?: boolean;
  dateDebut: string;
  dateFin?: string;
  dureeReelleSecondes?: number;
  questionsTotal: number;
  questionsRepondues: number;
  questionsCorrectes: number;
  questionsIncorrectes: number;
  feedbackAuto?: string;
  commentaireProf?: string;
  reponsesDetail?: Record<string, any>;
}

/**
 * Transforme une session backend en Examen frontend
 */
export function transformSessionToExamen(session: any): Examen {
  // Gérer les deux formats possibles (snake_case et camelCase)
  const dateDebut = session.dateDebut || session.date_debut;
  const dateFin = session.dateFin || session.date_fin;
  const dureeMinutes = session.dureeMinutes || session.duree_minutes || 0;
  const nombreQuestions =
    session.nombreQuestions || session.nombre_questions || 0;
  const totalPoints = session.totalPoints || session.total_points || 0;
  const tentativesMax = session.tentativesMax || session.tentatives_max || 1;

  // Récupérer la matière depuis qcm si disponible
  const matiere = session.matiere || session.qcm?.matiere || "Non spécifiée";

  // Récupérer le niveau
  const niveau =
    session.niveau || session.classe?.niveau?.nom || "Non spécifié";

  return {
    id: session.id,
    titre: session.titre,
    description: session.description,
    matiere: matiere,
    niveau: niveau,
    date_debut: dateDebut || "",
    date_fin: dateFin || "",
    duree_minutes: dureeMinutes,
    nombre_questions: nombreQuestions,
    total_points: totalPoints,
    statut: (session.statut ||
      mapStatusToFrontend(session.status || "programmee")) as Examen["statut"],
    tentatives_restantes: tentativesMax,
  };
}

/**
 * Transforme une question backend en Question frontend
 */
export function transformQuestionToQuestion(
  question: QuestionBackend,
): Question {
  // Extraire les textes des options si ce sont des objets
  let options: string[] = [];

  if (question.options && Array.isArray(question.options)) {
    options = question.options.map((opt: any) => {
      if (typeof opt === "string") {
        return opt;
      }

      // Si c'est un objet avec 'texte' ou 'text'
      return opt.texte || opt.text || String(opt);
    });
  }

  return {
    id: question.id,
    numero: question.numero || 0,
    enonce: question.enonce,
    type_question: mapTypeQuestion(question.type_question),
    options: options,
    points: question.points,
    aide: question.aide || question.explication,
  };
}

/**
 * Transforme un résultat backend en Resultat frontend
 */
export function transformResultatToResultat(
  resultat: ResultatBackend,
): Resultat {
  return {
    id: resultat.id,
    examen_id: resultat.sessionId,
    examen_titre: resultat.session?.titre || "Examen",
    matiere: resultat.qcm?.matiere || "Non spécifiée",
    note: resultat.noteSur20 || 0,
    note_max: 20,
    pourcentage: resultat.pourcentage || 0,
    statut: resultat.status === "termine" ? "corrige" : "en_attente",
    estPublie: resultat.estPublie ?? false,
    date_passage: resultat.dateDebut,
    date_correction: resultat.dateFin,
    duree_secondes: resultat.dureeReelleSecondes || 0,
    nb_questions: resultat.questionsTotal,
    nb_correctes: resultat.questionsCorrectes,
    feedback_general: resultat.feedbackAuto || resultat.commentaireProf,
    reponses: transformReponsesDetail(resultat.reponsesDetail || {}),
  };
}

/**
 * Transforme les détails des réponses
 */
function transformReponsesDetail(
  reponsesDetail: Record<string, any>,
): Resultat["reponses"] {
  return Object.entries(reponsesDetail).map(([questionId, detail]) => ({
    question_id: questionId,
    question_enonce: detail.question_enonce || "",
    question_numero: detail.question_numero || 0,
    reponse_etudiant: detail.answer || detail.reponse_etudiant,
    reponse_correcte: detail.correct_answer || detail.reponse_correcte,
    est_correcte: detail.correct || detail.est_correcte || false,
    points_obtenus: detail.score || detail.points_obtenus || 0,
    points_max: detail.max_score || detail.points_max || 0,
    feedback: detail.feedback || "",
  }));
}

/**
 * Mappe le statut backend vers le statut frontend
 */
function mapStatusToFrontend(status: string): Examen["statut"] {
  const statusMap: Record<string, Examen["statut"]> = {
    programmee: "disponible",
    en_cours: "en_cours",
    terminee: "termine",
    annulee: "termine",
  };

  return statusMap[status] || "disponible";
}

/**
 * Mappe le type de question backend vers le type frontend
 */
function mapTypeQuestion(type: string): Question["type_question"] {
  const typeMap: Record<string, Question["type_question"]> = {
    qcm: "qcm",
    vrai_faux: "vrai_faux",
    texte_libre: "texte_libre",
  };

  return typeMap[type] || "qcm";
}
