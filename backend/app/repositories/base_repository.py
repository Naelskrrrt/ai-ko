"""
Repository de base avec méthodes CRUD génériques
"""
from typing import TypeVar, Generic, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app import db

T = TypeVar('T')


class BaseRepository(Generic[T]):
    """Repository de base avec méthodes CRUD génériques"""
    
    def __init__(self, model: type[T]):
        self.model = model
    
    @property
    def session(self) -> Session:
        """Récupère la session SQLAlchemy"""
        return db.session
    
    def get_by_id(self, id: str) -> Optional[T]:
        """Récupère une entité par son ID"""
        return self.session.query(self.model).get(id)
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Récupère toutes les entités avec pagination"""
        return self.session.query(self.model).offset(skip).limit(limit).all()
    
    def count(self) -> int:
        """Compte le nombre total d'entités"""
        return self.session.query(self.model).count()
    
    def create(self, entity: T) -> T:
        """Crée une nouvelle entité"""
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity
    
    def update(self, entity: T) -> T:
        """Met à jour une entité existante"""
        self.session.commit()
        self.session.refresh(entity)
        return entity
    
    def delete(self, entity: T) -> bool:
        """Supprime une entité"""
        self.session.delete(entity)
        self.session.commit()
        return True
    
    def delete_by_id(self, id: str) -> bool:
        """Supprime une entité par son ID"""
        entity = self.get_by_id(id)
        if entity:
            return self.delete(entity)
        return False



