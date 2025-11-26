"""
Service de génération de QCM asynchrone (sans Celery)
"""
import logging
from app import db, create_app
from app.models.qcm import QCM
from app.models.question import Question
from app.services.ai_service import ai_service
from app.services.document_parser import DocumentParser
from app.services.async_task_manager import task_manager

logger = logging.getLogger(__name__)


def estimate_generation_time(num_questions: int, is_document: bool = False) -> int:
    """
    Estime le temps de génération en secondes
    
    Args:
        num_questions: Nombre de questions à générer
        is_document: True si génération depuis document (extraction supplémentaire)
    
    Returns:
        Temps estimé en secondes
    """
    # Temps de base
    base_time = 5 if is_document else 3  # Extraction document = +2s
    
    # Temps par question (environ 3-5 secondes par question)
    time_per_question = 4
    
    # Temps d'enregistrement en base
    db_time = 2
    
    total = base_time + (num_questions * time_per_question) + db_time
    
    # Ajouter une marge de sécurité de 20%
    return int(total * 1.2)


def generate_quiz_from_text_async(task_id: str, qcm_id: str, text: str, 
                                  num_questions: int = 10, matiere: str = None, 
                                  niveau: str = None):
    """
    Génère un QCM à partir de texte brut (version asynchrone)
    
    Args:
        task_id: ID de la tâche pour le suivi
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
        
        # Mise à jour: analyse
        task_manager.update_task_progress(
            task_id, 10, 'Analyse du texte en cours...'
        )
        
        # Nettoyer le texte
        clean_text = DocumentParser.clean_text(text, max_length=8000)
        
        # Mise à jour: génération IA
        task_manager.update_task_progress(
            task_id, 30, 'Génération des questions avec l\'IA...'
        )
        
        # Générer les questions avec l'IA
        try:
            questions_data = ai_service.generate_questions(
                text=clean_text,
                num_questions=num_questions,
                matiere=matiere,
                niveau=niveau
            )
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Erreur génération questions: {error_msg}")
            # Mettre à jour le message d'erreur pour l'utilisateur
            task_manager.update_task_progress(
                task_id, 50, f'Erreur lors de la génération: {error_msg}'
            )
            raise
        
        logger.info(f"{len(questions_data)} questions générées par l'IA")
        
        # Mise à jour: enregistrement
        task_manager.update_task_progress(
            task_id, 70, 'Enregistrement du QCM dans la base de données...'
        )
        
        # Créer le contexte d'application pour accéder à la DB
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
            
            # Récupérer les valeurs nécessaires AVANT de fermer le contexte
            qcm_titre = qcm.titre if qcm else 'QCM'
            
            db.session.commit()
        
        logger.info(f"QCM {qcm_id} généré avec succès: {len(questions_data)} questions")
        
        # Retourner le résultat (utiliser les valeurs récupérées avant la fermeture du contexte)
        return {
            'qcm_id': qcm_id,
            'titre': qcm_titre,
            'num_questions': len(questions_data),
            'status': 'success',
            'message': f'QCM généré avec succès: {len(questions_data)} questions créées'
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du QCM {qcm_id}: {e}", exc_info=True)
        
        # Mettre le QCM en état d'erreur (brouillon)
        try:
            app = create_app()
            with app.app_context():
                qcm = QCM.query.get(qcm_id)
                if qcm:
                    qcm.status = 'draft'
                    db.session.commit()
        except:
            pass
        
        raise


def generate_quiz_from_document_async(task_id: str, qcm_id: str, file_bytes: bytes, 
                                      file_type: str, num_questions: int = 10, 
                                      matiere: str = None, niveau: str = None):
    """
    Génère un QCM à partir d'un document (PDF ou DOCX) - version asynchrone
    
    Args:
        task_id: ID de la tâche pour le suivi
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
        
        # Mise à jour: extraction
        task_manager.update_task_progress(
            task_id, 10, f'Extraction du texte depuis le document {file_type.upper()}...'
        )
        
        # Extraire le texte du document
        text = DocumentParser.extract_text(file_bytes, file_type)
        
        logger.info(f"Texte extrait: {len(text)} caractères")
        
        # Mise à jour: nettoyage
        task_manager.update_task_progress(
            task_id, 20, 'Préparation du texte...'
        )
        
        # Nettoyer le texte
        clean_text = DocumentParser.clean_text(text, max_length=8000)
        
        # Mise à jour: génération IA
        task_manager.update_task_progress(
            task_id, 40, 'Génération des questions avec l\'IA...'
        )
        
        # Générer les questions avec l'IA
        try:
            questions_data = ai_service.generate_questions(
                text=clean_text,
                num_questions=num_questions,
                matiere=matiere,
                niveau=niveau
            )
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Erreur génération questions depuis document: {error_msg}")
            # Mettre à jour le message d'erreur pour l'utilisateur
            task_manager.update_task_progress(
                task_id, 50, f'Erreur lors de la génération: {error_msg}'
            )
            raise
        
        logger.info(f"{len(questions_data)} questions générées par l'IA")
        
        # Mise à jour: enregistrement
        task_manager.update_task_progress(
            task_id, 80, 'Enregistrement du QCM dans la base de données...'
        )
        
        # Créer le contexte d'application pour accéder à la DB
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
            
            # Récupérer les valeurs nécessaires AVANT de fermer le contexte
            qcm_titre = qcm.titre if qcm else 'QCM'
            
            db.session.commit()
        
        logger.info(f"QCM {qcm_id} généré avec succès: {len(questions_data)} questions")
        
        # Retourner le résultat (utiliser les valeurs récupérées avant la fermeture du contexte)
        return {
            'qcm_id': qcm_id,
            'titre': qcm_titre,
            'num_questions': len(questions_data),
            'status': 'success',
            'message': f'QCM généré avec succès depuis {file_type.upper()}: {len(questions_data)} questions créées'
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du QCM {qcm_id} depuis document: {e}", exc_info=True)
        
        # Mettre le QCM en état d'erreur (brouillon)
        try:
            app = create_app()
            with app.app_context():
                qcm = QCM.query.get(qcm_id)
                if qcm:
                    qcm.status = 'draft'
                    db.session.commit()
        except:
            pass
        
        raise

