"""
Tâches Celery pour le traitement asynchrone
"""
# Imports optionnels - les modules peuvent ne pas être disponibles si les dépendances IA ne sont pas installées
try:
    from .quiz_generation import generate_quiz_from_text, generate_quiz_from_document
except ImportError:
    generate_quiz_from_text = None
    generate_quiz_from_document = None

try:
    from .correction import correct_student_answer, batch_correct_answers
except ImportError:
    correct_student_answer = None
    batch_correct_answers = None

try:
    from .reports import generate_pdf_report
except ImportError:
    generate_pdf_report = None

__all__ = [
    'generate_quiz_from_text',
    'generate_quiz_from_document',
    'correct_student_answer',
    'batch_correct_answers',
    'generate_pdf_report'
]
