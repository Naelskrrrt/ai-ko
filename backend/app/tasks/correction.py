"""
Tâches Celery pour la correction automatique
"""
from celery_app import celery
from app import db
from app.models.qcm import QCM
from app.models.question import Question
import os
import logging

# Imports optionnels pour les dépendances IA (peuvent ne pas être installées)
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None
try:
    from transformers import AutoTokenizer, AutoModel
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    AutoTokenizer = None
    AutoModel = None

try:
    import torch
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    F = None

logger = logging.getLogger(__name__)

# Cache pour les modèles IA
_models_cache = {}


def get_bert_model():
    """Récupère le modèle BERT pour la similarité sémantique"""
    if not TRANSFORMERS_AVAILABLE:
        raise ImportError(
            "Le module 'transformers' n'est pas installé. "
            "Installez-le avec: pip install transformers torch"
        )
    
    if not TORCH_AVAILABLE:
        raise ImportError(
            "Le module 'torch' n'est pas installé. "
            "Installez-le avec: pip install torch"
        )
    
    if 'bert' not in _models_cache:
        model_name = os.getenv('HF_BERT_MODEL', 'bert-base-uncased')
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModel.from_pretrained(model_name)
            _models_cache['bert'] = {'tokenizer': tokenizer, 'model': model}
            logger.info(f"Modèle BERT {model_name} chargé avec succès")
        except Exception as e:
            logger.error(f"Erreur chargement modèle BERT: {e}")
            raise
    return _models_cache['bert']


def mean_pooling(model_output, attention_mask):
    """Mean Pooling pour obtenir les embeddings de phrase"""
    if not TORCH_AVAILABLE:
        raise ImportError("Le module 'torch' n'est pas installé")
    
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(
        input_mask_expanded.sum(1), min=1e-9
    )


def calculate_semantic_similarity(text1, text2):
    """
    Calcule la similarité sémantique entre deux textes

    Args:
        text1: Premier texte
        text2: Deuxième texte

    Returns:
        float: Score de similarité entre 0 et 1
    """
    try:
        if not TRANSFORMERS_AVAILABLE or not TORCH_AVAILABLE:
            # Fallback: comparaison simple si les modules IA ne sont pas disponibles
            logger.warning("Modules IA non disponibles, utilisation du fallback simple")
            return 0.5 if text1.lower() == text2.lower() else 0.0
        
        bert_model = get_bert_model()
        tokenizer = bert_model['tokenizer']
        model = bert_model['model']

        # Tokeniser les textes
        encoded = tokenizer(
            [text1, text2],
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors='pt'
        )

        # Obtenir les embeddings
        with torch.no_grad():
            model_output = model(**encoded)

        # Mean pooling
        embeddings = mean_pooling(model_output, encoded['attention_mask'])

        # Normaliser les embeddings
        embeddings = F.normalize(embeddings, p=2, dim=1)

        # Calculer la similarité cosinus
        similarity = torch.mm(embeddings[0:1], embeddings[1:2].T).item()

        # Convertir en score 0-1
        score = (similarity + 1) / 2

        return score

    except ImportError as e:
        logger.warning(f"Modules IA non disponibles: {e}, utilisation du fallback")
        # Fallback: simple comparaison de longueur
        return 0.5 if text1.lower() == text2.lower() else 0.0
    except Exception as e:
        logger.error(f"Erreur calcul similarité: {e}")
        # Fallback: simple comparaison de longueur
        return 0.5 if text1.lower() == text2.lower() else 0.0


def extract_keywords(text):
    """Extrait les mots-clés importants d'un texte"""
    # Liste de mots vides (stop words)
    stop_words = {
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais',
        'pour', 'dans', 'sur', 'avec', 'sans', 'ce', 'ces', 'est', 'sont', 'a',
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'is', 'are', 'was', 'were', 'be', 'been'
    }

    # Nettoyer et tokeniser
    words = text.lower().replace(',', ' ').replace('.', ' ').split()

    # Filtrer les mots vides et courts
    keywords = [w for w in words if w not in stop_words and len(w) > 2]

    return set(keywords)


