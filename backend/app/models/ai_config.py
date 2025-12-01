"""
Modèle pour la configuration des modèles IA
"""
import uuid
from datetime import datetime
from app import db


class AIModelConfig(db.Model):
    """Configuration pour les modèles d'IA utilisés dans le système"""
    
    __tablename__ = 'ai_model_configs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nom = db.Column(db.String(100), nullable=False, unique=True)
    provider = db.Column(db.String(50), nullable=False)  # huggingface, openai, anthropic, local
    model_id = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    api_url = db.Column(db.String(500), nullable=True)
    
    # Paramètres du modèle
    max_tokens = db.Column(db.Integer, default=2000)
    temperature = db.Column(db.Float, default=0.7)
    top_p = db.Column(db.Float, default=0.9)
    timeout_seconds = db.Column(db.Integer, default=120)
    
    # Statut et priorité
    actif = db.Column(db.Boolean, default=True)
    est_defaut = db.Column(db.Boolean, default=False)
    ordre_priorite = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<AIModelConfig {self.nom}>'
    
    def to_dict(self):
        """Convertit le modèle en dictionnaire"""
        return {
            'id': self.id,
            'nom': self.nom,
            'provider': self.provider,
            'modelId': self.model_id,
            'description': self.description,
            'apiUrl': self.api_url,
            'maxTokens': self.max_tokens,
            'temperature': self.temperature,
            'topP': self.top_p,
            'timeoutSeconds': self.timeout_seconds,
            'actif': self.actif,
            'estDefaut': self.est_defaut,
            'ordrePriorite': self.ordre_priorite,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

