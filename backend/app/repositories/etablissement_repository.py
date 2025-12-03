"""
Repository pour la gestion des Établissements
"""
from typing import List, Optional
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.etablissement import Etablissement


class EtablissementRepository(BaseRepository[Etablissement]):
    """Repository pour les opérations sur les Établissements"""

    def __init__(self):
        super().__init__(Etablissement)

    def get_by_code(self, code: str) -> Optional[Etablissement]:
        """Récupère un établissement par son code"""
        return self.session.query(Etablissement).filter(Etablissement.code == code).first()

    def get_by_ville(self, ville: str) -> List[Etablissement]:
        """Récupère tous les établissements d'une ville"""
        return self.session.query(Etablissement).filter(Etablissement.ville.ilike(f"%{ville}%")).all()

    def get_by_type(self, type_etablissement: str) -> List[Etablissement]:
        """Récupère tous les établissements d'un type"""
        return self.session.query(Etablissement).filter(
            Etablissement.type_etablissement == type_etablissement
        ).all()

    def get_actifs(self) -> List[Etablissement]:
        """Récupère tous les établissements actifs"""
        return self.session.query(Etablissement).filter(Etablissement.actif == True).all()

    def search(self, query: str) -> List[Etablissement]:
        """Recherche des établissements par code, nom ou ville"""
        search_term = f"%{query}%"
        return self.session.query(Etablissement).filter(
            or_(
                Etablissement.code.ilike(search_term),
                Etablissement.nom.ilike(search_term),
                Etablissement.nom_court.ilike(search_term),
                Etablissement.ville.ilike(search_term)
            )
        ).all()