def calculate_keyword_score(student_answer, correct_answer):
    """
    Calcule un score basé sur les mots-clés présents

    Args:
        student_answer: Réponse de l'étudiant
        correct_answer: Réponse correcte

    Returns:
        float: Score entre 0 et 1
    """
    student_keywords = extract_keywords(student_answer)
    correct_keywords = extract_keywords(correct_answer)

    if not correct_keywords:
        return 0.0

    # Calculer l'intersection
    common_keywords = student_keywords.intersection(correct_keywords)

    # Score = nombre de mots-clés communs / nombre de mots-clés attendus
    score = len(common_keywords) / len(correct_keywords)

    return min(score, 1.0)


def correct_qcm_answer(question, student_answer):
    """
    Corrige une réponse QCM

    Args:
        question: Objet Question
        student_answer: Réponse de l'étudiant (ID de l'option)

    Returns:
        dict: Résultat de la correction
    """
    options = question.get_options()

    # Trouver l'option correcte
    correct_option = next((opt for opt in options if opt.get('estCorrecte')), None)

    if not correct_option:
        return {
            'is_correct': False,
            'score': 0.0,
            'feedback': "Erreur: aucune réponse correcte définie pour cette question",
            'correct_answer': None
        }

    # Vérifier si la réponse est correcte
    is_correct = student_answer == correct_option['id']

    return {
        'is_correct': is_correct,
        'score': 1.0 if is_correct else 0.0,
        'feedback': "Bonne réponse!" if is_correct else f"Réponse incorrecte. La bonne réponse était: {correct_option['texte']}",
        'correct_answer': correct_option['id']
    }


def correct_open_answer(question, student_answer):
    """
    Corrige une réponse ouverte

    Args:
        question: Objet Question
        student_answer: Réponse textuelle de l'étudiant

    Returns:
        dict: Résultat de la correction
    """
    correct_answer = question.reponse_correcte

    if not correct_answer:
        return {
            'is_correct': False,
            'score': 0.0,
            'feedback': "Erreur: aucune réponse correcte définie pour cette question",
            'correct_answer': None
        }

    # Calculer la similarité sémantique
    semantic_score = calculate_semantic_similarity(student_answer, correct_answer)

    # Calculer le score basé sur les mots-clés
    keyword_score = calculate_keyword_score(student_answer, correct_answer)

    # Score final pondéré (70% sémantique, 30% mots-clés)
    final_score = (semantic_score * 0.7) + (keyword_score * 0.3)

    # Déterminer si la réponse est acceptée (seuil à 0.6)
    is_correct = final_score >= 0.6

    # Générer un feedback personnalisé
    if final_score >= 0.9:
        feedback = "Excellente réponse! Vous avez bien compris le concept."
    elif final_score >= 0.75:
        feedback = "Bonne réponse. Quelques détails pourraient être améliorés."
    elif final_score >= 0.6:
        feedback = "Réponse acceptable, mais il manque certains éléments importants."
    else:
        feedback = f"Réponse insuffisante. Éléments attendus: {correct_answer[:100]}..."

    return {
        'is_correct': is_correct,
        'score': final_score,
        'feedback': feedback,
        'correct_answer': correct_answer,
        'semantic_score': semantic_score,
        'keyword_score': keyword_score
    }


