"""
Blueprint pour les QCMs (QCM étudiant, QCM enseignant, résultats, sessions)
Regroupe les namespaces flask_restx pour ces entités
"""
from flask import Blueprint
from flask_restx import Api
import logging

logger = logging.getLogger(__name__)

# Créer le Blueprint
bp = Blueprint('qcm_api', __name__, url_prefix='/api')

# Créer l'API Flask-RESTX
api = Api(
    bp,
    version='1.0',
    title='QCM API',
    description='API pour les QCMs (étudiant, enseignant, résultats, sessions)',
    doc=False  # Désactiver la doc Swagger sur ce blueprint (utiliser /docs à la place)
)

# Importer et ajouter les namespaces
from app.api.qcm_etudiant import api as qcm_etudiant_ns
from app.api.qcm import api as qcm_ns
from app.api.resultat import api as resultat_ns
from app.api.session_examen import api as session_examen_ns

# Enregistrer les namespaces avec leurs préfixes
api.add_namespace(qcm_etudiant_ns, path='/qcm-etudiant')
api.add_namespace(qcm_ns, path='/qcm')
api.add_namespace(resultat_ns, path='/resultats')
api.add_namespace(session_examen_ns, path='/sessions-examen')

# Namespace correction est optionnel (dépendances lourdes: transformers, torch)
try:
    from app.api.correction import api as correction_ns
    api.add_namespace(correction_ns, path='/correction')
except ImportError as e:
    logger.warning(f"Namespace correction non disponible: {e}")
