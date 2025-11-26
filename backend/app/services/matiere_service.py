"""
Service pour la gestion des Matières avec logique métier
"""
from typing import Dict, Any, Optional, List
from app.repositories.matiere_repository import MatiereRepository
from app.models.matiere import Matiere


class MatiereService:
    """Service pour la gestion des Matières"""

    def __init__(self):
        self.matiere_repo = MatiereRepository()

    def get_all_matieres(self, actives_seulement: bool = False) -> List[Dict[str, Any]]:
        """Récupère toutes les matières"""
        if actives_seulement:
            matieres = self.matiere_repo.get_actives()
        else:
            matieres = self.matiere_repo.get_all_ordered()
        return [matiere.to_dict() for matiere in matieres]

    def get_matiere_by_id(self, matiere_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une matière par son ID"""
        matiere = self.matiere_repo.get_by_id(matiere_id)
        return matiere.to_dict() if matiere else None

    def get_matiere_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Récupère une matière par son code"""
        matiere = self.matiere_repo.get_by_code(code)
        return matiere.to_dict() if matiere else None

    def create_matiere(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée une nouvelle matière avec validations

        Validations:
        - Code: 2-20 caractères, unique
        - Nom: 3-100 caractères
        - Coefficient: entre 0.5 et 5.0
        - Couleur: format hex (#RRGGBB)
        """
        # Validation code
        code = data.get('code', '').strip().upper()
        if len(code) < 2 or len(code) > 20:
            raise ValueError("Le code doit contenir entre 2 et 20 caractères")

        # Vérifier unicité du code
        if self.matiere_repo.get_by_code(code):
            raise ValueError(f"Une matière avec le code {code} existe déjà")

        # Validation nom
        nom = data.get('nom', '').strip()
        if len(nom) < 3 or len(nom) > 100:
            raise ValueError("Le nom doit contenir entre 3 et 100 caractères")

        # Validation coefficient
        coefficient = data.get('coefficient', 1.0)
        try:
            coefficient = float(coefficient)
            if coefficient < 0.5 or coefficient > 5.0:
                raise ValueError("Le coefficient doit être entre 0.5 et 5.0")
        except (ValueError, TypeError):
            raise ValueError("Le coefficient doit être un nombre")

        # Validation couleur (optionnelle)
        couleur = data.get('couleur', '').strip() if data.get('couleur') else None
        if couleur:
            if not couleur.startswith('#') or len(couleur) != 7:
                raise ValueError("La couleur doit être au format hexadécimal (#RRGGBB)")

        # Validation icone (optionnelle)
        icone = data.get('icone', '').strip() if data.get('icone') else None
        if icone and len(icone) > 50:
            raise ValueError("Le nom de l'icône ne peut pas dépasser 50 caractères")

        # Validation description (optionnelle)
        description = data.get('description', '').strip() if data.get('description') else None
        if description and len(description) > 5000:
            raise ValueError("La description ne peut pas dépasser 5000 caractères")

        # Créer la matière
        matiere = Matiere(
            code=code,
            nom=nom,
            description=description,
            coefficient=coefficient,
            couleur=couleur,
            icone=icone,
            actif=data.get('actif', True)
        )

        matiere = self.matiere_repo.create(matiere)
        return matiere.to_dict()

    def update_matiere(self, matiere_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour une matière"""
        matiere = self.matiere_repo.get_by_id(matiere_id)
        if not matiere:
            raise ValueError("Matière non trouvée")

        # Validation code
        if 'code' in data:
            code = data['code'].strip().upper()
            if len(code) < 2 or len(code) > 20:
                raise ValueError("Le code doit contenir entre 2 et 20 caractères")

            # Vérifier unicité du code
            existing = self.matiere_repo.get_by_code(code)
            if existing and existing.id != matiere_id:
                raise ValueError(f"Une matière avec le code {code} existe déjà")

            matiere.code = code

        # Validation nom
        if 'nom' in data:
            nom = data['nom'].strip()
            if len(nom) < 3 or len(nom) > 100:
                raise ValueError("Le nom doit contenir entre 3 et 100 caractères")
            matiere.nom = nom

        # Validation coefficient
        if 'coefficient' in data:
            try:
                coefficient = float(data['coefficient'])
                if coefficient < 0.5 or coefficient > 5.0:
                    raise ValueError("Le coefficient doit être entre 0.5 et 5.0")
                matiere.coefficient = coefficient
            except (ValueError, TypeError):
                raise ValueError("Le coefficient doit être un nombre")

        # Validation couleur
        if 'couleur' in data:
            couleur = data['couleur'].strip() if data['couleur'] else None
            if couleur and (not couleur.startswith('#') or len(couleur) != 7):
                raise ValueError("La couleur doit être au format hexadécimal (#RRGGBB)")
            matiere.couleur = couleur

        # Validation icone
        if 'icone' in data:
            icone = data['icone'].strip() if data['icone'] else None
            if icone and len(icone) > 50:
                raise ValueError("Le nom de l'icône ne peut pas dépasser 50 caractères")
            matiere.icone = icone

        # Validation description
        if 'description' in data:
            description = data['description'].strip() if data['description'] else None
            if description and len(description) > 5000:
                raise ValueError("La description ne peut pas dépasser 5000 caractères")
            matiere.description = description

        # Actif
        if 'actif' in data:
            matiere.actif = bool(data['actif'])

        matiere = self.matiere_repo.update(matiere)
        return matiere.to_dict()

    def delete_matiere(self, matiere_id: str) -> bool:
        """Supprime une matière"""
        matiere = self.matiere_repo.get_by_id(matiere_id)
        if not matiere:
            raise ValueError("Matière non trouvée")

        return self.matiere_repo.delete(matiere)

    def search_matieres(self, query: str) -> List[Dict[str, Any]]:
        """Recherche des matières"""
        matieres = self.matiere_repo.search(query)
        return [matiere.to_dict() for matiere in matieres]
