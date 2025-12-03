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
from app.models.ai_config import AIModelConfig

# Importer les nouveaux modèles (refonte)
from app.models.etablissement import Etablissement
from app.models.mention import Mention
from app.models.parcours import Parcours
from app.models.enseignant import Enseignant
from app.models.etudiant import Etudiant
from app.models.admin_notification import AdminNotification

# Importer les tables d'association
from app.models.associations import (
    professeur_matieres,
    professeur_niveaux,
    etudiant_niveaux,
    etudiant_classes,
    etudiant_matieres,
    professeur_classes,
    qcm_niveaux,
    # Nouvelles tables d'association
    enseignant_matieres,
    enseignant_niveaux,
    enseignant_parcours,
    enseignant_mentions,
    etudiant_matieres_v2,
    etudiant_classes_v2
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
    'AIModelConfig',
    # Nouveaux modèles (refonte)
    'Etablissement',
    'Mention',
    'Parcours',
    'Enseignant',
    'Etudiant',
    'AdminNotification',
    # Tables d'association (anciennes)
    'professeur_matieres',
    'professeur_niveaux',
    'etudiant_niveaux',
    'etudiant_classes',
    'etudiant_matieres',
    'professeur_classes',
    'qcm_niveaux',
    # Tables d'association (nouvelles)
    'enseignant_matieres',
    'enseignant_niveaux',
    'enseignant_parcours',
    'enseignant_mentions',
    'etudiant_matieres_v2',
    'etudiant_classes_v2'
]



