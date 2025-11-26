"""
Repository pour la gestion des Matières
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.matiere import Matiere


class MatiereRepository(BaseRepository[Matiere]):
    """Repository pour les opérations sur les Matières"""

    def __init__(self):
        super().__init__(Matiere)

    def get_by_code(self, code: str) -> Optional[Matiere]:
        """Récupère une matière par son code"""
        return self.session.query(Matiere).filter(Matiere.code == code).first()

    def get_actives(self) -> List[Matiere]:
        """Récupère toutes les matières actives"""
        return self.session.query(Matiere).filter(Matiere.actif == True).order_by(Matiere.nom).all()

    def search(self, query: str) -> List[Matiere]:
        """Recherche des matières par code ou nom"""
        search_term = f"%{query}%"
        return self.session.query(Matiere).filter(
            or_(
                Matiere.code.ilike(search_term),
                Matiere.nom.ilike(search_term)
            )
        ).all()

    def get_all_ordered(self) -> List[Matiere]:
        """Récupère toutes les matières triées par nom"""
        return self.session.query(Matiere).order_by(Matiere.nom).all()
