"""
Repository pour la gestion des Enseignants
"""
from typing import List, Optional
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.enseignant import Enseignant
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.parcours import Parcours
from app.models.mention import Mention


class EnseignantRepository(BaseRepository[Enseignant]):
    """Repository pour les opérations sur les Enseignants"""

    def __init__(self):
        super().__init__(Enseignant)

    def get_by_numero(self, numero_enseignant: str) -> Optional[Enseignant]:
        """Récupère un enseignant par son numéro"""
        return self.session.query(Enseignant).filter(
            Enseignant.numero_enseignant == numero_enseignant
        ).first()

    def get_by_user_id(self, user_id: str) -> Optional[Enseignant]:
        """Récupère un enseignant par son user_id"""
        return self.session.query(Enseignant).filter(
            Enseignant.user_id == user_id
        ).first()

    def get_by_etablissement(self, etablissement_id: str) -> List[Enseignant]:
        """Récupère tous les enseignants d'un établissement"""
        return self.session.query(Enseignant).filter(
            Enseignant.etablissement_id == etablissement_id
        ).all()

    def get_actifs(self) -> List[Enseignant]:
        """Récupère tous les enseignants actifs"""
        return self.session.query(Enseignant).filter(Enseignant.actif == True).all()

    def search(self, query: str) -> List[Enseignant]:
        """Recherche des enseignants par numéro, nom ou spécialité"""
        search_term = f"%{query}%"
        return self.session.query(Enseignant).join(Enseignant.user).filter(
            or_(
                Enseignant.numero_enseignant.ilike(search_term),
                Enseignant.specialite.ilike(search_term),
                Enseignant.departement.ilike(search_term),
                Enseignant.user.has(name=search_term)
            )
        ).all()

    # Gestion des relations Many-to-Many

    def get_matieres(self, enseignant_id: str) -> List[Matiere]:
        """Récupère toutes les matières d'un enseignant"""
        enseignant = self.get_by_id(enseignant_id)
        if not enseignant:
            return []
        return list(enseignant.matieres)

    def add_matiere(self, enseignant_id: str, matiere_id: str) -> bool:
        """Associe une matière à un enseignant"""
        try:
            enseignant = self.get_by_id(enseignant_id)
            matiere = self.session.query(Matiere).get(matiere_id)
            if enseignant and matiere:
                if matiere not in enseignant.matieres:
                    enseignant.matieres.append(matiere)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def remove_matiere(self, enseignant_id: str, matiere_id: str) -> bool:
        """Dissocie une matière d'un enseignant"""
        try:
            enseignant = self.get_by_id(enseignant_id)
            matiere = self.session.query(Matiere).get(matiere_id)
            if enseignant and matiere:
                if matiere in enseignant.matieres:
                    enseignant.matieres.remove(matiere)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def get_niveaux(self, enseignant_id: str) -> List[Niveau]:
        """Récupère tous les niveaux d'un enseignant"""
        enseignant = self.get_by_id(enseignant_id)
        if not enseignant:
            return []
        return list(enseignant.niveaux)

    def add_niveau(self, enseignant_id: str, niveau_id: str) -> bool:
        """Associe un niveau à un enseignant"""
        try:
            enseignant = self.get_by_id(enseignant_id)
            niveau = self.session.query(Niveau).get(niveau_id)
            if enseignant and niveau:
                if niveau not in enseignant.niveaux:
                    enseignant.niveaux.append(niveau)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def remove_niveau(self, enseignant_id: str, niveau_id: str) -> bool:
        """Dissocie un niveau d'un enseignant"""
        try:
            enseignant = self.get_by_id(enseignant_id)
            niveau = self.session.query(Niveau).get(niveau_id)
            if enseignant and niveau:
                if niveau in enseignant.niveaux:
                    enseignant.niveaux.remove(niveau)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def get_parcours(self, enseignant_id: str) -> List[Parcours]:
        """Récupère tous les parcours d'un enseignant"""
        enseignant = self.get_by_id(enseignant_id)
        if not enseignant:
            return []
        return list(enseignant.parcours)

    def add_parcours(self, enseignant_id: str, parcours_id: str) -> bool:
        """Associe un parcours à un enseignant"""
        try:
            enseignant = self.get_by_id(enseignant_id)
            parcours = self.session.query(Parcours).get(parcours_id)
            if enseignant and parcours:
                if parcours not in enseignant.parcours:
                    enseignant.parcours.append(parcours)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def get_mentions(self, enseignant_id: str) -> List[Mention]:
        """Récupère toutes les mentions d'un enseignant"""
        enseignant = self.get_by_id(enseignant_id)
        if not enseignant:
            return []
        return list(enseignant.mentions)

    def add_mention(self, enseignant_id: str, mention_id: str) -> bool:
        """Associe une mention à un enseignant"""
        try:
            enseignant = self.get_by_id(enseignant_id)
            mention = self.session.query(Mention).get(mention_id)
            if enseignant and mention:
                if mention not in enseignant.mentions:
                    enseignant.mentions.append(mention)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False




