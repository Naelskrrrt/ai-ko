"""
Service pour la gestion des utilisateurs avec logique métier
"""
from typing import Dict, Any, Optional, Tuple, List
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash
from app import db


class UserService:
    """Service pour la gestion des utilisateurs"""
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def get_users(self, filters: Optional[Dict[str, Any]] = None, skip: int = 0, limit: int = 100, sort_by: str = 'created_at', sort_order: str = 'desc') -> Tuple[List[Dict[str, Any]], int]:
        """
        Récupère la liste des utilisateurs avec pagination et filtres
        
        Returns:
            Tuple (liste d'utilisateurs, total count)
        """
        users, total = self.user_repo.get_all_paginated(skip=skip, limit=limit, filters=filters, sort_by=sort_by, sort_order=sort_order)
        return [user.to_dict() for user in users], total
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un utilisateur par son ID"""
        user = self.user_repo.get_by_id(user_id)
        return user.to_dict() if user else None
    
    def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée un nouvel utilisateur avec validations hard-codées
        
        Validations:
        - Email unique
        - Email format valide
        - Nom: 2-100 caractères
        - Rôle valide (admin, enseignant, etudiant)
        - Mot de passe: minimum 8 caractères
        """
        # Validation email unique
        existing_user = self.user_repo.get_by_email(data['email'])
        if existing_user:
            raise ValueError("Cet email est déjà utilisé")
        
        # Validation format email (basique)
        if '@' not in data['email'] or '.' not in data['email'].split('@')[1]:
            raise ValueError("Format d'email invalide")
        
        # Validation nom
        name = data.get('name', '').strip()
        if len(name) < 2 or len(name) > 100:
            raise ValueError("Le nom doit contenir entre 2 et 100 caractères")
        
        # Validation rôle
        role_str = data.get('role', 'etudiant')
        try:
            role = UserRole(role_str)
        except ValueError:
            raise ValueError("Rôle invalide. Rôles autorisés: admin, enseignant, etudiant")
        
        # Validation mot de passe
        password = data.get('password', '')
        if len(password) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        
        # Créer l'utilisateur
        user = User(
            email=data['email'],
            name=name,
            role=role,
            # Par défaut, les utilisateurs créés manuellement par un admin sont actifs
            email_verified=data.get('email_verified', True)
        )
        user.set_password(password)
        
        user = self.user_repo.create(user)
        return user.to_dict()
    
    def update_user(self, user_id: str, data: Dict[str, Any], current_user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Met à jour un utilisateur avec validations hard-codées
        
        Validations:
        - Email unique (si changé)
        - Nom: 2-100 caractères
        - Ne peut pas changer son propre rôle
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Validation email si changé
        if 'email' in data and data['email'] != user.email:
            existing_user = self.user_repo.get_by_email(data['email'])
            if existing_user:
                raise ValueError("Cet email est déjà utilisé")
            
            # Validation format email
            if '@' not in data['email'] or '.' not in data['email'].split('@')[1]:
                raise ValueError("Format d'email invalide")
            
            user.email = data['email']
        
        # Validation et mise à jour nom
        if 'name' in data:
            name = data['name'].strip()
            if len(name) < 2 or len(name) > 100:
                raise ValueError("Le nom doit contenir entre 2 et 100 caractères")
            user.name = name
        
        # Mise à jour email_verified (statut actif/inactif)
        if 'email_verified' in data:
            user.email_verified = bool(data['email_verified'])
        
        # Mise à jour mot de passe si fourni
        if 'password' in data and data['password']:
            if len(data['password']) < 8:
                raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
            user.set_password(data['password'])
        
        user = self.user_repo.update(user)
        return user.to_dict()
    
    def delete_user(self, user_id: str, current_user_id: Optional[str] = None) -> bool:
        """
        Supprime un utilisateur avec validations hard-codées
        
        Validations:
        - Impossibilité de se supprimer soi-même
        - Supprime également le profil associé (étudiant ou enseignant)
        """
        if current_user_id and user_id == current_user_id:
            raise ValueError("Vous ne pouvez pas supprimer votre propre compte")
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Supprimer le profil associé avant de supprimer l'utilisateur
        from app.models.etudiant import Etudiant
        from app.models.enseignant import Enseignant
        from app import db
        
        # Supprimer le profil étudiant si existe
        if hasattr(user, 'etudiant_profil') and user.etudiant_profil:
            db.session.delete(user.etudiant_profil)
        
        # Supprimer le profil enseignant si existe
        if hasattr(user, 'enseignant_profil') and user.enseignant_profil:
            db.session.delete(user.enseignant_profil)
        
        # Maintenant supprimer l'utilisateur
        return self.user_repo.delete(user)
    
    def change_role(self, user_id: str, new_role_str: str, current_user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Change le rôle d'un utilisateur avec validations hard-codées
        
        Validations:
        - Rôle valide
        - Ne peut pas changer son propre rôle
        """
        if current_user_id and user_id == current_user_id:
            raise ValueError("Vous ne pouvez pas changer votre propre rôle")
        
        try:
            new_role = UserRole(new_role_str)
        except ValueError:
            raise ValueError("Rôle invalide. Rôles autorisés: admin, enseignant, etudiant")
        
        user = self.user_repo.update_role(user_id, new_role)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        return user.to_dict()
    
    def toggle_status(self, user_id: str, current_user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Bascule le statut d'activation d'un utilisateur (is_active).
        
        Args:
            user_id: ID de l'utilisateur à modifier
            current_user_id: ID de l'admin effectuant l'opération
            
        Returns:
            Dict contenant:
            - user: Données de l'utilisateur mis à jour
            - previousStatus: Ancien statut (bool)
            - newStatus: Nouveau statut (bool)
            - message: Message descriptif
            
        Raises:
            ValueError: Si l'utilisateur tente de modifier son propre statut
                       ou si l'utilisateur n'existe pas
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Validation : ne peut pas modifier son propre statut
        if current_user_id and user_id == current_user_id:
            logger.warning(
                f"[UserService.toggle_status] Tentative de modification de son propre statut "
                f"par l'utilisateur {current_user_id}"
            )
            raise ValueError("Vous ne pouvez pas modifier votre propre statut")
        
        # Récupérer l'utilisateur actuel pour avoir l'ancien statut
        current_user = self.user_repo.get_by_id(user_id)
        if not current_user:
            logger.warning(f"[UserService.toggle_status] Utilisateur non trouvé: {user_id}")
            raise ValueError("Utilisateur non trouvé")
        
        previous_status = current_user.is_active
        
        # Effectuer le toggle
        updated_user = self.user_repo.toggle_status(user_id)
        
        if not updated_user:
            logger.error(f"[UserService.toggle_status] Échec de la mise à jour pour: {user_id}")
            raise ValueError("Erreur lors de la mise à jour du statut")
        
        new_status = updated_user.is_active
        status_text = "activé" if new_status else "désactivé"
        
        logger.info(
            f"[UserService.toggle_status] Utilisateur {updated_user.email} "
            f"{status_text} par admin {current_user_id}"
        )
        
        return {
            'user': updated_user.to_dict(),
            'previousStatus': previous_status,
            'newStatus': new_status,
            'message': f"L'utilisateur {updated_user.name or updated_user.email} a été {status_text}"
        }
    
    def get_recent_users(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Récupère les utilisateurs récemment inscrits"""
        users = self.user_repo.get_recent_users(limit=limit)
        return [user.to_dict() for user in users]
    
    def get_users_by_role(self) -> Dict[str, int]:
        """Récupère le nombre d'utilisateurs par rôle"""
        return self.user_repo.count_by_role()
