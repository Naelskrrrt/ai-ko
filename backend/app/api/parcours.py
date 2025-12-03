"""
Routes API pour la gestion des Parcours
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.parcours_service import ParcoursService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace('parcours', description='Opérations sur les parcours')

# Modèles pour la documentation Swagger
parcours_model = api.model('Parcours', {
    'id': fields.String(description='ID du parcours'),
    'code': fields.String(required=True, description='Code du parcours', example='IA'),
    'nom': fields.String(required=True, description='Nom complet', example='Intelligence Artificielle'),
    'description': fields.String(description='Description'),
    'mentionId': fields.String(required=True, description='ID de la mention'),
    'dureeAnnees': fields.Integer(description='Durée en années'),
    'actif': fields.Boolean(description='Parcours actif'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

parcours_create_model = api.model('ParcoursCreate', {
    'code': fields.String(required=True, description='Code du parcours', example='IA'),
    'nom': fields.String(required=True, description='Nom complet', example='Intelligence Artificielle'),
    'description': fields.String(description='Description'),
    'mentionId': fields.String(required=True, description='ID de la mention'),
    'dureeAnnees': fields.Integer(description='Durée en années'),
    'actif': fields.Boolean(description='Parcours actif', default=True)
})

# Service
parcours_service = ParcoursService()
user_repo = UserRepository()


def require_admin():
    """Vérifie que l'utilisateur est admin"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")


@api.route('')
class ParcoursList(Resource):
    @api.doc('list_parcours')
    @api.param('actifs_seulement', 'Ne retourner que les parcours actifs', type='boolean', default=False)
    @api.marshal_list_with(parcours_model)
    def get(self):
        """Liste tous les parcours"""
        try:
            actifs_seulement = request.args.get('actifs_seulement', 'false').lower() == 'true'
            parcours_list = parcours_service.get_all_parcours(actifs_seulement=actifs_seulement)
            return parcours_list, 200
        except Exception as e:
            logger.error(f"Erreur récupération parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_parcours', security='Bearer')
    @api.expect(parcours_create_model)
    @api.marshal_with(parcours_model, code=201)
    @jwt_required()
    def post(self):
        """Crée un nouveau parcours (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            # Convertir les clés camelCase en snake_case
            if 'mentionId' in data:
                data['mention_id'] = data.pop('mentionId')
            if 'dureeAnnees' in data:
                data['duree_annees'] = data.pop('dureeAnnees')
            parcours = parcours_service.create_parcours(data)
            return parcours, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:parcours_id>')
@api.param('parcours_id', 'ID du parcours')
class ParcoursDetail(Resource):
    @api.doc('get_parcours')
    @api.marshal_with(parcours_model)
    def get(self, parcours_id):
        """Récupère un parcours par son ID"""
        try:
            parcours = parcours_service.get_parcours_by_id(parcours_id)
            if not parcours:
                api.abort(404, f"Parcours {parcours_id} non trouvé")
            return parcours, 200
        except Exception as e:
            logger.error(f"Erreur récupération parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_parcours', security='Bearer')
    @api.expect(parcours_create_model)
    @api.marshal_with(parcours_model)
    @jwt_required()
    def put(self, parcours_id):
        """Met à jour un parcours (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            # Convertir les clés camelCase en snake_case
            if 'mentionId' in data:
                data['mention_id'] = data.pop('mentionId')
            if 'dureeAnnees' in data:
                data['duree_annees'] = data.pop('dureeAnnees')
            parcours = parcours_service.update_parcours(parcours_id, data)
            return parcours, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_parcours', security='Bearer')
    @jwt_required()
    def delete(self, parcours_id):
        """Supprime un parcours (admin only)"""
        try:
            require_admin()
            parcours_service.delete_parcours(parcours_id)
            return {'message': 'Parcours supprimé avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/mention/<string:mention_id>')
@api.param('mention_id', 'ID de la mention')
class ParcoursByMention(Resource):
    @api.doc('get_parcours_by_mention')
    @api.marshal_list_with(parcours_model)
    def get(self, mention_id):
        """Récupère les parcours d'une mention"""
        try:
            parcours_list = parcours_service.get_parcours_by_mention(mention_id)
            return parcours_list, 200
        except Exception as e:
            logger.error(f"Erreur récupération parcours par mention: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")




