"""
Repository pour la gestion des Sessions d'Examen
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import or_, and_
from sqlalchemy.orm import joinedload
from app.repositories.base_repository import BaseRepository
from app.models.session_examen import SessionExamen
from app.models.qcm import QCM


class SessionExamenRepository(BaseRepository[SessionExamen]):
    """Repository pour les opérations sur les Sessions d'Examen"""

    def __init__(self):
        super().__init__(SessionExamen)

    def get_by_id(self, id: str) -> Optional[SessionExamen]:
        """Récupère une session par son ID avec le QCM et sa matière chargés"""
        return self.session.query(SessionExamen).options(
            joinedload(SessionExamen.qcm).joinedload(QCM.matiere_obj)
        ).filter(SessionExamen.id == id).first()

    def get_by_qcm(self, qcm_id: str) -> List[SessionExamen]:
        """Récupère toutes les sessions d'un QCM"""
        return self.session.query(SessionExamen).options(
            joinedload(SessionExamen.qcm).joinedload(QCM.matiere_obj)
        ).filter(SessionExamen.qcm_id == qcm_id).order_by(SessionExamen.date_debut.desc()).all()

    def get_by_classe(self, classe_id: str) -> List[SessionExamen]:
        """Récupère toutes les sessions d'une classe"""
        return self.session.query(SessionExamen).options(
            joinedload(SessionExamen.qcm).joinedload(QCM.matiere_obj)
        ).filter(SessionExamen.classe_id == classe_id).order_by(SessionExamen.date_debut.desc()).all()

    def get_by_createur(self, createur_id: str) -> List[SessionExamen]:
        """Récupère toutes les sessions créées par un enseignant"""
        return self.session.query(SessionExamen).options(
            joinedload(SessionExamen.qcm).joinedload(QCM.matiere_obj)
        ).filter(SessionExamen.createur_id == createur_id).order_by(SessionExamen.date_debut.desc()).all()

    def get_by_status(self, status: str) -> List[SessionExamen]:
        """Récupère toutes les sessions d'un certain statut"""
        return self.session.query(SessionExamen).filter(SessionExamen.status == status).order_by(SessionExamen.date_debut.desc()).all()

    def get_actives(self) -> List[SessionExamen]:
        """Récupère les sessions en cours ou programmées"""
        return self.session.query(SessionExamen).filter(
            SessionExamen.status.in_(['programmee', 'en_cours'])
        ).order_by(SessionExamen.date_debut).all()

    def get_disponibles_etudiant(self, etudiant_id: str) -> List[SessionExamen]:
        """
        Récupère les sessions disponibles pour un étudiant
        Inclut les sessions programmées et en cours
        La date de début n'est plus une restriction - seule la date de fin (limite de soumission) compte
        """
        now = datetime.utcnow()
        return self.session.query(SessionExamen).options(
            joinedload(SessionExamen.qcm).joinedload(QCM.matiere_obj)
        ).filter(
            and_(
                SessionExamen.status.in_(['programmee', 'en_cours']),
                SessionExamen.date_fin >= now  # Seule la date de fin (limite de soumission) est vérifiée
            )
        ).order_by(SessionExamen.date_debut).all()

    def get_all_paginated(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> tuple[List[SessionExamen], int]:
        """Récupère les sessions avec pagination et filtres"""
        # Charger le QCM et sa relation matiere_obj en une seule requête
        query = self.session.query(SessionExamen).options(
            joinedload(SessionExamen.qcm).joinedload(QCM.matiere_obj)
        )

        if filters:
            if 'status' in filters and filters['status']:
                query = query.filter(SessionExamen.status == filters['status'])

            if 'qcm_id' in filters and filters['qcm_id']:
                query = query.filter(SessionExamen.qcm_id == filters['qcm_id'])

            if 'classe_id' in filters and filters['classe_id']:
                query = query.filter(SessionExamen.classe_id == filters['classe_id'])

            if 'createur_id' in filters and filters['createur_id']:
                query = query.filter(SessionExamen.createur_id == filters['createur_id'])

            if 'search' in filters and filters['search']:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        SessionExamen.titre.ilike(search_term),
                        SessionExamen.description.ilike(search_term)
                    )
                )

        total = query.count()
        sessions = query.order_by(SessionExamen.date_debut.desc()).offset(skip).limit(limit).all()

        return sessions, total

    def search(self, query: str) -> List[SessionExamen]:
        """Recherche des sessions par titre"""
        search_term = f"%{query}%"
        return self.session.query(SessionExamen).filter(
            SessionExamen.titre.ilike(search_term)
        ).all()
