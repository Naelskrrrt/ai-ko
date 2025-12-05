"""
Blueprint pour les entités utilisateurs (enseignants, étudiants, classes)
Regroupe les namespaces flask_restx pour ces entités
"""
from flask import Blueprint
from flask_restx import Api
import logging

logger = logging.getLogger(__name__)

# Créer le Blueprint
bp = Blueprint('users_api', __name__, url_prefix='/api')

# Créer l'API Flask-RESTX
api = Api(
    bp,
    version='1.0',
    title='Users API',
    description='API pour les utilisateurs (enseignants, étudiants, classes)',
    doc=False  # Désactiver la doc Swagger sur ce blueprint (utiliser /docs à la place)
)

# Importer et ajouter les namespaces
from app.api.enseignant import api as enseignant_ns
from app.api.etudiant import api as etudiant_ns
from app.api.classe import api as classe_ns

# Enregistrer les namespaces avec leurs préfixes
api.add_namespace(enseignant_ns, path='/enseignants')
api.add_namespace(etudiant_ns, path='/etudiants')
api.add_namespace(classe_ns, path='/classes')
