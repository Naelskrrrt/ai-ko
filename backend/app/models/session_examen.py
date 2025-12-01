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
    # Statuts: programmee, en_cours, en_pause, terminee, annulee
    
    # Publication des résultats
    resultats_publies = db.Column(db.Boolean, default=False, nullable=False)  # Validation globale des résultats

    # Relations
    qcm_id = db.Column(db.String(36), db.ForeignKey('qcms.id'), nullable=False)
    qcm = db.relationship('QCM', backref='sessions')

    classe_id = db.Column(db.String(36), db.ForeignKey('classes.id'), nullable=True)
    classe = db.relationship('Classe', backref='sessions')

    createur_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    createur = db.relationship('User', foreign_keys=[createur_id])

    # Relations spécifiques (niveau, mention, parcours)
    niveau_id = db.Column(db.String(36), db.ForeignKey('niveaux.id'), nullable=True, index=True)
    niveau = db.relationship('Niveau', foreign_keys=[niveau_id], backref='sessions_examen')

    mention_id = db.Column(db.String(36), db.ForeignKey('mentions.id'), nullable=True, index=True)
    mention = db.relationship('Mention', foreign_keys=[mention_id], backref='sessions_examen')

    parcours_id = db.Column(db.String(36), db.ForeignKey('parcours.id'), nullable=True, index=True)
    parcours = db.relationship('Parcours', foreign_keys=[parcours_id], backref='sessions_examen')

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convertit la session en dictionnaire"""
        # Récupérer la matière depuis le QCM
        matiere_nom = None
        if self.qcm:
            if self.qcm.matiere_obj:
                matiere_nom = self.qcm.matiere_obj.nom
            elif self.qcm.matiere:
                matiere_nom = self.qcm.matiere
            else:
                matiere_nom = 'Non spécifiée'
        else:
            matiere_nom = 'Non spécifiée'

        result = {
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
            'resultatsPublies': self.resultats_publies,
            'matiere': matiere_nom,
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
        
        # Ajouter les nouveaux champs si disponibles (après migration)
        try:
            result['niveauId'] = self.niveau_id
            result['niveau'] = self.niveau.to_dict() if self.niveau else None
        except (AttributeError, KeyError):
            result['niveauId'] = None
            result['niveau'] = None
        
        try:
            result['mentionId'] = self.mention_id
            result['mention'] = self.mention.to_dict(include_etablissement=False) if self.mention else None
        except (AttributeError, KeyError):
            result['mentionId'] = None
            result['mention'] = None
        
        try:
            result['parcoursId'] = self.parcours_id
            result['parcours'] = self.parcours.to_dict(include_mention=False) if self.parcours else None
        except (AttributeError, KeyError):
            result['parcoursId'] = None
            result['parcours'] = None

        return result

    def __repr__(self):
        return f'<SessionExamen {self.titre}>'
