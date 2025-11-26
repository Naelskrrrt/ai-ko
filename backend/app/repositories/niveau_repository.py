"""
Repository pour la gestion des Niveaux
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.niveau import Niveau


class NiveauRepository(BaseRepository[Niveau]):
    """Repository pour les opérations sur les Niveaux"""

    def __init__(self):
        super().__init__(Niveau)

    def get_by_code(self, code: str) -> Optional[Niveau]:
        """Récupère un niveau par son code"""
        return self.session.query(Niveau).filter(Niveau.code == code).first()

    def get_by_cycle(self, cycle: str) -> List[Niveau]:
        """Récupère tous les niveaux d'un cycle"""
        return self.session.query(Niveau).filter(Niveau.cycle == cycle).order_by(Niveau.ordre).all()

    def get_actifs(self) -> List[Niveau]:
        """Récupère tous les niveaux actifs"""
        return self.session.query(Niveau).filter(Niveau.actif == True).order_by(Niveau.ordre).all()

    def search(self, query: str) -> List[Niveau]:
        """Recherche des niveaux par code ou nom"""
        search_term = f"%{query}%"
        return self.session.query(Niveau).filter(
            or_(
                Niveau.code.ilike(search_term),
                Niveau.nom.ilike(search_term)
            )
        ).all()

    def get_all_ordered(self) -> List[Niveau]:
        """Récupère tous les niveaux triés par ordre"""
        return self.session.query(Niveau).order_by(Niveau.ordre).all()
