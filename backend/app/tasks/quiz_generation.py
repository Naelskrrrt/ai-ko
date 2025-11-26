"""
Tâches Celery pour la génération asynchrone de QCM avec l'IA
Utilise l'API Hugging Face Inference avec Qwen2.5-7B-Instruct
"""
import logging
from celery import Task
from celery_app import celery
from app import db
from app.models.qcm import QCM
from app.models.question import Question
from app.services.ai_service import ai_service
from app.services.document_parser import DocumentParser

logger = logging.getLogger(__name__)


class CallbackTask(Task):
    """Tâche de base avec callback pour mise à jour de l'état"""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Appelé en cas d'échec de la tâche"""
        logger.error(f"Tâche {task_id} échouée: {exc}")
        super().on_failure(exc, task_id, args, kwargs, einfo)


@celery.task(bind=True, base=CallbackTask, name='app.tasks.quiz_generation.generate_quiz_from_text')
def generate_quiz_from_text(self, qcm_id: str, text: str, num_questions: int = 10,
                            matiere: str = None, niveau: str = None):
    """
    Génère un QCM à partir de texte brut

    Args:
        qcm_id: ID du QCM à remplir
        text: Texte source
        num_questions: Nombre de questions à générer
        matiere: Matière (optionnel)
        niveau: Niveau académique (optionnel)

    Returns:
        Dictionnaire avec les informations du QCM généré
    """
    try:
        logger.info(f"Début génération QCM {qcm_id} depuis texte ({len(text)} caractères)")

        # Mise à jour de l'état: en cours
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Analyse du texte en cours...',
                'progress': 10
            }
        )

        # Nettoyer le texte
        clean_text = DocumentParser.clean_text(text, max_length=8000)

        # Mise à jour de l'état: génération IA
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Génération des questions avec l\'IA (Qwen2.5-7B)...',
                'progress': 30
            }
        )

        # Générer les questions avec l'IA
        questions_data = ai_service.generate_questions(
            text=clean_text,
            num_questions=num_questions,
            matiere=matiere,
            niveau=niveau
        )

        logger.info(f"{len(questions_data)} questions générées par l'IA")

        # Mise à jour de l'état: création en base
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Enregistrement du QCM dans la base de données...',
                'progress': 70
            }
        )

        # Créer le contexte d'application pour accéder à la DB
        from app import create_app
        app = create_app()

        with app.app_context():
            # Récupérer le QCM depuis la base
            qcm = QCM.query.get(qcm_id)
            if not qcm:
                raise ValueError(f"QCM {qcm_id} non trouvé")

            # Supprimer les anciennes questions si existantes
            Question.query.filter_by(qcm_id=qcm_id).delete()

            # Créer les questions dans la base de données
            for q_data in questions_data:
                question = Question(
                    qcm_id=qcm_id,
                    enonce=q_data['enonce'],
                    type_question=q_data.get('type_question', 'qcm'),
                    points=q_data.get('points', 1),
                    explication=q_data.get('explication', '')
                )

                # Définir les options (stockées en JSON)
                question.set_options(q_data['options'])

                db.session.add(question)

            # Mettre à jour le statut du QCM
            qcm.status = 'draft'

            db.session.commit()

        logger.info(f"QCM {qcm_id} généré avec succès: {len(questions_data)} questions")

        # Retourner le résultat
        return {
            'qcm_id': qcm_id,
            'titre': qcm.titre if qcm else 'QCM',
            'num_questions': len(questions_data),
            'status': 'success',
            'message': f'QCM généré avec succès: {len(questions_data)} questions créées'
        }

    except Exception as e:
        logger.error(f"Erreur lors de la génération du QCM {qcm_id}: {e}", exc_info=True)

        # Mettre le QCM en état d'erreur (brouillon)
        try:
            from app import create_app
            app = create_app()
            with app.app_context():
                qcm = QCM.query.get(qcm_id)
                if qcm:
                    qcm.status = 'draft'
                    db.session.commit()
        except:
            pass

        # Re-lever l'exception pour que Celery la capture
        raise


