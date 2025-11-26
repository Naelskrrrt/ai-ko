"""
Modèle Classe pour les groupes d'étudiants
"""
from datetime import datetime
from app import db
import uuid


class Classe(db.Model):
    """Modèle pour les classes/groupes d'étudiants"""
    __tablename__ = 'classes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)  # Ex: L1-INFO-A, M2-MATH-B
    nom = db.Column(db.String(100), nullable=False)  # Ex: Licence 1 Informatique Groupe A
    description = db.Column(db.Text, nullable=True)
    annee_scolaire = db.Column(db.String(20), nullable=False, index=True)  # Ex: 2024-2025
    semestre = db.Column(db.Integer, nullable=True)  # 1 ou 2
    effectif_max = db.Column(db.Integer, nullable=True)  # Nombre max d'étudiants
    actif = db.Column(db.Boolean, default=True, nullable=False)

    # Relations
    niveau_id = db.Column(db.String(36), db.ForeignKey('niveaux.id'), nullable=False)
    niveau = db.relationship('Niveau', backref='classes')

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convertit la classe en dictionnaire"""
        return {
            'id': self.id,
            'code': self.code,
            'nom': self.nom,
            'description': self.description,
            'anneeScolaire': self.annee_scolaire,
            'semestre': self.semestre,
            'effectifMax': self.effectif_max,
            'actif': self.actif,
            'niveauId': self.niveau_id,
            'niveau': {
                'id': self.niveau.id,
                'code': self.niveau.code,
                'nom': self.niveau.nom
            } if self.niveau else None,
            'nombreEtudiants': len(self.etudiants) if hasattr(self, 'etudiants') else 0,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Classe {self.code} - {self.nom}>'
