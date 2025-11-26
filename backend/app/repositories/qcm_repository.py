"""
Repository pour la gestion des QCM
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import or_, func
from app.repositories.base_repository import BaseRepository
from app.models.qcm import QCM


class QCMRepository(BaseRepository[QCM]):
    """Repository pour les opérations sur les QCM"""

    def __init__(self):
        super().__init__(QCM)

    def get_all_paginated(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> tuple[List[QCM], int]:
        """
        Récupère les QCM avec pagination et filtres

        Args:
            skip: Nombre d'éléments à sauter
            limit: Nombre maximum d'éléments à retourner
            filters: Dictionnaire de filtres (status, createur_id, matiere, search, etc.)

        Returns:
            Tuple (liste de QCM, total count)
        """
        query = self.session.query(QCM)

        if filters:
            # Filtre par status
            if 'status' in filters and filters['status']:
                query = query.filter(QCM.status == filters['status'])

            # Filtre par créateur
            if 'createur_id' in filters and filters['createur_id']:
                query = query.filter(QCM.createur_id == filters['createur_id'])

            # Filtre par matière
            if 'matiere' in filters and filters['matiere']:
                query = query.filter(QCM.matiere == filters['matiere'])

            # Recherche par titre ou description
            if 'search' in filters and filters['search']:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        QCM.titre.ilike(search_term),
                        QCM.description.ilike(search_term)
                    )
                )

        # Compter le total avant pagination
        total = query.count()

        # Appliquer pagination
        qcms = query.order_by(QCM.created_at.desc()).offset(skip).limit(limit).all()

        return qcms, total

    def get_by_createur(self, createur_id: str) -> List[QCM]:
        """Récupère tous les QCM d'un créateur"""
        return self.session.query(QCM).filter(QCM.createur_id == createur_id).all()

    def get_by_status(self, status: str) -> List[QCM]:
        """Récupère tous les QCM d'un certain statut"""
        return self.session.query(QCM).filter(QCM.status == status).all()

    def search(self, query: str) -> List[QCM]:
        """Recherche des QCM par titre ou description"""
        search_term = f"%{query}%"
        return self.session.query(QCM).filter(
            or_(
                QCM.titre.ilike(search_term),
                QCM.description.ilike(search_term)
            )
        ).all()

    def get_recent_qcms(self, limit: int = 10) -> List[QCM]:
        """Récupère les QCM récemment créés"""
        return self.session.query(QCM).order_by(QCM.created_at.desc()).limit(limit).all()

    def count_by_status(self) -> Dict[str, int]:
        """Compte les QCM par statut"""
        counts = {
            'draft': 0,
            'published': 0,
            'archived': 0
        }

        result = self.session.query(QCM.status, func.count(QCM.id)).group_by(QCM.status).all()
        for status, count in result:
            counts[status] = count

        return counts

    def get_published_by_matieres(self, matieres_ids: List[str]) -> List[QCM]:
        """
        Récupère les QCMs publiés pour une liste de matières
        
        Args:
            matieres_ids: Liste des IDs de matières
            
        Returns:
            Liste des QCMs publiés
        """
        return self.session.query(QCM).filter(
            QCM.status == 'published',
            QCM.matiere_id.in_(matieres_ids)
        ).order_by(QCM.created_at.desc()).all()
