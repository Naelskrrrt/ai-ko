"""
Repository pour la gestion des utilisateurs
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import or_
from app.repositories.base_repository import BaseRepository
from app.models.user import User, UserRole


class UserRepository(BaseRepository[User]):
    """Repository pour les opérations sur les utilisateurs"""
    
    def __init__(self):
        super().__init__(User)
    
    def get_all_paginated(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None, sort_by: str = 'created_at', sort_order: str = 'desc') -> tuple[List[User], int]:
        """
        Récupère les utilisateurs avec pagination et filtres
        
        Args:
            skip: Nombre d'éléments à sauter
            limit: Nombre maximum d'éléments à retourner
            filters: Dictionnaire de filtres (role, search, etc.)
            sort_by: Colonne de tri (email, name, created_at, role)
            sort_order: Ordre de tri (asc, desc)
        
        Returns:
            Tuple (liste d'utilisateurs, total count)
        """
        query = self.session.query(User)
        
        if filters:
            # Filtre par rôle
            if 'role' in filters and filters['role']:
                role = UserRole(filters['role'])
                query = query.filter(User.role == role)
            
            # Recherche par email ou nom
            if 'search' in filters and filters['search']:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        User.email.ilike(search_term),
                        User.name.ilike(search_term)
                    )
                )
            
            # Filtre par statut (email_verified peut servir de statut actif/inactif)
            if 'active' in filters and filters['active'] is not None:
                query = query.filter(User.email_verified == filters['active'])

            # Filtre par statut d'activation (nouveau champ is_active)
            if 'user_status' in filters and filters['user_status']:
                if filters['user_status'] == 'active':
                    query = query.filter(User.is_active == True)
                elif filters['user_status'] == 'pending':
                    query = query.filter(User.is_active == False)
        
        # Compter le total avant pagination
        total = query.count()
        
        # Appliquer le tri
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order.lower() == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Appliquer pagination
        users = query.offset(skip).limit(limit).all()
        
        return users, total
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Récupère un utilisateur par son email"""
        return self.session.query(User).filter(User.email == email).first()
    
    def get_by_role(self, role: UserRole) -> List[User]:
        """Récupère tous les utilisateurs d'un rôle donné"""
        return self.session.query(User).filter(User.role == role).all()
    
    def search_by_email_or_name(self, query: str) -> List[User]:
        """Recherche des utilisateurs par email ou nom"""
        search_term = f"%{query}%"
        return self.session.query(User).filter(
            or_(
                User.email.ilike(search_term),
                User.name.ilike(search_term)
            )
        ).all()
    
    def update_role(self, user_id: str, new_role: UserRole) -> Optional[User]:
        """Met à jour le rôle d'un utilisateur"""
        user = self.get_by_id(user_id)
        if user:
            user.role = new_role
            return self.update(user)
        return None
    
    def toggle_status(self, user_id: str) -> Optional[User]:
        """
        Bascule le statut d'activation d'un utilisateur.
        
        Args:
            user_id: ID de l'utilisateur à modifier
            
        Returns:
            User: L'utilisateur mis à jour ou None si non trouvé
        """
        from app import db
        import logging
        
        logger = logging.getLogger(__name__)
        
        user = db.session.query(User).filter(User.id == user_id).first()
        
        if not user:
            logger.warning(f"[UserRepository.toggle_status] Utilisateur non trouvé: {user_id}")
            return None
        
        old_status = user.is_active
        user.is_active = not old_status
        
        db.session.commit()
        db.session.refresh(user)
        
        logger.info(
            f"[UserRepository.toggle_status] Statut modifié pour {user.email}: "
            f"{old_status} -> {user.is_active}"
        )
        
        return user
    
    def get_recent_users(self, limit: int = 10) -> List[User]:
        """Récupère les utilisateurs récemment inscrits"""
        return self.session.query(User).order_by(User.created_at.desc()).limit(limit).all()
    
    def count_by_role(self) -> Dict[str, int]:
        """Compte les utilisateurs par rôle"""
        counts = {}
        for role in UserRole:
            counts[role.value] = self.session.query(User).filter(User.role == role).count()
        return counts


# Force reload

