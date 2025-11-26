"""
Service pour la gestion des Questions avec logique métier
"""
from typing import Dict, Any, Optional, Tuple, List
from app.repositories.question_repository import QuestionRepository
from app.repositories.qcm_repository import QCMRepository
from app.repositories.user_repository import UserRepository
from app.models.question import Question
from app.models.user import UserRole


class QuestionService:
    """Service pour la gestion des Questions"""

    def __init__(self):
        self.question_repo = QuestionRepository()
        self.qcm_repo = QCMRepository()
        self.user_repo = UserRepository()

    def get_questions(self, filters: Optional[Dict[str, Any]] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Dict[str, Any]], int]:
        """
        Récupère la liste des questions avec pagination et filtres

        Returns:
            Tuple (liste de questions, total count)
        """
        questions, total = self.question_repo.get_all_paginated(skip=skip, limit=limit, filters=filters)
        return [question.to_dict() for question in questions], total

    def get_question_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une question par son ID"""
        question = self.question_repo.get_by_id(question_id)
        return question.to_dict() if question else None

    def create_question(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Crée une nouvelle question avec validations hard-codées

        Validations:
        - Énoncé: 5-5000 caractères
        - Type: qcm, vrai_faux, texte_libre
        - Points: entre 1 et 100
        - QCM doit exister
        - Pour type qcm: options doit contenir au moins 2 options avec au moins une correcte
        """
        # Validation énoncé
        enonce = data.get('enonce', '').strip()
        if len(enonce) < 5 or len(enonce) > 5000:
            raise ValueError("L'énoncé doit contenir entre 5 et 5000 caractères")

        # Validation type question
        type_question = data.get('type_question', 'qcm')
        if type_question not in ['qcm', 'vrai_faux', 'texte_libre']:
            raise ValueError("Type de question invalide. Types autorisés: qcm, vrai_faux, texte_libre")

        # Validation points
        points = data.get('points', 1)
        try:
            points = int(points)
            if points < 1 or points > 100:
                raise ValueError("Les points doivent être entre 1 et 100")
        except (ValueError, TypeError):
            raise ValueError("Les points doivent être un nombre entier")

        # Validation QCM
        qcm_id = data.get('qcm_id')
        if not qcm_id:
            raise ValueError("Le QCM est requis")

        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm:
            raise ValueError("QCM non trouvé")

        # Vérification des permissions (seul le créateur du QCM ou un admin peut ajouter des questions)
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role != UserRole.ADMIN and qcm.createur_id != user_id:
                raise ValueError("Vous n'avez pas la permission d'ajouter des questions à ce QCM")

        # Créer la question
        question = Question(
            enonce=enonce,
            type_question=type_question,
            points=points,
            qcm_id=qcm_id,
            explication=data.get('explication', '').strip() if data.get('explication') else None
        )

        # Validation et ajout des options pour QCM
        if type_question == 'qcm':
            options = data.get('options', [])
            if not isinstance(options, list) or len(options) < 2:
                raise ValueError("Un QCM doit avoir au moins 2 options")

            # Vérifier qu'au moins une option est correcte
            has_correct = any(opt.get('estCorrecte', False) for opt in options)
            if not has_correct:
                raise ValueError("Au moins une option doit être marquée comme correcte")

            question.set_options(options)

        # Pour vrai/faux et texte_libre
        elif type_question in ['vrai_faux', 'texte_libre']:
            reponse_correcte = data.get('reponse_correcte', '').strip()
            if not reponse_correcte:
                raise ValueError("La réponse correcte est requise")
            question.reponse_correcte = reponse_correcte

        question = self.question_repo.create(question)
        return question.to_dict()

    def update_question(self, question_id: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Met à jour une question avec validations hard-codées

        Validations:
        - Énoncé: 5-5000 caractères
        - Points: entre 1 et 100
        - Seul le créateur du QCM ou un admin peut modifier
        """
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise ValueError("Question non trouvée")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            qcm = question.qcm
            if user and user.role != UserRole.ADMIN and qcm.createur_id != user_id:
                raise ValueError("Vous n'avez pas la permission de modifier cette question")

        # Validation énoncé
        if 'enonce' in data:
            enonce = data['enonce'].strip()
            if len(enonce) < 5 or len(enonce) > 5000:
                raise ValueError("L'énoncé doit contenir entre 5 et 5000 caractères")
            question.enonce = enonce

        # Validation points
        if 'points' in data:
            try:
                points = int(data['points'])
                if points < 1 or points > 100:
                    raise ValueError("Les points doivent être entre 1 et 100")
                question.points = points
            except (ValueError, TypeError):
                raise ValueError("Les points doivent être un nombre entier")

        # Mise à jour options pour QCM
        if 'options' in data and question.type_question == 'qcm':
            options = data['options']
            if not isinstance(options, list) or len(options) < 2:
                raise ValueError("Un QCM doit avoir au moins 2 options")

            has_correct = any(opt.get('estCorrecte', False) for opt in options)
            if not has_correct:
                raise ValueError("Au moins une option doit être marquée comme correcte")

            question.set_options(options)

        # Mise à jour réponse correcte
        if 'reponse_correcte' in data:
            question.reponse_correcte = data['reponse_correcte'].strip()

        # Mise à jour explication
        if 'explication' in data:
            question.explication = data['explication'].strip() if data['explication'] else None

        question = self.question_repo.update(question)
        return question.to_dict()

    def delete_question(self, question_id: str, user_id: Optional[str] = None) -> bool:
        """
        Supprime une question avec validations hard-codées

        Validations:
        - Seul le créateur du QCM ou un admin peut supprimer
        """
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise ValueError("Question non trouvée")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            qcm = question.qcm
            if user and user.role != UserRole.ADMIN and qcm.createur_id != user_id:
                raise ValueError("Vous n'avez pas la permission de supprimer cette question")

        return self.question_repo.delete(question)

    def get_questions_by_qcm(self, qcm_id: str) -> List[Dict[str, Any]]:
        """Récupère toutes les questions d'un QCM"""
        questions = self.question_repo.get_by_qcm(qcm_id)
        return [question.to_dict() for question in questions]