@celery.task(bind=True, base=CallbackTask, name='app.tasks.quiz_generation.generate_quiz_from_document')
def generate_quiz_from_document(self, qcm_id: str, file_bytes: bytes, file_type: str,
                                num_questions: int = 10, matiere: str = None, niveau: str = None):
    """
    Génère un QCM à partir d'un document (PDF ou DOCX)

    Args:
        qcm_id: ID du QCM à remplir
        file_bytes: Contenu du fichier en bytes
        file_type: Type de fichier ('pdf' ou 'docx')
        num_questions: Nombre de questions à générer
        matiere: Matière (optionnel)
        niveau: Niveau académique (optionnel)

    Returns:
        Dictionnaire avec les informations du QCM généré
    """
    try:
        logger.info(f"Début génération QCM {qcm_id} depuis document {file_type}")

        # Mise à jour de l'état: extraction
        self.update_state(
            state='PROGRESS',
            meta={
                'status': f'Extraction du texte depuis le document {file_type.upper()}...',
                'progress': 10
            }
        )

        # Extraire le texte du document
        text = DocumentParser.extract_text(file_bytes, file_type)

        logger.info(f"Texte extrait: {len(text)} caractères")

        # Mise à jour de l'état: nettoyage
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Préparation du texte...',
                'progress': 20
            }
        )

        # Nettoyer le texte
        clean_text = DocumentParser.clean_text(text, max_length=8000)

        # Mise à jour de l'état: génération IA
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Génération des questions avec l\'IA (Qwen2.5-7B)...',
                'progress': 40
            }
        )

        # Générer les questions avec l'IA
        questions_data = ai_service.generate_questions(
            text=clean_text,
            num_questions=num_questions,
            matiere=matiere,
            niveau=niveau
        )

        logger.info(f"{len(questions_data)} questions générées par l'IA")

        # Mise à jour de l'état: création en base
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Enregistrement du QCM dans la base de données...',
                'progress': 80
            }
        )

        # Créer le contexte d'application pour accéder à la DB
        from app import create_app
        app = create_app()

        with app.app_context():
            # Récupérer le QCM depuis la base
            qcm = QCM.query.get(qcm_id)
            if not qcm:
                raise ValueError(f"QCM {qcm_id} non trouvé")

            # Supprimer les anciennes questions si existantes
            Question.query.filter_by(qcm_id=qcm_id).delete()

            # Créer les questions dans la base de données
            for q_data in questions_data:
                question = Question(
                    qcm_id=qcm_id,
                    enonce=q_data['enonce'],
                    type_question=q_data.get('type_question', 'qcm'),
                    points=q_data.get('points', 1),
                    explication=q_data.get('explication', '')
                )

                # Définir les options (stockées en JSON)
                question.set_options(q_data['options'])

                db.session.add(question)

            # Mettre à jour le statut du QCM
            qcm.status = 'draft'

            db.session.commit()

        logger.info(f"QCM {qcm_id} généré avec succès: {len(questions_data)} questions")

        # Retourner le résultat
        return {
            'qcm_id': qcm_id,
            'titre': qcm.titre if qcm else 'QCM',
            'num_questions': len(questions_data),
            'status': 'success',
            'message': f'QCM généré avec succès depuis {file_type.upper()}: {len(questions_data)} questions créées'
        }

    except Exception as e:
        logger.error(f"Erreur lors de la génération du QCM {qcm_id} depuis document: {e}", exc_info=True)

        # Mettre le QCM en état d'erreur (brouillon)
        try:
            from app import create_app
            app = create_app()
            with app.app_context():
                qcm = QCM.query.get(qcm_id)
                if qcm:
                    qcm.status = 'draft'
                    db.session.commit()
        except:
            pass

        # Re-lever l'exception pour que Celery la capture
        raise
