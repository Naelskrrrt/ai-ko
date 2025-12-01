"""
Routes API pour la gestion des Établissements
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.etablissement_service import EtablissementService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace('etablissements', description='Opérations sur les établissements')

# Modèles pour la documentation Swagger
etablissement_model = api.model('Etablissement', {
    'id': fields.String(description='ID de l\'établissement'),
    'code': fields.String(required=True, description='Code de l\'établissement', example='UDM'),
    'nom': fields.String(required=True, description='Nom complet', example='Université de Madagascar'),
    'nomCourt': fields.String(description='Nom court', example='UDM'),
    'description': fields.String(description='Description'),
    'typeEtablissement': fields.String(required=True, description='Type', enum=['université', 'école', 'institut']),
    'adresse': fields.String(description='Adresse'),
    'ville': fields.String(description='Ville'),
    'pays': fields.String(description='Pays', default='Madagascar'),
    'codePostal': fields.String(description='Code postal'),
    'telephone': fields.String(description='Téléphone'),
    'email': fields.String(description='Email'),
    'siteWeb': fields.String(description='Site web'),
    'logo': fields.String(description='URL du logo'),
    'couleurPrimaire': fields.String(description='Couleur primaire (hex)'),
    'actif': fields.Boolean(description='Établissement actif'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

etablissement_create_model = api.model('EtablissementCreate', {
    'code': fields.String(required=True, description='Code de l\'établissement', example='UDM'),
    'nom': fields.String(required=True, description='Nom complet', example='Université de Madagascar'),
    'nomCourt': fields.String(description='Nom court', example='UDM'),
    'description': fields.String(description='Description'),
    'typeEtablissement': fields.String(required=True, description='Type', enum=['université', 'école', 'institut']),
    'adresse': fields.String(description='Adresse'),
    'ville': fields.String(description='Ville'),
    'pays': fields.String(description='Pays', default='Madagascar'),
    'codePostal': fields.String(description='Code postal'),
    'telephone': fields.String(description='Téléphone'),
    'email': fields.String(description='Email'),
    'siteWeb': fields.String(description='Site web'),
    'logo': fields.String(description='URL du logo'),
    'couleurPrimaire': fields.String(description='Couleur primaire (hex)'),
    'actif': fields.Boolean(description='Établissement actif', default=True)
})

# Service
etablissement_service = EtablissementService()
user_repo = UserRepository()


def require_admin():
    """Vérifie que l'utilisateur est admin"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")


@api.route('')
class EtablissementList(Resource):
    @api.doc('list_etablissements')
    @api.param('actifs_seulement', 'Ne retourner que les établissements actifs', type='boolean', default=False)
    @api.marshal_list_with(etablissement_model)
    def get(self):
        """Liste tous les établissements"""
        try:
            actifs_seulement = request.args.get('actifs_seulement', 'false').lower() == 'true'
            etablissements = etablissement_service.get_all_etablissements(actifs_seulement=actifs_seulement)
            return etablissements, 200
        except Exception as e:
            logger.error(f"Erreur récupération établissements: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_etablissement', security='Bearer')
    @api.expect(etablissement_create_model)
    @api.marshal_with(etablissement_model, code=201)
    @jwt_required()
    def post(self):
        """Crée un nouvel établissement (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            etablissement = etablissement_service.create_etablissement(data)
            return etablissement, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création établissement: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:etablissement_id>')
@api.param('etablissement_id', 'ID de l\'établissement')
class EtablissementDetail(Resource):
    @api.doc('get_etablissement')
    @api.marshal_with(etablissement_model)
    def get(self, etablissement_id):
        """Récupère un établissement par son ID"""
        try:
            etablissement = etablissement_service.get_etablissement_by_id(etablissement_id)
            if not etablissement:
                api.abort(404, f"Établissement {etablissement_id} non trouvé")
            return etablissement, 200
        except Exception as e:
            logger.error(f"Erreur récupération établissement: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_etablissement', security='Bearer')
    @api.expect(etablissement_create_model)
    @api.marshal_with(etablissement_model)
    @jwt_required()
    def put(self, etablissement_id):
        """Met à jour un établissement (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            etablissement = etablissement_service.update_etablissement(etablissement_id, data)
            return etablissement, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour établissement: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_etablissement', security='Bearer')
    @jwt_required()
    def delete(self, etablissement_id):
        """Supprime un établissement (admin only)"""
        try:
            require_admin()
            etablissement_service.delete_etablissement(etablissement_id)
            return {'message': 'Établissement supprimé avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression établissement: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/type/<string:type_etablissement>')
@api.param('type_etablissement', 'Type d\'établissement (université, école, institut)')
class EtablissementByType(Resource):
    @api.doc('get_etablissements_by_type')
    @api.marshal_list_with(etablissement_model)
    def get(self, type_etablissement):
        """Récupère les établissements d'un type"""
        try:
            etablissements = etablissement_service.get_etablissements_by_type(type_etablissement)
            return etablissements, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur récupération établissements par type: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

