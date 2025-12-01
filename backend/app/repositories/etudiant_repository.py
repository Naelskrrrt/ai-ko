"""
Repository pour la gestion des Étudiants
"""
from typing import List, Optional
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.etudiant import Etudiant
from app.models.matiere import Matiere
from app.models.classe import Classe


class EtudiantRepository(BaseRepository[Etudiant]):
    """Repository pour les opérations sur les Étudiants"""

    def __init__(self):
        super().__init__(Etudiant)

    def get_by_numero(self, numero_etudiant: str) -> Optional[Etudiant]:
        """Récupère un étudiant par son numéro"""
        return self.session.query(Etudiant).filter(
            Etudiant.numero_etudiant == numero_etudiant
        ).first()

    def get_by_user_id(self, user_id: str) -> Optional[Etudiant]:
        """Récupère un étudiant par son user_id"""
        return self.session.query(Etudiant).filter(
            Etudiant.user_id == user_id
        ).first()

    def get_by_etablissement(self, etablissement_id: str) -> List[Etudiant]:
        """Récupère tous les étudiants d'un établissement"""
        return self.session.query(Etudiant).filter(
            Etudiant.etablissement_id == etablissement_id
        ).all()

    def get_by_mention(self, mention_id: str) -> List[Etudiant]:
        """Récupère tous les étudiants d'une mention"""
        return self.session.query(Etudiant).filter(
            Etudiant.mention_id == mention_id
        ).all()

    def get_by_parcours(self, parcours_id: str) -> List[Etudiant]:
        """Récupère tous les étudiants d'un parcours"""
        return self.session.query(Etudiant).filter(
            Etudiant.parcours_id == parcours_id
        ).all()

    def get_by_niveau(self, niveau_id: str) -> List[Etudiant]:
        """Récupère tous les étudiants d'un niveau"""
        return self.session.query(Etudiant).filter(
            Etudiant.niveau_id == niveau_id
        ).all()

    def get_actifs(self) -> List[Etudiant]:
        """Récupère tous les étudiants actifs"""
        return self.session.query(Etudiant).filter(Etudiant.actif == True).all()

    def search(self, query: str) -> List[Etudiant]:
        """Recherche des étudiants par numéro ou nom"""
        search_term = f"%{query}%"
        return self.session.query(Etudiant).join(Etudiant.user).filter(
            or_(
                Etudiant.numero_etudiant.ilike(search_term),
                Etudiant.user.has(name=search_term)
            )
        ).all()

    # Gestion des relations Many-to-Many

    def get_matieres(self, etudiant_id: str) -> List[Matiere]:
        """Récupère toutes les matières d'un étudiant"""
        etudiant = self.get_by_id(etudiant_id)
        if not etudiant:
            return []
        return list(etudiant.matieres)

    def add_matiere(self, etudiant_id: str, matiere_id: str) -> bool:
        """Inscrit un étudiant à une matière"""
        try:
            etudiant = self.get_by_id(etudiant_id)
            matiere = self.session.query(Matiere).get(matiere_id)
            if etudiant and matiere:
                if matiere not in etudiant.matieres:
                    etudiant.matieres.append(matiere)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def remove_matiere(self, etudiant_id: str, matiere_id: str) -> bool:
        """Désinscrit un étudiant d'une matière"""
        try:
            etudiant = self.get_by_id(etudiant_id)
            matiere = self.session.query(Matiere).get(matiere_id)
            if etudiant and matiere:
                if matiere in etudiant.matieres:
                    etudiant.matieres.remove(matiere)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def get_classes(self, etudiant_id: str) -> List[Classe]:
        """Récupère toutes les classes d'un étudiant"""
        etudiant = self.get_by_id(etudiant_id)
        if not etudiant:
            return []
        return list(etudiant.classes)

    def add_classe(self, etudiant_id: str, classe_id: str) -> bool:
        """Inscrit un étudiant à une classe"""
        try:
            etudiant = self.get_by_id(etudiant_id)
            classe = self.session.query(Classe).get(classe_id)
            if etudiant and classe:
                if classe not in etudiant.classes:
                    etudiant.classes.append(classe)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

    def remove_classe(self, etudiant_id: str, classe_id: str) -> bool:
        """Désinscrit un étudiant d'une classe"""
        try:
            etudiant = self.get_by_id(etudiant_id)
            classe = self.session.query(Classe).get(classe_id)
            if etudiant and classe:
                if classe in etudiant.classes:
                    etudiant.classes.remove(classe)
                    self.session.commit()
                return True
        except Exception as e:
            self.session.rollback()
            raise e
        return False

