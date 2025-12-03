"""
Routes API pour la gestion des Matières
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.matiere_service import MatiereService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace('matieres', description='Opérations sur les matières')

# Modèles pour la documentation Swagger
matiere_model = api.model('Matiere', {
    'id': fields.String(description='ID de la matière'),
    'code': fields.String(required=True, description='Code de la matière', example='INFO101'),
    'nom': fields.String(required=True, description='Nom de la matière', example='Programmation Python'),
    'description': fields.String(description='Description'),
    'coefficient': fields.Float(description='Coefficient', default=1.0),
    'couleur': fields.String(description='Couleur hex', example='#3B82F6'),
    'icone': fields.String(description='Nom de l\'icône', example='code'),
    'actif': fields.Boolean(description='Matière active'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

matiere_create_model = api.model('MatiereCreate', {
    'code': fields.String(required=True, description='Code de la matière', example='INFO101'),
    'nom': fields.String(required=True, description='Nom de la matière', example='Programmation Python'),
    'description': fields.String(description='Description'),
    'coefficient': fields.Float(description='Coefficient', default=1.0),
    'couleur': fields.String(description='Couleur hex', example='#3B82F6'),
    'icone': fields.String(description='Nom de l\'icône', example='code'),
    'actif': fields.Boolean(description='Matière active', default=True)
})

# Service
matiere_service = MatiereService()
user_repo = UserRepository()


def require_admin():
    """Vérifie que l'utilisateur est admin"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")


def require_admin_or_enseignant():
    """Vérifie que l'utilisateur est admin ou enseignant"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or (user.role != UserRole.ADMIN and user.role != UserRole.ENSEIGNANT):
        api.abort(403, "Accès réservé aux administrateurs et enseignants")


def check_user_role_if_authenticated():
    """Vérifie le rôle de l'utilisateur s'il est authentifié, sinon permet l'accès"""
    try:
        user_id = get_jwt_identity()
        if user_id:
            user = user_repo.get_by_id(user_id)
            if user and (user.role == UserRole.ADMIN or user.role == UserRole.ENSEIGNANT):
                return True
        # Permettre l'accès même sans authentification
        return True
    except:
        # En cas d'erreur, permettre l'accès
        return True


@api.route('')
class MatiereList(Resource):
    @api.doc('list_matieres')
    @api.param('actives_seulement', 'Ne retourner que les matières actives', type='boolean', default=False)
    @api.marshal_list_with(matiere_model)
    def get(self):
        """Liste toutes les matières"""
        try:
            actives_seulement = request.args.get('actives_seulement', 'false').lower() == 'true'
            matieres = matiere_service.get_all_matieres(actives_seulement=actives_seulement)
            return matieres, 200
        except Exception as e:
            logger.error(f"Erreur récupération matières: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_matiere')
    @api.expect(matiere_create_model)
    @api.marshal_with(matiere_model, code=201)
    @jwt_required(optional=True)
    def post(self):
        """Crée une nouvelle matière (public pendant onboarding, authentification optionnelle)"""
        try:
            # Vérifier le rôle si l'utilisateur est authentifié
            check_user_role_if_authenticated()
            data = request.get_json()
            matiere = matiere_service.create_matiere(data)
            return matiere, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:matiere_id>')
@api.param('matiere_id', 'ID de la matière')
class MatiereDetail(Resource):
    @api.doc('get_matiere')
    @api.marshal_with(matiere_model)
    def get(self, matiere_id):
        """Récupère une matière par son ID"""
        try:
            matiere = matiere_service.get_matiere_by_id(matiere_id)
            if not matiere:
                api.abort(404, f"Matière {matiere_id} non trouvée")
            return matiere, 200
        except Exception as e:
            logger.error(f"Erreur récupération matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_matiere', security='Bearer')
    @api.expect(matiere_create_model)
    @api.marshal_with(matiere_model)
    @jwt_required()
    def put(self, matiere_id):
        """Met à jour une matière (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            matiere = matiere_service.update_matiere(matiere_id, data)
            return matiere, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_matiere', security='Bearer')
    @jwt_required()
    def delete(self, matiere_id):
        """Supprime une matière (admin only)"""
        try:
            require_admin()
            matiere_service.delete_matiere(matiere_id)
            return {'message': 'Matière supprimée avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
