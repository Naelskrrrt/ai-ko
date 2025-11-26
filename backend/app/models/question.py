"""
Modèle Question pour les QCM
"""
from datetime import datetime
from app import db
import uuid
import json


class Question(db.Model):
    """Modèle Question pour les questions de QCM"""
    __tablename__ = 'questions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    enonce = db.Column(db.Text, nullable=False)

    # Type de question: qcm, vrai_faux, texte_libre
    type_question = db.Column(db.String(20), default='qcm', nullable=False)

    # Options de réponse (stocké en JSON pour les QCM)
    # Format: [{"id": "a", "texte": "Option A", "estCorrecte": true}, ...]
    options = db.Column(db.Text, nullable=True)

    # Réponse correcte (pour vrai/faux ou texte libre)
    reponse_correcte = db.Column(db.Text, nullable=True)

    # Points attribués pour cette question
    points = db.Column(db.Integer, default=1, nullable=False)

    # Explication de la réponse (optionnel)
    explication = db.Column(db.Text, nullable=True)

    # Relations
    qcm_id = db.Column(db.String(36), db.ForeignKey('qcms.id'), nullable=False)
    qcm = db.relationship('QCM', back_populates='questions')

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def get_options(self):
        """Récupère les options en tant que liste Python"""
        if not self.options:
            return []
        try:
            return json.loads(self.options)
        except:
            return []

    def set_options(self, options_list):
        """Définit les options à partir d'une liste Python"""
        self.options = json.dumps(options_list)

    def to_dict(self):
        """Convertit la question en dictionnaire"""
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

        return {
            'id': self.id,
            'enonce': self.enonce,
            'typeQuestion': self.type_question,
            'options': self.get_options(),
            'reponseCorrecte': self.reponse_correcte,
            'points': self.points,
            'explication': self.explication,
            'qcmId': self.qcm_id,
            'qcm': {
                'id': self.qcm.id,
                'titre': self.qcm.titre
            } if self.qcm else None,
            'createdAt': format_date(self.created_at),
            'updatedAt': format_date(self.updated_at),
        }

    def __repr__(self):
        return f'<Question {self.enonce[:50]}...>'
