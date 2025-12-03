"""
Repository pour la gestion des Parcours
"""
from typing import List, Optional
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.parcours import Parcours


class ParcoursRepository(BaseRepository[Parcours]):
    """Repository pour les opérations sur les Parcours"""

    def __init__(self):
        super().__init__(Parcours)

    def get_by_code(self, code: str) -> Optional[Parcours]:
        """Récupère un parcours par son code"""
        return self.session.query(Parcours).filter(Parcours.code == code).first()

    def get_by_mention(self, mention_id: str) -> List[Parcours]:
        """Récupère tous les parcours d'une mention"""
        return self.session.query(Parcours).filter(
            Parcours.mention_id == mention_id
        ).all()

    def get_actifs(self) -> List[Parcours]:
        """Récupère tous les parcours actifs"""
        return self.session.query(Parcours).filter(Parcours.actif == True).all()

    def search(self, query: str) -> List[Parcours]:
        """Recherche des parcours par code ou nom"""
        search_term = f"%{query}%"
        return self.session.query(Parcours).filter(
            or_(
                Parcours.code.ilike(search_term),
                Parcours.nom.ilike(search_term)
            )
        ).all()




