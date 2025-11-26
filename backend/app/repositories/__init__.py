"""
Repositories pour l'accès aux données
"""
from app.repositories.base_repository import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.qcm_repository import QCMRepository
from app.repositories.question_repository import QuestionRepository

__all__ = ['BaseRepository', 'UserRepository', 'QCMRepository', 'QuestionRepository']



