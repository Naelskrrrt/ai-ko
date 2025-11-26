"""
Modèle QCM (Questionnaire à Choix Multiples)
"""
from datetime import datetime
from app import db
import uuid


class QCM(db.Model):
    """Modèle QCM pour les questionnaires"""
    __tablename__ = 'qcms'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    titre = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duree = db.Column(db.Integer, nullable=True)  # Durée en minutes

    # Ancienne version: matiere comme texte (deprecated)
    matiere = db.Column(db.String(100), nullable=True)

    # Nouvelle version: relation avec Matiere
    matiere_id = db.Column(db.String(36), db.ForeignKey('matieres.id'), nullable=True, index=True)
    matiere_obj = db.relationship('Matiere', back_populates='qcms')

    # Status: draft, published, archived
    status = db.Column(db.String(20), default='draft', nullable=False)

    # Difficulté
    difficulty_level = db.Column(db.String(20), nullable=True)  # facile, moyen, difficile

    # Visibilité
    est_public = db.Column(db.Boolean, default=False, nullable=False)  # Visible par tous ou seulement créateur

    # Relations
    createur_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    createur = db.relationship('User', backref='qcms_crees', foreign_keys=[createur_id])

    # Questions associées
    questions = db.relationship('Question', back_populates='qcm', cascade='all, delete-orphan')

    # Niveaux ciblés (many-to-many)
    niveaux = db.relationship(
        'Niveau',
        secondary='qcm_niveaux',
        backref='qcms_associes',
        lazy='dynamic'
    )

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convertit le QCM en dictionnaire"""
        def format_date(date_value):
            if date_value is None:
                return None
            if isinstance(date_value, datetime):
                return date_value.isoformat()
            if isinstance(date_value, str):
                try:
                    from dateutil import parser
                    dt = parser.parse(date_value)
                    return dt.isoformat()
                except:
                    return date_value
            return str(date_value)

        # Déterminer le nom de la matière (priorité à matiere_obj, sinon matiere texte)
        matiere_nom = None
        if self.matiere_obj:
            matiere_nom = self.matiere_obj.nom
        elif self.matiere:
            matiere_nom = self.matiere
        else:
            matiere_nom = 'Non spécifiée'

        data = {
            'id': self.id,
            'titre': self.titre,
            'description': self.description,
            'duree': self.duree,
            'matiere': matiere_nom,  # Utilise matiere_obj.nom si disponible, sinon matiere texte
            'matiereId': self.matiere_id,
            'matiereObj': self.matiere_obj.to_dict() if self.matiere_obj else None,
            'status': self.status,
            'difficultyLevel': self.difficulty_level,
            'estPublic': self.est_public,
            'createurId': self.createur_id,
            'createur': {
                'id': self.createur.id,
                'name': self.createur.name,
                'email': self.createur.email
            } if self.createur else None,
            'nombreQuestions': len(self.questions) if self.questions else 0,
            'niveaux': [n.to_dict() for n in self.niveaux] if self.niveaux else [],
            'createdAt': format_date(self.created_at),
            'updatedAt': format_date(self.updated_at),
        }

        return data

    def __repr__(self):
        return f'<QCM {self.titre}>'
