"""
Repository pour la gestion des Classes
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.classe import Classe


class ClasseRepository(BaseRepository[Classe]):
    """Repository pour les opérations sur les Classes"""

    def __init__(self):
        super().__init__(Classe)

    def get_by_code(self, code: str) -> Optional[Classe]:
        """Récupère une classe par son code"""
        return self.session.query(Classe).filter(Classe.code == code).first()

    def get_by_niveau(self, niveau_id: str) -> List[Classe]:
        """Récupère toutes les classes d'un niveau"""
        return self.session.query(Classe).filter(Classe.niveau_id == niveau_id).order_by(Classe.nom).all()

    def get_by_annee_scolaire(self, annee_scolaire: str) -> List[Classe]:
        """Récupère toutes les classes d'une année scolaire"""
        return self.session.query(Classe).filter(Classe.annee_scolaire == annee_scolaire).order_by(Classe.nom).all()

    def get_actives(self) -> List[Classe]:
        """Récupère toutes les classes actives"""
        return self.session.query(Classe).filter(Classe.actif == True).order_by(Classe.nom).all()

    def search(self, query: str) -> List[Classe]:
        """Recherche des classes par code ou nom"""
        search_term = f"%{query}%"
        return self.session.query(Classe).filter(
            or_(
                Classe.code.ilike(search_term),
                Classe.nom.ilike(search_term)
            )
        ).all()

    def get_all_paginated(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> tuple[List[Classe], int]:
        """Récupère les classes avec pagination et filtres"""
        query = self.session.query(Classe)

        if filters:
            if 'niveau_id' in filters and filters['niveau_id']:
                query = query.filter(Classe.niveau_id == filters['niveau_id'])

            if 'annee_scolaire' in filters and filters['annee_scolaire']:
                query = query.filter(Classe.annee_scolaire == filters['annee_scolaire'])

            if 'actif' in filters and filters['actif'] is not None:
                query = query.filter(Classe.actif == filters['actif'])

            if 'search' in filters and filters['search']:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        Classe.code.ilike(search_term),
                        Classe.nom.ilike(search_term)
                    )
                )

        total = query.count()
        classes = query.order_by(Classe.nom).offset(skip).limit(limit).all()

        return classes, total
