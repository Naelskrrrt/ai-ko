"""
Service pour la gestion des QCMs côté étudiant
"""
from typing import List, Dict, Any
from app.repositories.qcm_repository import QCMRepository
from app.repositories.user_repository import UserRepository
from app.repositories.etudiant_repository import EtudiantRepository
from app.models.user import UserRole
from app.models.matiere import Matiere


class QCMEtudiantService:
    """Service pour récupérer les QCMs disponibles pour les étudiants"""
    
    def __init__(self):
        self.qcm_repo = QCMRepository()
        self.user_repo = UserRepository()
        self.etudiant_repo = EtudiantRepository()
    
    def get_qcms_disponibles(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Récupère les QCMs publiés disponibles pour un étudiant
        basés sur les matières qu'il suit
        
        Args:
            user_id: ID de l'utilisateur (User)
            
        Returns:
            Liste des QCMs disponibles
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Récupérer l'utilisateur
        user = self.user_repo.get_by_id(user_id)
        if not user or user.role != UserRole.ETUDIANT:
            logger.warning(f"Utilisateur {user_id} non trouvé ou n'est pas un étudiant")
            return []
        
        # Récupérer le profil étudiant
        if not user.etudiant_profil:
            logger.warning(f"Utilisateur {user_id} n'a pas de profil étudiant")
            return []
        
        etudiant = user.etudiant_profil
        
        # Récupérer les matières suivies par l'étudiant (actives uniquement)
        matieres = etudiant.matieres.filter(Matiere.actif == True).all()
        matieres_ids = [m.id for m in matieres]
        
        logger.info(f"Étudiant {user_id} suit {len(matieres_ids)} matière(s): {[m.nom for m in matieres]}")
        
        if not matieres_ids:
            logger.warning(f"Étudiant {user_id} n'a aucune matière assignée")
            return []
        
        # Récupérer les QCMs publiés pour ces matières
        qcms = self.qcm_repo.get_published_by_matieres(matieres_ids)
        logger.info(f"Trouvé {len(qcms)} QCM(s) publié(s) pour les matières de l'étudiant {user_id}")
        
        return [qcm.to_dict() for qcm in qcms]
    
    def can_access_qcm(self, qcm_id: str, user_id: str) -> bool:
        """
        Vérifie si un étudiant peut accéder à un QCM
        
        Args:
            qcm_id: ID du QCM
            user_id: ID de l'utilisateur (User)
            
        Returns:
            True si l'étudiant peut accéder au QCM
        """
        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm or qcm.status != 'published':
            return False
        
        # Vérifier si l'utilisateur est un étudiant
        user = self.user_repo.get_by_id(user_id)
        if not user or user.role != UserRole.ETUDIANT:
            return False
        
        # Vérifier si l'utilisateur a un profil étudiant
        if not user.etudiant_profil:
            return False
        
        etudiant = user.etudiant_profil
        
        if not qcm.matiere_id:
            return False
        
        # Récupérer les matières suivies par l'étudiant (actives uniquement)
        matieres_ids = [m.id for m in etudiant.matieres.filter(Matiere.actif == True).all()]
        return qcm.matiere_id in matieres_ids

