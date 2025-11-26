"""
Service pour les statistiques d'administration
"""
from typing import Dict, Any, List
from app.repositories.user_repository import UserRepository
from app.repositories.qcm_repository import QCMRepository
from app.repositories.question_repository import QuestionRepository


class AdminStatisticsService:
    """Service pour récupérer les statistiques admin"""

    def __init__(self):
        self.user_repo = UserRepository()
        self.qcm_repo = QCMRepository()
        self.question_repo = QuestionRepository()

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """
        Récupère les métriques principales du dashboard

        Returns:
            Dictionnaire contenant les métriques:
            - total_users: Nombre total d'utilisateurs
            - total_qcms: Nombre total de QCM
            - total_questions: Nombre total de questions
            - active_users: Nombre d'utilisateurs actifs (email_verified = True)
        """
        total_users = self.user_repo.count()
        total_qcms = self.qcm_repo.count()
        total_questions = self.question_repo.count()

        # Compter les utilisateurs actifs
        active_users_count = self.user_repo.session.query(self.user_repo.model).filter_by(email_verified=True).count()

        return {
            'totalUsers': total_users,
            'totalQcms': total_qcms,
            'totalQuestions': total_questions,
            'activeUsers': active_users_count
        }

    def get_users_by_role(self) -> Dict[str, int]:
        """
        Récupère la répartition des utilisateurs par rôle

        Returns:
            Dictionnaire {role: count}
        """
        return self.user_repo.count_by_role()

    def get_qcms_by_status(self) -> Dict[str, int]:
        """
        Récupère la répartition des QCM par statut

        Returns:
            Dictionnaire {status: count}
        """
        return self.qcm_repo.count_by_status()

    def get_recent_users(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Récupère les utilisateurs récemment inscrits

        Args:
            limit: Nombre maximum d'utilisateurs à retourner

        Returns:
            Liste d'utilisateurs (dict)
        """
        users = self.user_repo.get_recent_users(limit=limit)
        return [user.to_dict() for user in users]

    def get_recent_qcms(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Récupère les QCM récemment créés

        Args:
            limit: Nombre maximum de QCM à retourner

        Returns:
            Liste de QCM (dict)
        """
        qcms = self.qcm_repo.get_recent_qcms(limit=limit)
        return [qcm.to_dict() for qcm in qcms]

    def get_full_dashboard_stats(self) -> Dict[str, Any]:
        """
        Récupère toutes les statistiques du dashboard en une seule requête

        Returns:
            Dictionnaire complet avec toutes les stats
        """
        return {
            'metrics': self.get_dashboard_metrics(),
            'usersByRole': self.get_users_by_role(),
            'qcmsByStatus': self.get_qcms_by_status(),
            'recentUsers': self.get_recent_users(limit=5),
            'recentQcms': self.get_recent_qcms(limit=5)
        }
