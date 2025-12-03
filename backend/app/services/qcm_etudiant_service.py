"""
Service pour la gestion des QCMs côté étudiant
"""
from typing import List, Dict, Any
from app.repositories.qcm_repository import QCMRepository
from app.repositories.user_repository import UserRepository
from app.models.user import UserRole


class QCMEtudiantService:
    """Service pour récupérer les QCMs disponibles pour les étudiants"""
    
    def __init__(self):
        self.qcm_repo = QCMRepository()
        self.user_repo = UserRepository()
    
    def get_qcms_disponibles(self, etudiant_id: str) -> List[Dict[str, Any]]:
        """
        Récupère les QCMs publiés disponibles pour un étudiant
        basés sur les matières qu'il suit
        
        Args:
            etudiant_id: ID de l'étudiant
            
        Returns:
            Liste des QCMs disponibles
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Récupérer l'étudiant
        etudiant = self.user_repo.get_by_id(etudiant_id)
        if not etudiant or etudiant.role != UserRole.ETUDIANT:
            logger.warning(f"Étudiant {etudiant_id} non trouvé ou n'est pas un étudiant")
            return []
        
        # Récupérer les matières suivies par l'étudiant (actives uniquement)
        matieres = etudiant.matieres_etudiees.filter_by(actif=True).all()
        matieres_ids = [m.id for m in matieres]
        
        logger.info(f"Étudiant {etudiant_id} suit {len(matieres_ids)} matière(s): {[m.nom for m in matieres]}")
        
        if not matieres_ids:
            logger.warning(f"Étudiant {etudiant_id} n'a aucune matière assignée")
            return []
        
        # Récupérer les QCMs publiés pour ces matières
        qcms = self.qcm_repo.get_published_by_matieres(matieres_ids)
        logger.info(f"Trouvé {len(qcms)} QCM(s) publié(s) pour les matières de l'étudiant {etudiant_id}")
        
        return [qcm.to_dict() for qcm in qcms]
    
    def can_access_qcm(self, qcm_id: str, etudiant_id: str) -> bool:
        """
        Vérifie si un étudiant peut accéder à un QCM
        
        Args:
            qcm_id: ID du QCM
            etudiant_id: ID de l'étudiant
            
        Returns:
            True si l'étudiant peut accéder au QCM
        """
        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm or qcm.status != 'published':
            return False
        
        # Vérifier si l'étudiant suit la matière du QCM
        etudiant = self.user_repo.get_by_id(etudiant_id)
        if not etudiant or etudiant.role != UserRole.ETUDIANT:
            return False
        
        if not qcm.matiere_id:
            return False
        
        matieres_ids = [m.id for m in etudiant.matieres_etudiees.filter_by(actif=True).all()]
        return qcm.matiere_id in matieres_ids

