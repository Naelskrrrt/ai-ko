"""
Modèle Niveau pour les niveaux universitaires
"""
from datetime import datetime
from app import db
import uuid


class Niveau(db.Model):
    """Modèle pour les niveaux universitaires (L1, L2, L3, M1, M2, etc.)"""
    __tablename__ = 'niveaux'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)  # Ex: L1, L2, M1
    nom = db.Column(db.String(100), nullable=False)  # Ex: Licence 1, Master 1
    description = db.Column(db.Text, nullable=True)
    ordre = db.Column(db.Integer, nullable=False, default=0)  # Pour trier les niveaux (L1=1, L2=2, etc.)
    cycle = db.Column(db.String(20), nullable=False)  # licence, master, doctorat
    actif = db.Column(db.Boolean, default=True, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    # Les relations many-to-many seront définies via des tables d'association

    def to_dict(self):
        """Convertit le niveau en dictionnaire"""
        return {
            'id': self.id,
            'code': self.code,
            'nom': self.nom,
            'description': self.description,
            'ordre': self.ordre,
            'cycle': self.cycle,
            'actif': self.actif,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Niveau {self.code} - {self.nom}>'
