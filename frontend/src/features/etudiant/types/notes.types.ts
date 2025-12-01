// Types pour les résultats et notes

/**
 * Détail d'une réponse corrigée
 */
export interface ReponseDetail {
  question_id: string;
  question_enonce: string;
  question_numero: number;
  reponse_etudiant: string | string[] | boolean;
  reponse_correcte?: string | string[] | boolean;
  est_correcte: boolean;
  points_obtenus: number;
  points_max: number;
  feedback?: string;
}

/**
 * Résultat d'un examen
 */
export interface Resultat {
  id: string;
  examen_id: string;
  examen_titre: string;
  matiere: string;
  note: number;
  note_max: number;
  pourcentage: number;
  statut: "en_attente" | "corrige";
  estPublie: boolean; // Contrôle visibilité pour l'étudiant
  date_passage: string;
  date_correction?: string;
  duree_secondes: number;
  nb_questions: number;
  nb_correctes: number;
  feedback_general?: string;
  reponses: ReponseDetail[];
  message?: string; // Message si résultat non publié
  afficherCorrection?: boolean; // Contrôle si la correction peut être affichée
}

/**
 * Historique des notes
 */
export interface HistoriqueNotes {
  resultats: ResultatSimple[];
  statistiques: {
    moyenne_generale: number;
    meilleure_note: number;
    moins_bonne_note: number;
    total_examens: number;
    taux_reussite: number;
  };
}

/**
 * Résultat simplifié pour la liste
 */
export interface ResultatSimple {
  id: string;
  examen_titre: string;
  matiere: string;
  note: number;
  note_max: number;
  pourcentage: number;
  date_passage: string;
  statut: "en_attente" | "corrige";
  estPublie?: boolean; // Optionnel pour compatibilité
}
