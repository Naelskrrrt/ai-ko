// Types pour les examens étudiants

/**
 * Type de question
 */
export type TypeQuestion = "qcm" | "vrai_faux" | "texte_libre";

/**
 * Statut d'un examen pour l'étudiant
 */
export type StatutExamen = "disponible" | "en_cours" | "termine";

/**
 * Question d'un examen
 */
export interface Question {
  id: string;
  numero: number;
  enonce: string;
  type_question: TypeQuestion;
  options: string[]; // Pour QCM et Vrai/Faux
  points: number;
  aide?: string;
}

/**
 * Examen (vue étudiant)
 */
export interface Examen {
  id: string;
  titre: string;
  description?: string;
  matiere: string;
  niveau: string;
  date_debut: string;
  date_fin: string;
  duree_minutes: number;
  nombre_questions: number;
  total_points: number;
  statut: StatutExamen;
  tentatives_restantes?: number;
  questions?: Question[]; // Chargé uniquement lors du passage
  progression?: number; // Pourcentage de complétion (0-100)
}

/**
 * Réponse à une question
 */
export interface Reponse {
  question_id: string;
  reponse: string | string[] | boolean;
  temps_passe_secondes?: number;
}

/**
 * Données de démarrage d'un examen
 */
export interface StartExamResponse {
  session_id: string;
  examen: Examen;
  duree_restante_secondes: number;
  date_debut_examen?: string; // Date de début de l'examen (ISO string)
  duree_totale_secondes?: number; // Durée totale de l'examen en secondes
  questions: Question[];
  reponses_sauvegardees?: Record<string, any>;
}

/**
 * Données de soumission d'un examen
 */
export interface SubmitExamRequest {
  session_id: string;
  reponses: Record<string, any>;
  temps_total_secondes: number;
}

/**
 * Réponse après soumission
 */
export interface SubmitExamResponse {
  resultat_id: string;
  message: string;
  note?: number;
  note_max?: number;
  pourcentage?: number;
}
