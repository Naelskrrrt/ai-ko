"""
Service pour la gestion des Établissements avec logique métier
"""
from typing import Dict, Any, Optional, List
import re
from app.repositories.etablissement_repository import EtablissementRepository
from app.models.etablissement import Etablissement


class EtablissementService:
    """Service pour la gestion des Établissements"""

    def __init__(self):
        self.etablissement_repo = EtablissementRepository()

    def get_all_etablissements(self, actifs_seulement: bool = False) -> List[Dict[str, Any]]:
        """Récupère tous les établissements"""
        if actifs_seulement:
            etablissements = self.etablissement_repo.get_actifs()
        else:
            etablissements = self.etablissement_repo.get_all()
        return [e.to_dict() for e in etablissements]

    def get_etablissement_by_id(self, etablissement_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un établissement par son ID"""
        etablissement = self.etablissement_repo.get_by_id(etablissement_id)
        return etablissement.to_dict() if etablissement else None

    def get_etablissement_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Récupère un établissement par son code"""
        etablissement = self.etablissement_repo.get_by_code(code)
        return etablissement.to_dict() if etablissement else None

    def get_etablissements_by_type(self, type_etablissement: str) -> List[Dict[str, Any]]:
        """Récupère les établissements par type"""
        types_valides = ['université', 'école', 'institut']
        if type_etablissement.lower() not in types_valides:
            raise ValueError(f"Type invalide. Types autorisés: {', '.join(types_valides)}")
        
        etablissements = self.etablissement_repo.get_by_type(type_etablissement.lower())
        return [e.to_dict() for e in etablissements]

    def create_etablissement(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un nouvel établissement avec validations"""
        # Validation code
        code = data.get('code', '').strip().upper()
        if len(code) < 2 or len(code) > 20:
            raise ValueError("Le code doit contenir entre 2 et 20 caractères")
        
        # Vérifier unicité du code
        if self.etablissement_repo.get_by_code(code):
            raise ValueError(f"Un établissement avec le code {code} existe déjà")
        
        # Validation nom
        nom = data.get('nom', '').strip()
        if len(nom) < 3 or len(nom) > 200:
            raise ValueError("Le nom doit contenir entre 3 et 200 caractères")
        
        # Validation type_etablissement
        type_etablissement = data.get('type_etablissement', '').strip().lower()
        types_valides = ['université', 'école', 'institut']
        if type_etablissement not in types_valides:
            raise ValueError(f"Type invalide. Types autorisés: {', '.join(types_valides)}")
        
        # Validation email (optionnel)
        email = data.get('email', '').strip() if data.get('email') else None
        if email:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                raise ValueError("Format d'email invalide")
        
        # Validation pays
        pays = data.get('pays', 'Madagascar').strip()
        if len(pays) < 2 or len(pays) > 100:
            raise ValueError("Le pays doit contenir entre 2 et 100 caractères")
        
        # Créer l'établissement
        etablissement = Etablissement(
            code=code,
            nom=nom,
            nom_court=data.get('nom_court', '').strip() if data.get('nom_court') else None,
            description=data.get('description', '').strip() if data.get('description') else None,
            type_etablissement=type_etablissement,
            adresse=data.get('adresse', '').strip() if data.get('adresse') else None,
            ville=data.get('ville', '').strip() if data.get('ville') else None,
            pays=pays,
            code_postal=data.get('code_postal', '').strip() if data.get('code_postal') else None,
            telephone=data.get('telephone', '').strip() if data.get('telephone') else None,
            email=email,
            site_web=data.get('site_web', '').strip() if data.get('site_web') else None,
            logo=data.get('logo', '').strip() if data.get('logo') else None,
            couleur_primaire=data.get('couleur_primaire', '').strip() if data.get('couleur_primaire') else None,
            actif=data.get('actif', True)
        )
        
        etablissement = self.etablissement_repo.create(etablissement)
        return etablissement.to_dict()

    def update_etablissement(self, etablissement_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour un établissement"""
        etablissement = self.etablissement_repo.get_by_id(etablissement_id)
        if not etablissement:
            raise ValueError("Établissement non trouvé")
        
        # Validation code (si modification)
        if 'code' in data:
            code = data['code'].strip().upper()
            if len(code) < 2 or len(code) > 20:
                raise ValueError("Le code doit contenir entre 2 et 20 caractères")
            
            existing = self.etablissement_repo.get_by_code(code)
            if existing and existing.id != etablissement_id:
                raise ValueError(f"Un établissement avec le code {code} existe déjà")
            
            etablissement.code = code
        
        # Validation nom
        if 'nom' in data:
            nom = data['nom'].strip()
            if len(nom) < 3 or len(nom) > 200:
                raise ValueError("Le nom doit contenir entre 3 et 200 caractères")
            etablissement.nom = nom
        
        # Validation type
        if 'type_etablissement' in data:
            type_etablissement = data['type_etablissement'].strip().lower()
            types_valides = ['université', 'école', 'institut']
            if type_etablissement not in types_valides:
                raise ValueError(f"Type invalide. Types autorisés: {', '.join(types_valides)}")
            etablissement.type_etablissement = type_etablissement
        
        # Validation email
        if 'email' in data:
            email = data['email'].strip() if data['email'] else None
            if email:
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_pattern, email):
                    raise ValueError("Format d'email invalide")
            etablissement.email = email
        
        # Mettre à jour les autres champs
        for field in ['nom_court', 'description', 'adresse', 'ville', 'pays', 'code_postal', 
                      'telephone', 'site_web', 'logo', 'couleur_primaire']:
            if field in data:
                value = data[field].strip() if data[field] else None
                setattr(etablissement, field, value)
        
        if 'actif' in data:
            etablissement.actif = bool(data['actif'])
        
        etablissement = self.etablissement_repo.update(etablissement)
        return etablissement.to_dict()

    def delete_etablissement(self, etablissement_id: str) -> bool:
        """Supprime un établissement"""
        etablissement = self.etablissement_repo.get_by_id(etablissement_id)
        if not etablissement:
            raise ValueError("Établissement non trouvé")
        
        return self.etablissement_repo.delete(etablissement)

    def search_etablissements(self, query: str) -> List[Dict[str, Any]]:
        """Recherche des établissements"""
        etablissements = self.etablissement_repo.search(query)
        return [e.to_dict() for e in etablissements]

