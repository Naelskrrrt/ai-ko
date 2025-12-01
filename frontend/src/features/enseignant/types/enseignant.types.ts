// Types pour le parcours enseignant

import { Mention } from "@/shared/types/mention.types";
import { Parcours } from "@/shared/types/parcours.types";

/**
 * QCM (Questionnaire à Choix Multiples)
 */
export interface QCM {
  id: string;
  titre: string;
  description?: string;
  duree: number; // durée en minutes
  matiere: string;
  status: "draft" | "published" | "archived";
  createurId: string;
  nombreQuestions: number;
  niveauId?: string;
  niveau?: Niveau;
  mentionId?: string;
  mention?: Mention;
  parcoursId?: string;
  parcours?: Parcours;
  createdAt: string;
  updatedAt: string;
}

/**
 * Données pour créer/modifier un QCM
 */
export interface QCMFormData {
  titre: string;
  description?: string;
  duree?: number;
  matiere?: string;
  matiereId?: string;
  niveauId?: string;
  mentionId?: string;
  parcoursId?: string;
  status?: "draft" | "published" | "archived";
}

/**
 * Question d'un QCM
 */
export interface Question {
  id: string;
  qcmId: string;
  enonce: string;
  typeQuestion: "qcm" | "qcm_multiple" | "vrai_faux" | "text";
  options: string[];
  reponseCorrecte: string | string[];
  points: number;
  explication?: string;
  ordre: number;
}

/**
 * Session d'examen
 */
export interface SessionExamen {
  id: string;
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  dureeMinutes: number;
  tentativesMax: number;
  melangeQuestions: boolean;
  melangeOptions: boolean;
  afficherCorrection: boolean;
  notePassage: number;
  status: "programmee" | "en_cours" | "en_pause" | "terminee" | "annulee";
  resultatsPublies: boolean; // Validation globale des résultats
  matiere?: string; // Matière récupérée depuis le QCM associé
  qcmId: string;
  qcm?: {
    id: string;
    titre: string;
  };
  classeId?: string;
  classe?: {
    id: string;
    code: string;
    nom: string;
  };
  niveauId?: string;
  niveau?: Niveau;
  mentionId?: string;
  mention?: Mention;
  parcoursId?: string;
  parcours?: Parcours;
  createurId: string;
  nombreParticipants: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Données pour créer/modifier une session
 */
export interface SessionFormData {
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  dureeMinutes: number;
  tentativesMax?: number;
  melangeQuestions?: boolean;
  melangeOptions?: boolean;
  afficherCorrection?: boolean;
  notePassage?: number;
  status?: "programmee" | "en_cours" | "terminee" | "annulee";
  qcmId: string;
  classeId?: string;
  niveauId?: string;
  mentionId?: string;
  parcoursId?: string;
}

/**
 * Tâche asynchrone (génération QCM, correction, etc.)
 */
export interface TaskStatus {
  task_id: string;
  status: "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE";
  result?: {
    status?: string;
    message?: string;
    progress?: number;
    qcm_id?: string;
    titre?: string;
    num_questions?: number;
    estimated_remaining_seconds?: number;
    elapsed_seconds?: number;
    [key: string]: any;
  };
  error?: string;
  qcm_id?: string;
  message?: string;
  estimated_duration_seconds?: number;
}

/**
 * Paramètres de génération de QCM depuis du texte
 */
export interface GenerateFromTextParams {
  titre: string;
  text: string;
  num_questions?: number;
  matiere?: string;
  niveau_id?: string;
  mention_id?: string;
  parcours_id?: string;
  duree?: number;
}

/**
 * Paramètres de génération de QCM depuis un document
 */
export interface GenerateFromDocumentParams {
  titre: string;
  file_content: string; // base64
  file_type: "pdf" | "docx";
  num_questions?: number;
  matiere?: string;
  niveau_id?: string;
  mention_id?: string;
  parcours_id?: string;
  duree?: number;
}

/**
 * Statistiques de l'enseignant
 */
export interface EnseignantStats {
  total_qcms: number;
  qcms_publies: number;
  qcms_brouillon: number;
  total_sessions: number;
  sessions_actives: number;
  total_etudiants: number;
  moyenne_reussite: number; // pourcentage
}

/**
 * Résultat d'un étudiant pour une session
 */
export interface ResultatEtudiant {
  id: string;
  etudiantId: string;
  etudiant: {
    id: string;
    name: string; // Nom complet de l'étudiant
    email: string;
  };
  sessionId: string;
  qcmId: string;
  note: number;
  noteMax: number;
  pourcentage: number;
  statut: "en_cours" | "termine" | "abandonne";
  estPublie: boolean; // Contrôle visibilité pour l'étudiant
  dateDebut: string;
  dateFin?: string;
  commentaireProf?: string;
  reponses: {
    questionId: string;
    reponse: string | string[];
    estCorrecte: boolean;
    points: number;
  }[];
}

/**
 * Filtres pour les résultats d'une session
 */
export interface ResultatsFilters {
  dateDebut?: string | null;
  dateFin?: string | null;
  statutPublication?: "tous" | "publie" | "non_publie";
  scoreMin?: number | null;
  scoreMax?: number | null;
  statutReussite?: "tous" | "reussi" | "echoue";
}

/**
 * Matière
 */
export interface Matiere {
  id: string;
  code: string;
  nom: string;
  description?: string;
}

/**
 * Niveau
 */
export interface Niveau {
  id: string;
  code: string;
  nom: string;
  ordre: number;
}

/**
 * Classe
 */
export interface Classe {
  id: string;
  code: string;
  nom: string;
  niveauId: string;
  niveau?: Niveau;
  nombreEtudiants: number;
}

/**
 * Statistiques complètes d'un QCM
 */
export interface QCMStatistics {
  nombre_soumissions: number;
  nombre_etudiants_uniques: number;
  moyenne_note_sur_20: number;
  moyenne_pourcentage: number;
  taux_reussite: number;
  note_min: number;
  note_max: number;
  note_mediane: number;
  duree_moyenne_secondes: number;
  distribution_notes: Array<{
    tranche: string;
    nombre: number;
  }>;
  statistiques_par_question: Array<{
    question_id: string;
    question_enonce: string;
    question_numero: number;
    taux_reussite: number;
    nombre_reponses: number;
    nombre_correctes: number;
    reponses_frequentes: Array<{
      reponse: string;
      nombre: number;
    }>;
  }>;
  resultats: Array<{
    id: string;
    etudiant_id: string;
    etudiant_nom: string;
    etudiant_email: string;
    note_sur_20: number | null;
    pourcentage: number | null;
    questions_correctes: number;
    questions_total: number;
    duree_secondes: number | null;
    date_fin: string | null;
    est_reussi: boolean;
  }>;
  qcm: {
    id: string;
    titre: string;
    nombre_questions: number;
    duree_minutes: number | null;
  };
}
