/**
 * QCM disponible pour un étudiant (sans session d'examen)
 */
export interface QCMDisponible {
  id: string;
  titre: string;
  description?: string;
  duree: number; // en minutes
  matiere: string;
  matiereId?: string;
  difficultyLevel?: "facile" | "moyen" | "difficile";
  nombreQuestions: number;
  createdAt: string;
}

/**
 * Réponse pour vérifier l'accès à un QCM
 */
export interface AccesQCMResponse {
  canAccess: boolean;
}
