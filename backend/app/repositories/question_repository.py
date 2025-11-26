"""
Repository pour la gestion des Questions
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import or_, func
from app.repositories.base_repository import BaseRepository
from app.models.question import Question


class QuestionRepository(BaseRepository[Question]):
    """Repository pour les opérations sur les Questions"""

    def __init__(self):
        super().__init__(Question)

    def get_all_paginated(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> tuple[List[Question], int]:
        """
        Récupère les questions avec pagination et filtres

        Args:
            skip: Nombre d'éléments à sauter
            limit: Nombre maximum d'éléments à retourner
            filters: Dictionnaire de filtres (type_question, qcm_id, search, etc.)

        Returns:
            Tuple (liste de questions, total count)
        """
        query = self.session.query(Question)

        if filters:
            # Filtre par type de question
            if 'type_question' in filters and filters['type_question']:
                query = query.filter(Question.type_question == filters['type_question'])

            # Filtre par QCM
            if 'qcm_id' in filters and filters['qcm_id']:
                query = query.filter(Question.qcm_id == filters['qcm_id'])

            # Recherche par énoncé
            if 'search' in filters and filters['search']:
                search_term = f"%{filters['search']}%"
                query = query.filter(Question.enonce.ilike(search_term))

        # Compter le total avant pagination
        total = query.count()

        # Appliquer pagination
        questions = query.order_by(Question.created_at.desc()).offset(skip).limit(limit).all()

        return questions, total

    def get_by_qcm(self, qcm_id: str) -> List[Question]:
        """Récupère toutes les questions d'un QCM"""
        return self.session.query(Question).filter(Question.qcm_id == qcm_id).all()

    def get_by_type(self, type_question: str) -> List[Question]:
        """Récupère toutes les questions d'un certain type"""
        return self.session.query(Question).filter(Question.type_question == type_question).all()

    def search_by_enonce(self, query: str) -> List[Question]:
        """Recherche des questions par énoncé"""
        search_term = f"%{query}%"
        return self.session.query(Question).filter(Question.enonce.ilike(search_term)).all()

    def count_by_qcm(self, qcm_id: str) -> int:
        """Compte le nombre de questions dans un QCM"""
        return self.session.query(Question).filter(Question.qcm_id == qcm_id).count()

    def count_by_type(self) -> Dict[str, int]:
        """Compte les questions par type"""
        counts = {
            'qcm': 0,
            'vrai_faux': 0,
            'texte_libre': 0
        }

        result = self.session.query(Question.type_question, func.count(Question.id)).group_by(Question.type_question).all()
        for type_q, count in result:
            counts[type_q] = count

        return counts
