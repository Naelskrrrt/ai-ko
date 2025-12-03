"""
Modèle Parcours pour les chemins d'études
"""
from datetime import datetime
from app import db
import uuid


class Parcours(db.Model):
    """Modèle pour les parcours (chemins d'études spécifiques)"""
    __tablename__ = 'parcours'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)  # Ex: IA, WEB, SYS
    nom = db.Column(db.String(200), nullable=False)  # Ex: Intelligence Artificielle
    description = db.Column(db.Text, nullable=True)
    
    # Référence à la mention
    mention_id = db.Column(db.String(36), db.ForeignKey('mentions.id'), nullable=False)
    mention = db.relationship('Mention', back_populates='parcours')
    
    # Métadonnées
    duree_annees = db.Column(db.Integer, nullable=True)  # Durée en années
    
    actif = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self, include_mention=True):
        """Convertit le parcours en dictionnaire"""
        data = {
            'id': self.id,
            'code': self.code,
            'nom': self.nom,
            'description': self.description,
            'mentionId': self.mention_id,
            'dureeAnnees': self.duree_annees,
            'actif': self.actif,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_mention and self.mention:
            data['mention'] = {
                'id': self.mention.id,
                'code': self.mention.code,
                'nom': self.mention.nom
            }
        
        return data

    def __repr__(self):
        return f'<Parcours {self.code} - {self.nom}>'




