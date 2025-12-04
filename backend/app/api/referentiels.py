"""
Blueprint pour les référentiels (niveaux, matières, mentions, parcours)
Regroupe les namespaces flask_restx pour ces entités
"""
from flask import Blueprint
from flask_restx import Api

# Créer le Blueprint
bp = Blueprint('referentiels', __name__, url_prefix='/api')

# Créer l'API Flask-RESTX
api = Api(
    bp,
    version='1.0',
    title='Référentiels API',
    description='API pour les référentiels (niveaux, matières, mentions, parcours)',
    doc=False  # Désactiver la doc Swagger sur ce blueprint (utiliser /docs à la place)
)

# Importer et ajouter les namespaces
from app.api.niveau import api as niveau_ns
from app.api.matiere import api as matiere_ns
from app.api.mention import api as mention_ns
from app.api.parcours import api as parcours_ns

api.add_namespace(niveau_ns, path='/niveaux')
api.add_namespace(matiere_ns, path='/matieres')
api.add_namespace(mention_ns, path='/mentions')
api.add_namespace(parcours_ns, path='/parcours')
