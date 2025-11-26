"""
Modèle Session d'Examen
"""
from datetime import datetime
from app import db
import uuid


class SessionExamen(db.Model):
    """Modèle pour les sessions d'examen"""
    __tablename__ = 'sessions_examen'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    titre = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Dates et durée
    date_debut = db.Column(db.DateTime, nullable=False, index=True)
    date_fin = db.Column(db.DateTime, nullable=False, index=True)
    duree_minutes = db.Column(db.Integer, nullable=False)  # Durée effective en minutes

    # Configuration
    tentatives_max = db.Column(db.Integer, default=1, nullable=False)  # Nombre de tentatives autorisées
    melange_questions = db.Column(db.Boolean, default=True, nullable=False)  # Mélanger les questions
    melange_options = db.Column(db.Boolean, default=True, nullable=False)  # Mélanger les options
    afficher_correction = db.Column(db.Boolean, default=True, nullable=False)  # Afficher la correction après
    note_passage = db.Column(db.Float, default=10.0, nullable=False)  # Note minimale pour réussir

    # Statut
    status = db.Column(db.String(20), default='programmee', nullable=False)
    # Statuts: programmee, en_cours, terminee, annulee

    # Relations
    qcm_id = db.Column(db.String(36), db.ForeignKey('qcms.id'), nullable=False)
    qcm = db.relationship('QCM', backref='sessions')

    classe_id = db.Column(db.String(36), db.ForeignKey('classes.id'), nullable=True)
    classe = db.relationship('Classe', backref='sessions')

    createur_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    createur = db.relationship('User', foreign_keys=[createur_id])

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convertit la session en dictionnaire"""
        return {
            'id': self.id,
            'titre': self.titre,
            'description': self.description,
            'dateDebut': self.date_debut.isoformat() if self.date_debut else None,
            'dateFin': self.date_fin.isoformat() if self.date_fin else None,
            'dureeMinutes': self.duree_minutes,
            'tentativesMax': self.tentatives_max,
            'melangeQuestions': self.melange_questions,
            'melangeOptions': self.melange_options,
            'afficherCorrection': self.afficher_correction,
            'notePassage': self.note_passage,
            'status': self.status,
            'qcmId': self.qcm_id,
            'qcm': {
                'id': self.qcm.id,
                'titre': self.qcm.titre
            } if self.qcm else None,
            'classeId': self.classe_id,
            'classe': {
                'id': self.classe.id,
                'code': self.classe.code,
                'nom': self.classe.nom
            } if self.classe else None,
            'createurId': self.createur_id,
            'nombreParticipants': len(self.resultats) if hasattr(self, 'resultats') else 0,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<SessionExamen {self.titre}>'
