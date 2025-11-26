"""
Routes API pour la correction automatique
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from celery.result import AsyncResult
from celery_app import celery
import logging

logger = logging.getLogger(__name__)

# Imports optionnels pour les tâches de correction (peuvent ne pas être disponibles)
try:
    from app.tasks.correction import correct_student_answer, batch_correct_answers
    CORRECTION_AVAILABLE = True
except ImportError as e:
    CORRECTION_AVAILABLE = False
    logger.warning(f"Correction automatique non disponible: {e}")
    # Créer des fonctions stub pour éviter les erreurs
    def correct_student_answer(*args, **kwargs):
        raise ImportError("La correction automatique nécessite certaines dépendances. Installez-les avec: pip install transformers torch numpy")
    def batch_correct_answers(*args, **kwargs):
        raise ImportError("La correction automatique nécessite certaines dépendances. Installez-les avec: pip install transformers torch numpy")

# Namespace pour l'API
api = Namespace('correction', description='Correction automatique des réponses')

# Modèles pour la documentation Swagger
answer_submit_model = api.model('AnswerSubmit', {
    'question_id': fields.String(required=True, description='ID de la question'),
    'answer': fields.String(required=True, description='Réponse de l\'étudiant')
})

batch_submit_model = api.model('BatchSubmit', {
    'qcm_id': fields.String(required=True, description='ID du QCM'),
    'answers': fields.Raw(required=True, description='Dictionnaire {question_id: answer}')
})

correction_result_model = api.model('CorrectionResult', {
    'question_id': fields.String(description='ID de la question'),
    'is_correct': fields.Boolean(description='Réponse correcte ou non'),
    'score': fields.Float(description='Score obtenu (0-1)'),
    'feedback': fields.String(description='Feedback personnalisé'),
    'correct_answer': fields.String(description='Réponse correcte'),
    'max_points': fields.Integer(description='Points maximum'),
    'points_earned': fields.Float(description='Points obtenus')
})

batch_result_model = api.model('BatchCorrectionResult', {
    'status': fields.String(description='Statut de la correction'),
    'qcm_id': fields.String(description='ID du QCM'),
    'total_questions': fields.Integer(description='Nombre total de questions'),
    'questions_answered': fields.Integer(description='Nombre de questions répondues'),
    'results': fields.List(fields.Nested(correction_result_model)),
    'total_score': fields.Float(description='Score total obtenu'),
    'total_points': fields.Float(description='Points totaux possibles'),
    'score_percentage': fields.Float(description='Pourcentage de réussite'),
    'global_feedback': fields.String(description='Feedback global')
})

task_status_model = api.model('TaskStatus', {
    'task_id': fields.String(description='ID de la tâche'),
    'status': fields.String(description='Statut de la tâche'),
    'result': fields.Raw(description='Résultat de la tâche'),
    'error': fields.String(description='Message d\'erreur si échec')
})


@api.route('/submit')
class SubmitAnswer(Resource):
    @api.doc('submit_answer', security='Bearer')
    @api.expect(answer_submit_model)
    @api.marshal_with(task_status_model, code=202)
    @jwt_required()
    def post(self):
        """Soumet une réponse pour correction (asynchrone)"""
        try:
            if not CORRECTION_AVAILABLE:
                api.abort(503, "La correction automatique nécessite certaines dépendances. Installez-les avec: pip install transformers torch numpy")
            
            data = request.get_json()
            user_id = get_jwt_identity()

            question_id = data.get('question_id')
            answer = data.get('answer')

            if not question_id or answer is None:
                api.abort(400, "question_id et answer sont requis")

            # Lancer la tâche Celery de correction
            task = correct_student_answer.apply_async(
                args=[question_id, answer]
            )

            return {
                'task_id': task.id,
                'status': 'PENDING',
                'message': 'Correction en cours...'
            }, 202

        except Exception as e:
            logger.error(f"Erreur soumission réponse: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/batch')
class BatchSubmit(Resource):
    @api.doc('batch_submit', security='Bearer')
    @api.expect(batch_submit_model)
    @api.marshal_with(task_status_model, code=202)
    @jwt_required()
    def post(self):
        """Soumet toutes les réponses d'un QCM pour correction (asynchrone)"""
        try:
            if not CORRECTION_AVAILABLE:
                api.abort(503, "La correction automatique nécessite certaines dépendances. Installez-les avec: pip install transformers torch numpy")
            
            data = request.get_json()
            user_id = get_jwt_identity()

            qcm_id = data.get('qcm_id')
            answers = data.get('answers')

            if not qcm_id or not answers:
                api.abort(400, "qcm_id et answers sont requis")

            if not isinstance(answers, dict):
                api.abort(400, "answers doit être un dictionnaire {question_id: answer}")

            # Lancer la tâche Celery de correction batch
            task = batch_correct_answers.apply_async(
                args=[qcm_id, answers]
            )

            return {
                'task_id': task.id,
                'status': 'PENDING',
                'qcm_id': qcm_id,
                'message': 'Correction en cours...'
            }, 202

        except Exception as e:
            logger.error(f"Erreur soumission batch: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/tasks/<string:task_id>')
@api.param('task_id', 'ID de la tâche Celery')
class CorrectionTaskStatus(Resource):
    @api.doc('get_correction_task_status', security='Bearer')
    @api.marshal_with(task_status_model)
    @jwt_required()
    def get(self, task_id):
        """Récupère le statut d'une tâche de correction"""
        try:
            task = AsyncResult(task_id, app=celery)

            if task.state == 'PENDING':
                response = {
                    'task_id': task_id,
                    'status': 'PENDING',
                    'result': None
                }
            elif task.state == 'PROGRESS':
                response = {
                    'task_id': task_id,
                    'status': 'PROGRESS',
                    'result': task.info
                }
            elif task.state == 'SUCCESS':
                response = {
                    'task_id': task_id,
                    'status': 'SUCCESS',
                    'result': task.result
                }
            elif task.state == 'FAILURE':
                response = {
                    'task_id': task_id,
                    'status': 'FAILURE',
                    'error': str(task.info)
                }
            else:
                response = {
                    'task_id': task_id,
                    'status': task.state,
                    'result': str(task.info)
                }

            return response, 200

        except Exception as e:
            logger.error(f"Erreur récupération statut tâche: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
