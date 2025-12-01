/**
 * Types pour la gestion des élèves par les enseignants
 */

export interface EleveBase {
  id: string;
  userId: string;
  name: string;
  email: string;
  numeroEtudiant: string;
  avatar?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  anneeAdmission?: string;
  etablissementId: string;
  etablissement?: {
    id: string;
    nom: string;
  };
  mentionId?: string;
  mention?: {
    id: string;
    nom: string;
  };
  parcoursId?: string;
  parcours?: {
    id: string;
    nom: string;
  };
  niveauId?: string;
  niveau?: {
    id: string;
    nom: string;
    code?: string;
  };
  matieres?: Array<{
    id: string;
    nom: string;
    code?: string;
  }>;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EleveFilters {
  matiere_id?: string;
  niveau_id?: string;
  parcours_id?: string;
  mention_id?: string;
  annee_scolaire?: string;
  page?: number;
  per_page?: number;
}

export interface ElevesListResponse {
  items: EleveBase[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ResultatEleve {
  id: string;
  etudiantId: string;
  sessionId?: string;
  qcmId: string;
  qcm?: {
    id: string;
    titre: string;
    matiere?: string;
  };
  session?: {
    id: string;
    titre: string;
  };
  numeroTentative: number;
  dateDebut: string;
  dateFin?: string;
  scoreTotal: number;
  scoreMaximum: number;
  noteSur20?: number;
  pourcentage?: number;
  status: string;
  estReussi: boolean;
  estValide: boolean;
  estPublie: boolean;
  commentaireProf?: string;
  noteProf?: number;
}

export interface StatistiquesEleve {
  nombre_examens: number;
  moyenne_generale: number;
  taux_reussite: number;
  examens_reussis: number;
  examens_echoues: number;
}

export interface EleveDetails {
  etudiant: EleveBase;
  statistiques: StatistiquesEleve;
  derniersResultats: ResultatEleve[];
  notesParMatiere: Record<string, number>;
  totalResultats: number;
}

