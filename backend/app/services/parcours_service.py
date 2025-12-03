"""
Service pour la gestion des Parcours avec logique métier
"""
from typing import Dict, Any, Optional, List
from app.repositories.parcours_repository import ParcoursRepository
from app.repositories.mention_repository import MentionRepository
from app.models.parcours import Parcours


class ParcoursService:
    """Service pour la gestion des Parcours"""

    def __init__(self):
        self.parcours_repo = ParcoursRepository()
        self.mention_repo = MentionRepository()

    def get_all_parcours(self, actifs_seulement: bool = False) -> List[Dict[str, Any]]:
        """Récupère tous les parcours"""
        if actifs_seulement:
            parcours_list = self.parcours_repo.get_actifs()
        else:
            parcours_list = self.parcours_repo.get_all()
        return [p.to_dict() for p in parcours_list]

    def get_parcours_by_id(self, parcours_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un parcours par son ID"""
        parcours = self.parcours_repo.get_by_id(parcours_id)
        return parcours.to_dict() if parcours else None

    def get_parcours_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Récupère un parcours par son code"""
        parcours = self.parcours_repo.get_by_code(code)
        return parcours.to_dict() if parcours else None

    def get_parcours_by_mention(self, mention_id: str) -> List[Dict[str, Any]]:
        """Récupère les parcours d'une mention"""
        parcours_list = self.parcours_repo.get_by_mention(mention_id)
        return [p.to_dict() for p in parcours_list]

    def create_parcours(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un nouveau parcours avec validations"""
        # Validation code
        code = data.get('code', '').strip().upper()
        if len(code) < 2 or len(code) > 20:
            raise ValueError("Le code doit contenir entre 2 et 20 caractères")
        
        # Vérifier unicité du code
        if self.parcours_repo.get_by_code(code):
            raise ValueError(f"Un parcours avec le code {code} existe déjà")
        
        # Validation nom
        nom = data.get('nom', '').strip()
        if len(nom) < 3 or len(nom) > 200:
            raise ValueError("Le nom doit contenir entre 3 et 200 caractères")
        
        # Validation mention_id
        mention_id = data.get('mention_id', '').strip()
        if not mention_id:
            raise ValueError("La mention est obligatoire")
        
        mention = self.mention_repo.get_by_id(mention_id)
        if not mention:
            raise ValueError("Mention non trouvée")
        
        # Validation duree_annees (optionnel)
        duree_annees = data.get('duree_annees')
        if duree_annees is not None:
            try:
                duree_annees = int(duree_annees)
                if duree_annees < 1 or duree_annees > 10:
                    raise ValueError("La durée doit être entre 1 et 10 ans")
            except (ValueError, TypeError):
                raise ValueError("La durée doit être un nombre entier")
        
        # Créer le parcours
        parcours = Parcours(
            code=code,
            nom=nom,
            description=data.get('description', '').strip() if data.get('description') else None,
            mention_id=mention_id,
            duree_annees=duree_annees,
            actif=data.get('actif', True)
        )
        
        parcours = self.parcours_repo.create(parcours)
        return parcours.to_dict()

    def update_parcours(self, parcours_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour un parcours"""
        parcours = self.parcours_repo.get_by_id(parcours_id)
        if not parcours:
            raise ValueError("Parcours non trouvé")
        
        # Validation code
        if 'code' in data:
            code = data['code'].strip().upper()
            if len(code) < 2 or len(code) > 20:
                raise ValueError("Le code doit contenir entre 2 et 20 caractères")
            
            existing = self.parcours_repo.get_by_code(code)
            if existing and existing.id != parcours_id:
                raise ValueError(f"Un parcours avec le code {code} existe déjà")
            
            parcours.code = code
        
        # Validation nom
        if 'nom' in data:
            nom = data['nom'].strip()
            if len(nom) < 3 or len(nom) > 200:
                raise ValueError("Le nom doit contenir entre 3 et 200 caractères")
            parcours.nom = nom
        
        # Validation mention_id
        if 'mention_id' in data:
            mention_id = data['mention_id'].strip()
            mention = self.mention_repo.get_by_id(mention_id)
            if not mention:
                raise ValueError("Mention non trouvée")
            parcours.mention_id = mention_id
        
        # Validation duree_annees
        if 'duree_annees' in data:
            duree_annees = data['duree_annees']
            if duree_annees is not None:
                try:
                    duree_annees = int(duree_annees)
                    if duree_annees < 1 or duree_annees > 10:
                        raise ValueError("La durée doit être entre 1 et 10 ans")
                except (ValueError, TypeError):
                    raise ValueError("La durée doit être un nombre entier")
            parcours.duree_annees = duree_annees
        
        # Mettre à jour les autres champs
        if 'description' in data:
            parcours.description = data['description'].strip() if data['description'] else None
        
        if 'actif' in data:
            parcours.actif = bool(data['actif'])
        
        parcours = self.parcours_repo.update(parcours)
        return parcours.to_dict()

    def delete_parcours(self, parcours_id: str) -> bool:
        """Supprime un parcours"""
        parcours = self.parcours_repo.get_by_id(parcours_id)
        if not parcours:
            raise ValueError("Parcours non trouvé")
        
        return self.parcours_repo.delete(parcours)

    def search_parcours(self, query: str) -> List[Dict[str, Any]]:
        """Recherche des parcours"""
        parcours_list = self.parcours_repo.search(query)
        return [p.to_dict() for p in parcours_list]




