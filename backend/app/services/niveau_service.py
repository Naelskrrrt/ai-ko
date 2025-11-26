"""
Service pour la gestion des Niveaux avec logique métier
"""
from typing import Dict, Any, Optional, List
from app.repositories.niveau_repository import NiveauRepository
from app.models.niveau import Niveau


class NiveauService:
    """Service pour la gestion des Niveaux"""

    def __init__(self):
        self.niveau_repo = NiveauRepository()

    def get_all_niveaux(self, actifs_seulement: bool = False) -> List[Dict[str, Any]]:
        """Récupère tous les niveaux"""
        if actifs_seulement:
            niveaux = self.niveau_repo.get_actifs()
        else:
            niveaux = self.niveau_repo.get_all_ordered()
        return [niveau.to_dict() for niveau in niveaux]

    def get_niveau_by_id(self, niveau_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un niveau par son ID"""
        niveau = self.niveau_repo.get_by_id(niveau_id)
        return niveau.to_dict() if niveau else None

    def get_niveau_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Récupère un niveau par son code"""
        niveau = self.niveau_repo.get_by_code(code)
        return niveau.to_dict() if niveau else None

    def get_niveaux_by_cycle(self, cycle: str) -> List[Dict[str, Any]]:
        """Récupère les niveaux d'un cycle"""
        if cycle not in ['licence', 'master', 'doctorat']:
            raise ValueError("Cycle invalide. Cycles autorisés: licence, master, doctorat")

        niveaux = self.niveau_repo.get_by_cycle(cycle)
        return [niveau.to_dict() for niveau in niveaux]

    def create_niveau(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée un nouveau niveau avec validations

        Validations:
        - Code: 2-20 caractères, unique
        - Nom: 3-100 caractères
        - Ordre: entier positif
        - Cycle: licence, master, doctorat
        """
        # Validation code
        code = data.get('code', '').strip().upper()
        if len(code) < 2 or len(code) > 20:
            raise ValueError("Le code doit contenir entre 2 et 20 caractères")

        # Vérifier unicité du code
        if self.niveau_repo.get_by_code(code):
            raise ValueError(f"Un niveau avec le code {code} existe déjà")

        # Validation nom
        nom = data.get('nom', '').strip()
        if len(nom) < 3 or len(nom) > 100:
            raise ValueError("Le nom doit contenir entre 3 et 100 caractères")

        # Validation cycle
        cycle = data.get('cycle', '').strip().lower()
        if cycle not in ['licence', 'master', 'doctorat']:
            raise ValueError("Cycle invalide. Cycles autorisés: licence, master, doctorat")

        # Validation ordre
        ordre = data.get('ordre', 0)
        try:
            ordre = int(ordre)
            if ordre < 0:
                raise ValueError("L'ordre doit être un nombre positif")
        except (ValueError, TypeError):
            raise ValueError("L'ordre doit être un nombre entier")

        # Validation description (optionnelle)
        description = data.get('description', '').strip() if data.get('description') else None
        if description and len(description) > 5000:
            raise ValueError("La description ne peut pas dépasser 5000 caractères")

        # Créer le niveau
        niveau = Niveau(
            code=code,
            nom=nom,
            description=description,
            ordre=ordre,
            cycle=cycle,
            actif=data.get('actif', True)
        )

        niveau = self.niveau_repo.create(niveau)
        return niveau.to_dict()

    def update_niveau(self, niveau_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Met à jour un niveau

        Validations similaires à create_niveau
        """
        niveau = self.niveau_repo.get_by_id(niveau_id)
        if not niveau:
            raise ValueError("Niveau non trouvé")

        # Validation code (si modification)
        if 'code' in data:
            code = data['code'].strip().upper()
            if len(code) < 2 or len(code) > 20:
                raise ValueError("Le code doit contenir entre 2 et 20 caractères")

            # Vérifier unicité du code (sauf pour le niveau actuel)
            existing = self.niveau_repo.get_by_code(code)
            if existing and existing.id != niveau_id:
                raise ValueError(f"Un niveau avec le code {code} existe déjà")

            niveau.code = code

        # Validation nom
        if 'nom' in data:
            nom = data['nom'].strip()
            if len(nom) < 3 or len(nom) > 100:
                raise ValueError("Le nom doit contenir entre 3 et 100 caractères")
            niveau.nom = nom

        # Validation cycle
        if 'cycle' in data:
            cycle = data['cycle'].strip().lower()
            if cycle not in ['licence', 'master', 'doctorat']:
                raise ValueError("Cycle invalide. Cycles autorisés: licence, master, doctorat")
            niveau.cycle = cycle

        # Validation ordre
        if 'ordre' in data:
            try:
                ordre = int(data['ordre'])
                if ordre < 0:
                    raise ValueError("L'ordre doit être un nombre positif")
                niveau.ordre = ordre
            except (ValueError, TypeError):
                raise ValueError("L'ordre doit être un nombre entier")

        # Validation description
        if 'description' in data:
            description = data['description'].strip() if data['description'] else None
            if description and len(description) > 5000:
                raise ValueError("La description ne peut pas dépasser 5000 caractères")
            niveau.description = description

        # Actif
        if 'actif' in data:
            niveau.actif = bool(data['actif'])

        niveau = self.niveau_repo.update(niveau)
        return niveau.to_dict()

    def delete_niveau(self, niveau_id: str) -> bool:
        """Supprime un niveau"""
        niveau = self.niveau_repo.get_by_id(niveau_id)
        if not niveau:
            raise ValueError("Niveau non trouvé")

        return self.niveau_repo.delete(niveau)

    def search_niveaux(self, query: str) -> List[Dict[str, Any]]:
        """Recherche des niveaux"""
        niveaux = self.niveau_repo.search(query)
        return [niveau.to_dict() for niveau in niveaux]
