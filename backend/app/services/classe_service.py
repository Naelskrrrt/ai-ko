"""
Service pour la gestion des Classes avec logique métier
"""
from typing import Dict, Any, Optional, List, Tuple
from app.repositories.classe_repository import ClasseRepository
from app.repositories.niveau_repository import NiveauRepository
from app.models.classe import Classe


class ClasseService:
    """Service pour la gestion des Classes"""

    def __init__(self):
        self.classe_repo = ClasseRepository()
        self.niveau_repo = NiveauRepository()

    def get_all_classes(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """Récupère toutes les classes avec pagination"""
        classes, total = self.classe_repo.get_all_paginated(skip=skip, limit=limit, filters=filters)
        return [classe.to_dict() for classe in classes], total

    def get_classe_by_id(self, classe_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une classe par son ID"""
        classe = self.classe_repo.get_by_id(classe_id)
        return classe.to_dict() if classe else None

    def get_classe_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Récupère une classe par son code"""
        classe = self.classe_repo.get_by_code(code)
        return classe.to_dict() if classe else None

    def get_classes_by_niveau(self, niveau_id: str) -> List[Dict[str, Any]]:
        """Récupère les classes d'un niveau"""
        classes = self.classe_repo.get_by_niveau(niveau_id)
        return [classe.to_dict() for classe in classes]

    def get_classes_by_annee(self, annee_scolaire: str) -> List[Dict[str, Any]]:
        """Récupère les classes d'une année scolaire"""
        classes = self.classe_repo.get_by_annee_scolaire(annee_scolaire)
        return [classe.to_dict() for classe in classes]

    def create_classe(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée une nouvelle classe avec validations

        Validations:
        - Code: 3-50 caractères, unique
        - Nom: 3-100 caractères
        - Année scolaire: format YYYY-YYYY
        - Niveau: doit exister
        - Effectif max: entier positif
        """
        # Validation code
        code = data.get('code', '').strip().upper()
        if len(code) < 3 or len(code) > 50:
            raise ValueError("Le code doit contenir entre 3 et 50 caractères")

        # Vérifier unicité du code
        if self.classe_repo.get_by_code(code):
            raise ValueError(f"Une classe avec le code {code} existe déjà")

        # Validation nom
        nom = data.get('nom', '').strip()
        if len(nom) < 3 or len(nom) > 100:
            raise ValueError("Le nom doit contenir entre 3 et 100 caractères")

        # Validation niveau_id
        niveau_id = data.get('niveau_id')
        if not niveau_id:
            raise ValueError("Le niveau est requis")

        niveau = self.niveau_repo.get_by_id(niveau_id)
        if not niveau:
            raise ValueError("Niveau non trouvé")

        # Validation année scolaire
        annee_scolaire = data.get('annee_scolaire', '').strip()
        if len(annee_scolaire) < 9 or len(annee_scolaire) > 20:
            raise ValueError("L'année scolaire doit être au format YYYY-YYYY")

        # Validation semestre (optionnel)
        semestre = data.get('semestre')
        if semestre is not None:
            try:
                semestre = int(semestre)
                if semestre not in [1, 2]:
                    raise ValueError("Le semestre doit être 1 ou 2")
            except (ValueError, TypeError):
                raise ValueError("Le semestre doit être un nombre entier (1 ou 2)")

        # Validation effectif_max (optionnel)
        effectif_max = data.get('effectif_max')
        if effectif_max is not None:
            try:
                effectif_max = int(effectif_max)
                if effectif_max < 1:
                    raise ValueError("L'effectif maximum doit être positif")
            except (ValueError, TypeError):
                raise ValueError("L'effectif maximum doit être un nombre entier")

        # Validation description (optionnelle)
        description = data.get('description', '').strip() if data.get('description') else None
        if description and len(description) > 5000:
            raise ValueError("La description ne peut pas dépasser 5000 caractères")

        # Créer la classe
        classe = Classe(
            code=code,
            nom=nom,
            description=description,
            niveau_id=niveau_id,
            annee_scolaire=annee_scolaire,
            semestre=semestre,
            effectif_max=effectif_max,
            actif=data.get('actif', True)
        )

        classe = self.classe_repo.create(classe)
        return classe.to_dict()

    def update_classe(self, classe_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour une classe"""
        classe = self.classe_repo.get_by_id(classe_id)
        if not classe:
            raise ValueError("Classe non trouvée")

        # Validation code
        if 'code' in data:
            code = data['code'].strip().upper()
            if len(code) < 3 or len(code) > 50:
                raise ValueError("Le code doit contenir entre 3 et 50 caractères")

            existing = self.classe_repo.get_by_code(code)
            if existing and existing.id != classe_id:
                raise ValueError(f"Une classe avec le code {code} existe déjà")

            classe.code = code

        # Validation nom
        if 'nom' in data:
            nom = data['nom'].strip()
            if len(nom) < 3 or len(nom) > 100:
                raise ValueError("Le nom doit contenir entre 3 et 100 caractères")
            classe.nom = nom

        # Validation niveau_id
        if 'niveau_id' in data:
            niveau = self.niveau_repo.get_by_id(data['niveau_id'])
            if not niveau:
                raise ValueError("Niveau non trouvé")
            classe.niveau_id = data['niveau_id']

        # Validation année scolaire
        if 'annee_scolaire' in data:
            annee_scolaire = data['annee_scolaire'].strip()
            if len(annee_scolaire) < 9 or len(annee_scolaire) > 20:
                raise ValueError("L'année scolaire doit être au format YYYY-YYYY")
            classe.annee_scolaire = annee_scolaire

        # Validation semestre
        if 'semestre' in data:
            semestre = data['semestre']
            if semestre is not None:
                try:
                    semestre = int(semestre)
                    if semestre not in [1, 2]:
                        raise ValueError("Le semestre doit être 1 ou 2")
                    classe.semestre = semestre
                except (ValueError, TypeError):
                    raise ValueError("Le semestre doit être un nombre entier (1 ou 2)")
            else:
                classe.semestre = None

        # Validation effectif_max
        if 'effectif_max' in data:
            effectif_max = data['effectif_max']
            if effectif_max is not None:
                try:
                    effectif_max = int(effectif_max)
                    if effectif_max < 1:
                        raise ValueError("L'effectif maximum doit être positif")
                    classe.effectif_max = effectif_max
                except (ValueError, TypeError):
                    raise ValueError("L'effectif maximum doit être un nombre entier")
            else:
                classe.effectif_max = None

        # Validation description
        if 'description' in data:
            description = data['description'].strip() if data['description'] else None
            if description and len(description) > 5000:
                raise ValueError("La description ne peut pas dépasser 5000 caractères")
            classe.description = description

        # Actif
        if 'actif' in data:
            classe.actif = bool(data['actif'])

        classe = self.classe_repo.update(classe)
        return classe.to_dict()

    def delete_classe(self, classe_id: str) -> bool:
        """Supprime une classe"""
        classe = self.classe_repo.get_by_id(classe_id)
        if not classe:
            raise ValueError("Classe non trouvée")

        return self.classe_repo.delete(classe)

    def search_classes(self, query: str) -> List[Dict[str, Any]]:
        """Recherche des classes"""
        classes = self.classe_repo.search(query)
        return [classe.to_dict() for classe in classes]
