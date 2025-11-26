// Types pour le parcours étudiant

/**
 * Statistiques globales de l'étudiant
 */
export interface EtudiantStats {
  examens_passes: number
  examens_en_attente: number
  moyenne_generale: number
  taux_reussite: number // pourcentage
  meilleure_note: number
  moins_bonne_note: number
}

/**
 * Examen à venir
 */
export interface UpcomingExam {
  id: string
  titre: string
  matiere: string
  date_debut: string
  date_fin: string
  duree_minutes: number
  niveau: string
  est_commence: boolean
  nombre_questions: number
}

/**
 * Résultat récent d'un examen
 */
export interface RecentResult {
  id: string
  examen_id: string  // ID de la session/examen pour la redirection
  examen_titre: string
  matiere: string
  note: number
  note_max: number
  pourcentage: number
  statut: 'en_attente' | 'corrige'
  date_passage: string
  feedback?: string
}
