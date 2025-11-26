"""
Modèle Matière pour les matières enseignées
"""
from datetime import datetime
from app import db
import uuid


class Matiere(db.Model):
    """Modèle pour les matières universitaires"""
    __tablename__ = 'matieres'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)  # Ex: MATH101, INFO201
    nom = db.Column(db.String(100), nullable=False)  # Ex: Mathématiques Générales
    description = db.Column(db.Text, nullable=True)
    coefficient = db.Column(db.Float, default=1.0, nullable=False)  # Coefficient pour le calcul de moyenne
    couleur = db.Column(db.String(7), nullable=True)  # Couleur hex pour l'UI (#FF5733)
    icone = db.Column(db.String(50), nullable=True)  # Nom d'icône pour l'UI
    actif = db.Column(db.Boolean, default=True, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    # Les QCMs associés à cette matière
    qcms = db.relationship('QCM', back_populates='matiere_obj', foreign_keys='QCM.matiere_id')

    def to_dict(self):
        """Convertit la matière en dictionnaire"""
        return {
            'id': self.id,
            'code': self.code,
            'nom': self.nom,
            'description': self.description,
            'coefficient': self.coefficient,
            'couleur': self.couleur,
            'icone': self.icone,
            'actif': self.actif,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Matiere {self.code} - {self.nom}>'
