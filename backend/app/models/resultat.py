"""
Modèle Résultat pour les résultats des étudiants
"""
from datetime import datetime
from app import db
import uuid
import json


class Resultat(db.Model):
    """Modèle pour les résultats des étudiants"""
    __tablename__ = 'resultats'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Relations
    etudiant_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    etudiant = db.relationship('User', foreign_keys=[etudiant_id], backref='resultats')

    session_id = db.Column(db.String(36), db.ForeignKey('sessions_examen.id'), nullable=True, index=True)
    session = db.relationship('SessionExamen', backref='resultats')

    qcm_id = db.Column(db.String(36), db.ForeignKey('qcms.id'), nullable=False, index=True)
    qcm = db.relationship('QCM', backref='resultats')

    # Données de passage
    numero_tentative = db.Column(db.Integer, default=1, nullable=False)  # Numéro de la tentative
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=True)
    duree_reelle_secondes = db.Column(db.Integer, nullable=True)  # Durée réelle de passage

    # Scores et notes
    score_total = db.Column(db.Float, default=0.0, nullable=False)  # Points obtenus
    score_maximum = db.Column(db.Float, nullable=False)  # Points maximum possibles
    note_sur_20 = db.Column(db.Float, nullable=True)  # Note sur 20
    pourcentage = db.Column(db.Float, nullable=True)  # Pourcentage de réussite

    # Statistiques
    questions_total = db.Column(db.Integer, nullable=False)
    questions_repondues = db.Column(db.Integer, default=0, nullable=False)
    questions_correctes = db.Column(db.Integer, default=0, nullable=False)
    questions_incorrectes = db.Column(db.Integer, default=0, nullable=False)
    questions_partielles = db.Column(db.Integer, default=0, nullable=False)  # Pour questions ouvertes

    # Détails des réponses (JSON)
    # Format: {"question_id": {"answer": "...", "score": 0.8, "feedback": "...", "correct": true}}
    reponses_detail = db.Column(db.Text, nullable=True)

    # Statut et validation
    status = db.Column(db.String(20), default='en_cours', nullable=False)
    # Statuts: en_cours, termine, abandonne, invalide

    est_reussi = db.Column(db.Boolean, default=False, nullable=False)
    est_valide = db.Column(db.Boolean, default=True, nullable=False)  # Pour détecter la triche

    # Feedback et commentaires
    feedback_auto = db.Column(db.Text, nullable=True)  # Feedback automatique généré
    commentaire_prof = db.Column(db.Text, nullable=True)  # Commentaire du professeur
    note_prof = db.Column(db.Float, nullable=True)  # Note ajustée par le prof si nécessaire

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def get_reponses_detail(self):
        """Récupère les détails des réponses"""
        if not self.reponses_detail:
            return {}
        try:
            parsed = json.loads(self.reponses_detail)
            # S'assurer que c'est un dictionnaire
            if isinstance(parsed, dict):
                return parsed
            return {}
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur parsing reponses_detail: {e}, valeur: {self.reponses_detail[:100] if self.reponses_detail else None}")
            return {}

    def set_reponses_detail(self, reponses):
        """Définit les détails des réponses"""
        try:
            # S'assurer que les données sont sérialisables
            if reponses is None:
                self.reponses_detail = None
                return
            
            # Convertir les valeurs non-sérialisables
            def make_serializable(obj):
                if isinstance(obj, dict):
                    return {k: make_serializable(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [make_serializable(item) for item in obj]
                elif isinstance(obj, (datetime,)):
                    return obj.isoformat()
                elif hasattr(obj, '__dict__'):
                    return make_serializable(obj.__dict__)
                else:
                    return obj
            
            reponses_serializable = make_serializable(reponses)
            self.reponses_detail = json.dumps(reponses_serializable, ensure_ascii=False)
        except (TypeError, ValueError) as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur sérialisation reponses_detail: {e}")
            # En cas d'erreur, stocker un dictionnaire vide
            self.reponses_detail = json.dumps({})

    def to_dict(self, include_details=False):
        """Convertit le résultat en dictionnaire"""
        try:
            data = {
                'id': self.id,
                'etudiantId': self.etudiant_id,
                'etudiant': {
                    'id': self.etudiant.id,
                    'name': self.etudiant.name,
                    'email': self.etudiant.email
                } if self.etudiant else None,
                'sessionId': self.session_id,
                'session': {
                    'id': self.session.id,
                    'titre': self.session.titre
                } if self.session else None,
                'qcmId': self.qcm_id,
                'qcm': {
                    'id': self.qcm.id,
                    'titre': self.qcm.titre
                } if self.qcm else None,
                'numeroTentative': self.numero_tentative,
                'dateDebut': self.date_debut.isoformat() if self.date_debut else None,
                'dateFin': self.date_fin.isoformat() if self.date_fin else None,
                'dureeReelleSecondes': self.duree_reelle_secondes,
                'scoreTotal': self.score_total,
                'scoreMaximum': self.score_maximum,
                'noteSur20': self.note_sur_20,
                'pourcentage': self.pourcentage,
                'questionsTotal': self.questions_total,
                'questionsRepondues': self.questions_repondues,
                'questionsCorrectes': self.questions_correctes,
                'questionsIncorrectes': self.questions_incorrectes,
                'questionsPartielles': self.questions_partielles,
                'status': self.status,
                'estReussi': self.est_reussi,
                'estValide': self.est_valide,
                'feedbackAuto': self.feedback_auto,
                'commentaireProf': self.commentaire_prof,
                'noteProf': self.note_prof,
                'createdAt': self.created_at.isoformat() if self.created_at else None,
                'updatedAt': self.updated_at.isoformat() if self.updated_at else None
            }

            if include_details:
                try:
                    data['reponsesDetail'] = self.get_reponses_detail()
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Erreur lors de la récupération des détails des réponses: {e}", exc_info=True)
                    # En cas d'erreur, retourner un dictionnaire vide plutôt que de faire échouer
                    data['reponsesDetail'] = {}

            return data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la conversion du résultat en dictionnaire: {e}", exc_info=True)
            raise

    def __repr__(self):
        return f'<Resultat {self.etudiant.name if self.etudiant else "?"} - {self.qcm.titre if self.qcm else "?"}>'
