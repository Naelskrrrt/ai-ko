"""
Service pour la gestion des configurations de modèles IA
"""
from typing import Dict, Any, Optional, List
from app.models.ai_config import AIModelConfig
from app import db
import os


class AIConfigService:
    """Service pour gérer les configurations des modèles IA"""

    def get_all_configs(self, actifs_seulement: bool = False) -> List[Dict]:
        """Récupère toutes les configurations"""
        query = AIModelConfig.query
        if actifs_seulement:
            query = query.filter_by(actif=True)
        configs = query.order_by(AIModelConfig.ordre_priorite.asc()).all()
        return [c.to_dict() for c in configs]

    def get_config_by_id(self, config_id: str) -> Optional[Dict]:
        """Récupère une configuration par ID"""
        config = AIModelConfig.query.get(config_id)
        return config.to_dict() if config else None

    def get_default_config(self) -> Optional[Dict]:
        """Récupère la configuration par défaut"""
        config = AIModelConfig.query.filter_by(
            est_defaut=True, actif=True).first()
        if not config:
            # Prendre le premier actif par priorité
            config = AIModelConfig.query.filter_by(actif=True).order_by(
                AIModelConfig.ordre_priorite.asc()
            ).first()
        return config.to_dict() if config else None

    def create_config(self, data: Dict[str, Any]) -> Dict:
        """Crée une nouvelle configuration"""
        # Si c'est marqué comme défaut, retirer le défaut des autres
        if data.get('est_defaut'):
            AIModelConfig.query.update({'est_defaut': False})

        config = AIModelConfig(
            nom=data['nom'],
            provider=data['provider'],
            model_id=data['model_id'],
            description=data.get('description'),
            api_url=data.get('api_url'),
            max_tokens=data.get('max_tokens', 2048),
            temperature=data.get('temperature', 0.7),
            top_p=data.get('top_p', 0.9),
            timeout_seconds=data.get('timeout_seconds', 60),
            actif=data.get('actif', True),
            est_defaut=data.get('est_defaut', False),
            ordre_priorite=data.get('ordre_priorite', 0)
        )
        db.session.add(config)
        db.session.commit()
        return config.to_dict()

    def update_config(self, config_id: str, data: Dict[str, Any]) -> Dict:
        """Met à jour une configuration"""
        config = AIModelConfig.query.get(config_id)
        if not config:
            raise ValueError("Configuration non trouvée")

        # Si on active est_defaut, désactiver les autres
        if data.get('est_defaut') and not config.est_defaut:
            AIModelConfig.query.filter(
                AIModelConfig.id != config_id).update({'est_defaut': False})

        # Mettre à jour les champs
        for field in ['nom', 'provider', 'model_id', 'description', 'api_url',
                      'max_tokens', 'temperature', 'top_p', 'timeout_seconds',
                      'actif', 'est_defaut', 'ordre_priorite']:
            if field in data:
                setattr(config, field, data[field])

        db.session.commit()
        return config.to_dict()

    def delete_config(self, config_id: str) -> bool:
        """Supprime une configuration"""
        config = AIModelConfig.query.get(config_id)
        if not config:
            raise ValueError("Configuration non trouvée")

        db.session.delete(config)
        db.session.commit()
        return True

    def set_as_default(self, config_id: str) -> Dict:
        """Définit une configuration comme défaut"""
        config = AIModelConfig.query.get(config_id)
        if not config:
            raise ValueError("Configuration non trouvée")

        # Retirer le défaut des autres
        AIModelConfig.query.update({'est_defaut': False})
        config.est_defaut = True
        db.session.commit()
        return config.to_dict()

    def apply_config_to_env(self, config_id: str) -> bool:
        """Applique une configuration aux variables d'environnement"""
        config = AIModelConfig.query.get(config_id)
        if not config:
            raise ValueError("Configuration non trouvée")

        os.environ['HF_MODEL'] = config.model_id
        if config.api_url:
            os.environ['HF_API_URL'] = config.api_url

        return True

    def init_default_configs(self):
        """Initialise les configurations par défaut si aucune n'existe"""
        if AIModelConfig.query.count() > 0:
            return

        default_configs = [
            {
                'nom': 'Mistral 7B Instruct',
                'provider': 'huggingface',
                'model_id': 'mistralai/Mistral-7B-Instruct-v0.2',
                'description': 'Modèle Mistral optimisé pour les instructions',
                'max_tokens': 2048,
                'temperature': 0.7,
                'est_defaut': True,
                'ordre_priorite': 1
            },
            {
                'nom': 'Llama 3.2 3B',
                'provider': 'huggingface',
                'model_id': 'meta-llama/Llama-3.2-3B-Instruct',
                'description': 'Modèle Llama léger et rapide',
                'max_tokens': 2048,
                'temperature': 0.7,
                'ordre_priorite': 2
            },
            {
                'nom': 'Phi-3 Mini',
                'provider': 'huggingface',
                'model_id': 'microsoft/Phi-3-mini-4k-instruct',
                'description': 'Modèle Microsoft compact',
                'max_tokens': 2048,
                'temperature': 0.7,
                'ordre_priorite': 3
            },
            {
                'nom': 'Qwen 2.5 1.5B',
                'provider': 'huggingface',
                'model_id': 'Qwen/Qwen2.5-1.5B-Instruct',
                'description': 'Modèle Alibaba léger',
                'max_tokens': 2048,
                'temperature': 0.7,
                'ordre_priorite': 4
            }
        ]

        for config_data in default_configs:
            config = AIModelConfig(**config_data)
            db.session.add(config)

        db.session.commit()
