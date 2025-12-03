"""
Service pour la gestion des Mentions avec logique métier
"""
from typing import Dict, Any, Optional, List
from app.repositories.mention_repository import MentionRepository
from app.repositories.etablissement_repository import EtablissementRepository
from app.models.mention import Mention


class MentionService:
    """Service pour la gestion des Mentions"""

    def __init__(self):
        self.mention_repo = MentionRepository()
        self.etablissement_repo = EtablissementRepository()

    def get_all_mentions(self, actives_seulement: bool = False) -> List[Dict[str, Any]]:
        """Récupère toutes les mentions"""
        if actives_seulement:
            mentions = self.mention_repo.get_actives()
        else:
            mentions = self.mention_repo.get_all()
        return [m.to_dict() for m in mentions]

    def get_mention_by_id(self, mention_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une mention par son ID"""
        mention = self.mention_repo.get_by_id(mention_id)
        return mention.to_dict() if mention else None

    def get_mention_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Récupère une mention par son code"""
        mention = self.mention_repo.get_by_code(code)
        return mention.to_dict() if mention else None

    def get_mentions_by_etablissement(self, etablissement_id: str) -> List[Dict[str, Any]]:
        """Récupère les mentions d'un établissement"""
        mentions = self.mention_repo.get_by_etablissement(etablissement_id)
        return [m.to_dict() for m in mentions]

    def create_mention(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée une nouvelle mention avec validations"""
        # Validation code
        code = data.get('code', '').strip().upper()
        if len(code) < 2 or len(code) > 20:
            raise ValueError("Le code doit contenir entre 2 et 20 caractères")
        
        # Vérifier unicité du code
        if self.mention_repo.get_by_code(code):
            raise ValueError(f"Une mention avec le code {code} existe déjà")
        
        # Validation nom
        nom = data.get('nom', '').strip()
        if len(nom) < 3 or len(nom) > 200:
            raise ValueError("Le nom doit contenir entre 3 et 200 caractères")
        
        # Validation etablissement_id
        etablissement_id = data.get('etablissement_id', '').strip()
        if not etablissement_id:
            raise ValueError("L'établissement est obligatoire")
        
        etablissement = self.etablissement_repo.get_by_id(etablissement_id)
        if not etablissement:
            raise ValueError("Établissement non trouvé")
        
        # Créer la mention
        mention = Mention(
            code=code,
            nom=nom,
            description=data.get('description', '').strip() if data.get('description') else None,
            etablissement_id=etablissement_id,
            couleur=data.get('couleur', '').strip() if data.get('couleur') else None,
            icone=data.get('icone', '').strip() if data.get('icone') else None,
            actif=data.get('actif', True)
        )
        
        mention = self.mention_repo.create(mention)
        return mention.to_dict()

    def update_mention(self, mention_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour une mention"""
        mention = self.mention_repo.get_by_id(mention_id)
        if not mention:
            raise ValueError("Mention non trouvée")
        
        # Validation code
        if 'code' in data:
            code = data['code'].strip().upper()
            if len(code) < 2 or len(code) > 20:
                raise ValueError("Le code doit contenir entre 2 et 20 caractères")
            
            existing = self.mention_repo.get_by_code(code)
            if existing and existing.id != mention_id:
                raise ValueError(f"Une mention avec le code {code} existe déjà")
            
            mention.code = code
        
        # Validation nom
        if 'nom' in data:
            nom = data['nom'].strip()
            if len(nom) < 3 or len(nom) > 200:
                raise ValueError("Le nom doit contenir entre 3 et 200 caractères")
            mention.nom = nom
        
        # Validation etablissement_id
        if 'etablissement_id' in data:
            etablissement_id = data['etablissement_id'].strip()
            etablissement = self.etablissement_repo.get_by_id(etablissement_id)
            if not etablissement:
                raise ValueError("Établissement non trouvé")
            mention.etablissement_id = etablissement_id
        
        # Mettre à jour les autres champs
        for field in ['description', 'couleur', 'icone']:
            if field in data:
                value = data[field].strip() if data[field] else None
                setattr(mention, field, value)
        
        if 'actif' in data:
            mention.actif = bool(data['actif'])
        
        mention = self.mention_repo.update(mention)
        return mention.to_dict()

    def delete_mention(self, mention_id: str) -> bool:
        """Supprime une mention"""
        mention = self.mention_repo.get_by_id(mention_id)
        if not mention:
            raise ValueError("Mention non trouvée")
        
        return self.mention_repo.delete(mention)

    def search_mentions(self, query: str) -> List[Dict[str, Any]]:
        """Recherche des mentions"""
        mentions = self.mention_repo.search(query)
        return [m.to_dict() for m in mentions]