@celery.task(name='app.tasks.correction.correct_student_answer', bind=True)
def correct_student_answer(self, question_id, student_answer):
    """
    Corrige la réponse d'un étudiant pour une question

    Args:
        question_id: ID de la question
        student_answer: Réponse de l'étudiant

    Returns:
        dict: Résultat de la correction
    """
    try:
        logger.info(f"Début correction question {question_id}")
        self.update_state(state='PROGRESS', meta={'status': 'Chargement de la question...'})

        from app import create_app
        app = create_app()

        with app.app_context():
            question = Question.query.get(question_id)
            if not question:
                raise ValueError(f"Question {question_id} non trouvée")

            self.update_state(state='PROGRESS', meta={'status': 'Analyse de la réponse...'})

            # Corriger selon le type de question
            if question.type_question == 'qcm':
                result = correct_qcm_answer(question, student_answer)
            elif question.type_question in ['texte_libre', 'vrai_faux']:
                result = correct_open_answer(question, student_answer)
            else:
                raise ValueError(f"Type de question non supporté: {question.type_question}")

            # Ajouter des métadonnées
            result['question_id'] = question_id
            result['question_type'] = question.type_question
            result['max_points'] = question.points
            result['points_earned'] = result['score'] * question.points

            logger.info(f"Correction terminée: score={result['score']}")
            return result

    except Exception as e:
        logger.error(f"Erreur correction: {e}", exc_info=True)
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise


@celery.task(name='app.tasks.correction.batch_correct_answers', bind=True)
def batch_correct_answers(self, qcm_id, student_answers):
    """
    Corrige toutes les réponses d'un étudiant pour un QCM

    Args:
        qcm_id: ID du QCM
        student_answers: Dict {question_id: answer}

    Returns:
        dict: Résultat de la correction complète
    """
    try:
        logger.info(f"Début correction batch pour QCM {qcm_id}")
        self.update_state(state='PROGRESS', meta={'status': 'Chargement du QCM...'})

        from app import create_app
        app = create_app()

        with app.app_context():
            qcm = QCM.query.get(qcm_id)
            if not qcm:
                raise ValueError(f"QCM {qcm_id} non trouvé")

            questions = Question.query.filter_by(qcm_id=qcm_id).all()
            total_questions = len(questions)

            if total_questions == 0:
                raise ValueError("Ce QCM ne contient aucune question")

            results = []
            total_score = 0.0
            total_points = 0

            for i, question in enumerate(questions):
                self.update_state(
                    state='PROGRESS',
                    meta={
                        'status': f'Correction question {i+1}/{total_questions}...',
                        'progress': int(((i + 1) / total_questions) * 100)
                    }
                )

                question_id = question.id
                student_answer = student_answers.get(question_id)

                if student_answer is None:
                    # Question non répondue
                    result = {
                        'question_id': question_id,
                        'is_correct': False,
                        'score': 0.0,
                        'feedback': 'Question non répondue',
                        'max_points': question.points,
                        'points_earned': 0.0
                    }
                else:
                    # Corriger la question
                    if question.type_question == 'qcm':
                        result = correct_qcm_answer(question, student_answer)
                    else:
                        result = correct_open_answer(question, student_answer)

                    result['question_id'] = question_id
                    result['max_points'] = question.points
                    result['points_earned'] = result['score'] * question.points

                results.append(result)
                total_score += result['points_earned']
                total_points += question.points

            # Calculer le score final en pourcentage
            final_score_percentage = (total_score / total_points * 100) if total_points > 0 else 0

            # Générer un feedback global
            if final_score_percentage >= 90:
                global_feedback = "Excellent travail! Vous maîtrisez parfaitement le sujet."
            elif final_score_percentage >= 75:
                global_feedback = "Bon travail! Quelques points à revoir."
            elif final_score_percentage >= 50:
                global_feedback = "Résultat moyen. Il est recommandé de revoir certains concepts."
            else:
                global_feedback = "Résultat insuffisant. Une révision approfondie est nécessaire."

            logger.info(f"Correction batch terminée: {final_score_percentage:.2f}%")

            return {
                'status': 'success',
                'qcm_id': qcm_id,
                'total_questions': total_questions,
                'questions_answered': len([a for a in student_answers.values() if a is not None]),
                'results': results,
                'total_score': total_score,
                'total_points': total_points,
                'score_percentage': final_score_percentage,
                'global_feedback': global_feedback
            }

    except Exception as e:
        logger.error(f"Erreur correction batch: {e}", exc_info=True)
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise
