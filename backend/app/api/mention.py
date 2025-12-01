"""
Routes API pour la gestion des Mentions
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.mention_service import MentionService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace('mentions', description='Opérations sur les mentions')

# Modèles pour la documentation Swagger
mention_model = api.model('Mention', {
    'id': fields.String(description='ID de la mention'),
    'code': fields.String(required=True, description='Code de la mention', example='INFO'),
    'nom': fields.String(required=True, description='Nom complet', example='Informatique'),
    'description': fields.String(description='Description'),
    'etablissementId': fields.String(required=True, description='ID de l\'établissement'),
    'couleur': fields.String(description='Couleur (hex)'),
    'icone': fields.String(description='Icône'),
    'actif': fields.Boolean(description='Mention active'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

mention_create_model = api.model('MentionCreate', {
    'code': fields.String(required=True, description='Code de la mention', example='INFO'),
    'nom': fields.String(required=True, description='Nom complet', example='Informatique'),
    'description': fields.String(description='Description'),
    'etablissementId': fields.String(required=True, description='ID de l\'établissement'),
    'couleur': fields.String(description='Couleur (hex)'),
    'icone': fields.String(description='Icône'),
    'actif': fields.Boolean(description='Mention active', default=True)
})

# Service
mention_service = MentionService()
user_repo = UserRepository()


def require_admin():
    """Vérifie que l'utilisateur est admin"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")


@api.route('')
class MentionList(Resource):
    @api.doc('list_mentions')
    @api.param('actives_seulement', 'Ne retourner que les mentions actives', type='boolean', default=False)
    @api.marshal_list_with(mention_model)
    def get(self):
        """Liste toutes les mentions"""
        try:
            actives_seulement = request.args.get('actives_seulement', 'false').lower() == 'true'
            mentions = mention_service.get_all_mentions(actives_seulement=actives_seulement)
            return mentions, 200
        except Exception as e:
            logger.error(f"Erreur récupération mentions: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_mention', security='Bearer')
    @api.expect(mention_create_model)
    @api.marshal_with(mention_model, code=201)
    @jwt_required()
    def post(self):
        """Crée une nouvelle mention (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            # Convertir les clés camelCase en snake_case
            if 'etablissementId' in data:
                data['etablissement_id'] = data.pop('etablissementId')
            mention = mention_service.create_mention(data)
            return mention, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création mention: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:mention_id>')
@api.param('mention_id', 'ID de la mention')
class MentionDetail(Resource):
    @api.doc('get_mention')
    @api.marshal_with(mention_model)
    def get(self, mention_id):
        """Récupère une mention par son ID"""
        try:
            mention = mention_service.get_mention_by_id(mention_id)
            if not mention:
                api.abort(404, f"Mention {mention_id} non trouvée")
            return mention, 200
        except Exception as e:
            logger.error(f"Erreur récupération mention: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_mention', security='Bearer')
    @api.expect(mention_create_model)
    @api.marshal_with(mention_model)
    @jwt_required()
    def put(self, mention_id):
        """Met à jour une mention (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            # Convertir les clés camelCase en snake_case
            if 'etablissementId' in data:
                data['etablissement_id'] = data.pop('etablissementId')
            mention = mention_service.update_mention(mention_id, data)
            return mention, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour mention: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_mention', security='Bearer')
    @jwt_required()
    def delete(self, mention_id):
        """Supprime une mention (admin only)"""
        try:
            require_admin()
            mention_service.delete_mention(mention_id)
            return {'message': 'Mention supprimée avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression mention: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/etablissement/<string:etablissement_id>')
@api.param('etablissement_id', 'ID de l\'établissement')
class MentionByEtablissement(Resource):
    @api.doc('get_mentions_by_etablissement')
    @api.marshal_list_with(mention_model)
    def get(self, etablissement_id):
        """Récupère les mentions d'un établissement"""
        try:
            mentions = mention_service.get_mentions_by_etablissement(etablissement_id)
            return mentions, 200
        except Exception as e:
            logger.error(f"Erreur récupération mentions par établissement: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

