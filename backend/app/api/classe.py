"""
Routes API pour la gestion des Classes
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.classe_service import ClasseService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace('classes', description='Opérations sur les classes')

# Modèles pour la documentation Swagger
niveau_ref = api.model('NiveauRef', {
    'id': fields.String(description='ID du niveau'),
    'code': fields.String(description='Code du niveau'),
    'nom': fields.String(description='Nom du niveau')
})

classe_model = api.model('Classe', {
    'id': fields.String(description='ID de la classe'),
    'code': fields.String(required=True, description='Code de la classe', example='L1-INFO-A'),
    'nom': fields.String(required=True, description='Nom de la classe', example='Licence 1 Informatique Groupe A'),
    'description': fields.String(description='Description'),
    'niveauId': fields.String(required=True, description='ID du niveau'),
    'niveau': fields.Nested(niveau_ref, description='Informations du niveau'),
    'anneeScolaire': fields.String(required=True, description='Année scolaire', example='2024-2025'),
    'semestre': fields.Integer(description='Semestre (1 ou 2)'),
    'effectifMax': fields.Integer(description='Effectif maximum'),
    'nombreEtudiants': fields.Integer(description='Nombre d\'étudiants'),
    'actif': fields.Boolean(description='Classe active'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

classe_create_model = api.model('ClasseCreate', {
    'code': fields.String(required=True, description='Code de la classe', example='L1-INFO-A'),
    'nom': fields.String(required=True, description='Nom de la classe', example='Licence 1 Informatique Groupe A'),
    'description': fields.String(description='Description'),
    'niveauId': fields.String(required=True, description='ID du niveau'),
    'anneeScolaire': fields.String(required=True, description='Année scolaire', example='2024-2025'),
    'semestre': fields.Integer(description='Semestre (1 ou 2)'),
    'effectifMax': fields.Integer(description='Effectif maximum'),
    'actif': fields.Boolean(description='Classe active', default=True)
})

# Service
classe_service = ClasseService()
user_repo = UserRepository()


def require_admin_or_teacher():
    """Vérifie que l'utilisateur est admin ou enseignant"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role not in [UserRole.ADMIN, UserRole.ENSEIGNANT]:
        api.abort(403, "Accès réservé aux administrateurs et enseignants")


@api.route('')
class ClasseList(Resource):
    @api.doc('list_classes', security='Bearer')
    @api.param('skip', 'Nombre d\'éléments à sauter', type='integer', default=0)
    @api.param('limit', 'Nombre d\'éléments à retourner', type='integer', default=100)
    @api.param('niveau_id', 'Filtrer par niveau', type='string')
    @api.param('annee_scolaire', 'Filtrer par année scolaire', type='string')
    @api.marshal_with(classe_model, as_list=True)
    @jwt_required()
    def get(self):
        """Liste toutes les classes avec pagination"""
        try:
            skip = request.args.get('skip', 0, type=int)
            limit = request.args.get('limit', 100, type=int)
            niveau_id = request.args.get('niveau_id')
            annee_scolaire = request.args.get('annee_scolaire')

            filters = {}
            if niveau_id:
                filters['niveau_id'] = niveau_id
            if annee_scolaire:
                filters['annee_scolaire'] = annee_scolaire

            classes, total = classe_service.get_all_classes(skip=skip, limit=limit, filters=filters)

            return {
                'data': classes,
                'total': total,
                'skip': skip,
                'limit': limit
            }, 200

        except Exception as e:
            logger.error(f"Erreur récupération classes: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_classe', security='Bearer')
    @api.expect(classe_create_model)
    @api.marshal_with(classe_model, code=201)
    @jwt_required()
    def post(self):
        """Crée une nouvelle classe (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            data = request.get_json()
            classe = classe_service.create_classe(data)
            return classe, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création classe: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:classe_id>')
@api.param('classe_id', 'ID de la classe')
class ClasseDetail(Resource):
    @api.doc('get_classe', security='Bearer')
    @api.marshal_with(classe_model)
    @jwt_required()
    def get(self, classe_id):
        """Récupère une classe par son ID"""
        try:
            classe = classe_service.get_classe_by_id(classe_id)
            if not classe:
                api.abort(404, f"Classe {classe_id} non trouvée")
            return classe, 200
        except Exception as e:
            logger.error(f"Erreur récupération classe: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_classe', security='Bearer')
    @api.expect(classe_create_model)
    @api.marshal_with(classe_model)
    @jwt_required()
    def put(self, classe_id):
        """Met à jour une classe (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            data = request.get_json()
            classe = classe_service.update_classe(classe_id, data)
            return classe, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour classe: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_classe', security='Bearer')
    @jwt_required()
    def delete(self, classe_id):
        """Supprime une classe (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            classe_service.delete_classe(classe_id)
            return {'message': 'Classe supprimée avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression classe: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/niveau/<string:niveau_id>')
@api.param('niveau_id', 'ID du niveau')
class ClasseByNiveau(Resource):
    @api.doc('get_classes_by_niveau', security='Bearer')
    @api.marshal_list_with(classe_model)
    @jwt_required()
    def get(self, niveau_id):
        """Récupère les classes d'un niveau"""
        try:
            classes = classe_service.get_classes_by_niveau(niveau_id)
            return classes, 200
        except Exception as e:
            logger.error(f"Erreur récupération classes par niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
