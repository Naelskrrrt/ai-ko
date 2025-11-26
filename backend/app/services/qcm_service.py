"""
Service pour la gestion des QCM avec logique métier
"""
from typing import Dict, Any, Optional, Tuple, List
from app.repositories.qcm_repository import QCMRepository
from app.repositories.user_repository import UserRepository
from app.models.qcm import QCM
from app.models.user import UserRole


class QCMService:
    """Service pour la gestion des QCM"""

    def __init__(self):
        self.qcm_repo = QCMRepository()
        self.user_repo = UserRepository()

    def get_qcms(self, filters: Optional[Dict[str, Any]] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Dict[str, Any]], int]:
        """
        Récupère la liste des QCM avec pagination et filtres

        Returns:
            Tuple (liste de QCM, total count)
        """
        qcms, total = self.qcm_repo.get_all_paginated(skip=skip, limit=limit, filters=filters)
        return [qcm.to_dict() for qcm in qcms], total

    def get_qcm_by_id(self, qcm_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un QCM par son ID"""
        qcm = self.qcm_repo.get_by_id(qcm_id)
        return qcm.to_dict() if qcm else None

    def create_qcm(self, data: Dict[str, Any], createur_id: str) -> Dict[str, Any]:
        """
        Crée un nouveau QCM avec validations hard-codées

        Validations:
        - Titre: 3-255 caractères
        - Description: maximum 5000 caractères
        - Durée: entre 1 et 999 minutes (si fournie)
        - Matière: maximum 100 caractères
        - Status: draft, published, archived
        - Créateur doit exister
        """
        # Validation créateur
        createur = self.user_repo.get_by_id(createur_id)
        if not createur:
            raise ValueError("Créateur non trouvé")

        # Validation titre
        titre = data.get('titre', '').strip()
        if len(titre) < 3 or len(titre) > 255:
            raise ValueError("Le titre doit contenir entre 3 et 255 caractères")

        # Validation description (optionnelle)
        description = data.get('description', '').strip() if data.get('description') else None
        if description and len(description) > 5000:
            raise ValueError("La description ne peut pas dépasser 5000 caractères")

        # Validation durée (optionnelle)
        duree = data.get('duree')
        if duree is not None:
            try:
                duree = int(duree)
                if duree < 1 or duree > 999:
                    raise ValueError("La durée doit être entre 1 et 999 minutes")
            except (ValueError, TypeError):
                raise ValueError("La durée doit être un nombre entier")

        # Validation matière (optionnelle)
        matiere = data.get('matiere', '').strip() if data.get('matiere') else None
        if matiere and len(matiere) > 100:
            raise ValueError("La matière ne peut pas dépasser 100 caractères")

        # Validation matiereId (recommandé)
        matiere_id = data.get('matiereId') or data.get('matiere_id')
        if matiere_id:
            # Vérifier que la matière existe
            from app.repositories.matiere_repository import MatiereRepository
            matiere_repo = MatiereRepository()
            matiere_obj = matiere_repo.get_by_id(matiere_id)
            if not matiere_obj:
                raise ValueError(f"Matière avec l'ID {matiere_id} non trouvée")
            if not matiere_obj.actif:
                raise ValueError(f"La matière {matiere_obj.nom} n'est pas active")
            # Utiliser le nom de la matière pour le champ texte (compatibilité)
            if not matiere:
                matiere = matiere_obj.nom
        elif matiere:
            # Si matiereId n'est pas fourni mais matiere (texte) l'est, chercher la matière par nom
            from app.repositories.matiere_repository import MatiereRepository
            from app.models.matiere import Matiere
            matiere_repo = MatiereRepository()
            
            # Chercher d'abord par code exact
            matiere_obj = matiere_repo.get_by_code(matiere)
            
            # Si pas trouvé, chercher par nom exact
            if not matiere_obj:
                matiere_obj = matiere_repo.session.query(Matiere).filter(
                    Matiere.nom.ilike(matiere.strip())
                ).filter(Matiere.actif == True).first()
            
            # Si toujours pas trouvé, faire une recherche partielle
            if not matiere_obj:
                results = matiere_repo.search(matiere)
                # Filtrer pour ne garder que les matières actives
                results = [m for m in results if m.actif]
                if results:
                    # Prendre la première correspondance
                    matiere_obj = results[0]
            
            if matiere_obj and matiere_obj.actif:
                matiere_id = matiere_obj.id
                matiere = matiere_obj.nom  # Utiliser le nom officiel

        # Validation status
        status = data.get('status', 'draft')
        if status not in ['draft', 'published', 'archived']:
            raise ValueError("Status invalide. Status autorisés: draft, published, archived")

        # Créer le QCM
        qcm = QCM(
            titre=titre,
            description=description,
            duree=duree,
            matiere=matiere,
            matiere_id=matiere_id,
            status=status,
            createur_id=createur_id
        )

        qcm = self.qcm_repo.create(qcm)
        return qcm.to_dict()

    def update_qcm(self, qcm_id: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Met à jour un QCM avec validations hard-codées

        Validations:
        - Titre: 3-255 caractères
        - Description: maximum 5000 caractères
        - Durée: entre 1 et 999 minutes (si fournie)
        - Status: draft, published, archived
        - Seul le créateur ou un admin peut modifier
        """
        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm:
            raise ValueError("QCM non trouvé")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role != UserRole.ADMIN and qcm.createur_id != user_id:
                raise ValueError("Vous n'avez pas la permission de modifier ce QCM")

        # Validation titre
        if 'titre' in data:
            titre = data['titre'].strip()
            if len(titre) < 3 or len(titre) > 255:
                raise ValueError("Le titre doit contenir entre 3 et 255 caractères")
            qcm.titre = titre

        # Validation description
        if 'description' in data:
            description = data['description'].strip() if data['description'] else None
            if description and len(description) > 5000:
                raise ValueError("La description ne peut pas dépasser 5000 caractères")
            qcm.description = description

        # Validation durée
        if 'duree' in data and data['duree'] is not None:
            try:
                duree = int(data['duree'])
                if duree < 1 or duree > 999:
                    raise ValueError("La durée doit être entre 1 et 999 minutes")
                qcm.duree = duree
            except (ValueError, TypeError):
                raise ValueError("La durée doit être un nombre entier")

        # Validation matière (texte, deprecated)
        if 'matiere' in data:
            matiere = data['matiere'].strip() if data['matiere'] else None
            if matiere and len(matiere) > 100:
                raise ValueError("La matière ne peut pas dépasser 100 caractères")
            qcm.matiere = matiere

        # Validation matiereId (recommandé)
        if 'matiereId' in data or 'matiere_id' in data:
            matiere_id = data.get('matiereId') or data.get('matiere_id')
            if matiere_id:
                # Vérifier que la matière existe
                from app.repositories.matiere_repository import MatiereRepository
                matiere_repo = MatiereRepository()
                matiere_obj = matiere_repo.get_by_id(matiere_id)
                if not matiere_obj:
                    raise ValueError(f"Matière avec l'ID {matiere_id} non trouvée")
                if not matiere_obj.actif:
                    raise ValueError(f"La matière {matiere_obj.nom} n'est pas active")
                qcm.matiere_id = matiere_id
                # Mettre à jour le nom de la matière pour compatibilité
                if not qcm.matiere:
                    qcm.matiere = matiere_obj.nom
            else:
                # Si matiereId est null, supprimer la relation
                qcm.matiere_id = None
        elif 'matiere' in data and data['matiere']:
            # Si matiereId n'est pas fourni mais matiere (texte) l'est, chercher la matière par nom
            matiere_text = data['matiere'].strip()
            from app.repositories.matiere_repository import MatiereRepository
            from app.models.matiere import Matiere
            matiere_repo = MatiereRepository()
            
            # Chercher d'abord par code exact
            matiere_obj = matiere_repo.get_by_code(matiere_text)
            
            # Si pas trouvé, chercher par nom exact
            if not matiere_obj:
                matiere_obj = matiere_repo.session.query(Matiere).filter(
                    Matiere.nom.ilike(matiere_text)
                ).filter(Matiere.actif == True).first()
            
            # Si toujours pas trouvé, faire une recherche partielle
            if not matiere_obj:
                results = matiere_repo.search(matiere_text)
                # Filtrer pour ne garder que les matières actives
                results = [m for m in results if m.actif]
                if results:
                    # Prendre la première correspondance
                    matiere_obj = results[0]
            
            if matiere_obj and matiere_obj.actif:
                qcm.matiere_id = matiere_obj.id
                qcm.matiere = matiere_obj.nom  # Utiliser le nom officiel

        # Validation status
        if 'status' in data:
            if data['status'] not in ['draft', 'published', 'archived']:
                raise ValueError("Status invalide. Status autorisés: draft, published, archived")
            qcm.status = data['status']

        qcm = self.qcm_repo.update(qcm)
        return qcm.to_dict()

    def delete_qcm(self, qcm_id: str, user_id: Optional[str] = None) -> bool:
        """
        Supprime un QCM avec validations hard-codées

        Validations:
        - Seul le créateur ou un admin peut supprimer
        """
        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm:
            raise ValueError("QCM non trouvé")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role != UserRole.ADMIN and qcm.createur_id != user_id:
                raise ValueError("Vous n'avez pas la permission de supprimer ce QCM")

        return self.qcm_repo.delete(qcm)

    def get_recent_qcms(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Récupère les QCM récemment créés"""
        qcms = self.qcm_repo.get_recent_qcms(limit=limit)
        return [qcm.to_dict() for qcm in qcms]

    def get_qcms_by_status(self) -> Dict[str, int]:
        """Récupère le nombre de QCM par statut"""
        return self.qcm_repo.count_by_status()

    def can_access_qcm(self, qcm_id: str, user_id: Optional[str] = None) -> bool:
        """
        Vérifie si un utilisateur peut accéder à un QCM
        
        Logique:
        - Si le QCM est publié : tous les utilisateurs authentifiés peuvent y accéder
        - Si le QCM n'est pas publié : seul le créateur ou un admin peut y accéder
        
        Args:
            qcm_id: ID du QCM
            user_id: ID de l'utilisateur (optionnel)
            
        Returns:
            True si l'utilisateur peut accéder au QCM, False sinon
        """
        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm:
            return False
        
        # Si le QCM est publié, tous les utilisateurs authentifiés peuvent y accéder
        if qcm.status == 'published':
            return True
        
        # Si le QCM n'est pas publié, seul le créateur ou un admin peut y accéder
        if not user_id:
            return False
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False
        
        # Le créateur ou un admin peut toujours accéder
        return user.role == UserRole.ADMIN or qcm.createur_id == user_id
