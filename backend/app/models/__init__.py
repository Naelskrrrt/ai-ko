# Importer les modèles de base
from app.models.user import User, UserRole
from app.models.qcm import QCM
from app.models.question import Question

# Importer les nouveaux modèles du système éducatif
from app.models.niveau import Niveau
from app.models.matiere import Matiere
from app.models.classe import Classe
from app.models.session_examen import SessionExamen
from app.models.resultat import Resultat

# Importer les tables d'association
from app.models.associations import (
    professeur_matieres,
    professeur_niveaux,
    etudiant_niveaux,
    etudiant_classes,
    professeur_classes,
    qcm_niveaux
)

__all__ = [
    # Modèles de base
    'User',
    'UserRole',
    'QCM',
    'Question',
    # Modèles éducatifs
    'Niveau',
    'Matiere',
    'Classe',
    'SessionExamen',
    'Resultat',
    # Tables d'association
    'professeur_matieres',
    'professeur_niveaux',
    'etudiant_niveaux',
    'etudiant_classes',
    'professeur_classes',
    'qcm_niveaux'
]



