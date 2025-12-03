"""
Modèle Mention pour les spécialisations académiques
"""
from datetime import datetime
from app import db
import uuid


class Mention(db.Model):
    """Modèle pour les mentions (spécialisations académiques)"""
    __tablename__ = 'mentions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)  # Ex: INFO, MATH, PHYS
    nom = db.Column(db.String(200), nullable=False)  # Ex: Informatique, Mathématiques
    description = db.Column(db.Text, nullable=True)
    
    # Référence à l'établissement
    etablissement_id = db.Column(db.String(36), db.ForeignKey('etablissements.id'), nullable=False)
    etablissement = db.relationship('Etablissement', back_populates='mentions')
    
    # UI
    couleur = db.Column(db.String(7), nullable=True)  # Hex color
    icone = db.Column(db.String(50), nullable=True)  # Nom d'icône
    
    actif = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    parcours = db.relationship('Parcours', back_populates='mention', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_etablissement=True):
        """Convertit la mention en dictionnaire"""
        data = {
            'id': self.id,
            'code': self.code,
            'nom': self.nom,
            'description': self.description,
            'etablissementId': self.etablissement_id,
            'couleur': self.couleur,
            'icone': self.icone,
            'actif': self.actif,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_etablissement and self.etablissement:
            data['etablissement'] = {
                'id': self.etablissement.id,
                'code': self.etablissement.code,
                'nom': self.etablissement.nom
            }
        
        return data

    def __repr__(self):
        return f'<Mention {self.code} - {self.nom}>'




