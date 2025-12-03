"""
Repository pour la gestion des Mentions
"""
from typing import List, Optional
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.mention import Mention


class MentionRepository(BaseRepository[Mention]):
    """Repository pour les opérations sur les Mentions"""

    def __init__(self):
        super().__init__(Mention)

    def get_by_code(self, code: str) -> Optional[Mention]:
        """Récupère une mention par son code"""
        return self.session.query(Mention).filter(Mention.code == code).first()

    def get_by_etablissement(self, etablissement_id: str) -> List[Mention]:
        """Récupère toutes les mentions d'un établissement"""
        return self.session.query(Mention).filter(
            Mention.etablissement_id == etablissement_id
        ).all()

    def get_actives(self) -> List[Mention]:
        """Récupère toutes les mentions actives"""
        return self.session.query(Mention).filter(Mention.actif == True).all()

    def search(self, query: str) -> List[Mention]:
        """Recherche des mentions par code ou nom"""
        search_term = f"%{query}%"
        return self.session.query(Mention).filter(
            or_(
                Mention.code.ilike(search_term),
                Mention.nom.ilike(search_term)
            )
        ).all()




