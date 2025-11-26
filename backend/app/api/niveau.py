"""
Routes API pour la gestion des Niveaux
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.niveau_service import NiveauService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace('niveaux', description='Opérations sur les niveaux universitaires')

# Modèles pour la documentation Swagger
niveau_model = api.model('Niveau', {
    'id': fields.String(description='ID du niveau'),
    'code': fields.String(required=True, description='Code du niveau (L1, M2, etc.)', example='L1'),
    'nom': fields.String(required=True, description='Nom complet', example='Licence 1'),
    'description': fields.String(description='Description'),
    'ordre': fields.Integer(required=True, description='Ordre de tri', example=1),
    'cycle': fields.String(required=True, description='Cycle', enum=['licence', 'master', 'doctorat']),
    'actif': fields.Boolean(description='Niveau actif'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

niveau_create_model = api.model('NiveauCreate', {
    'code': fields.String(required=True, description='Code du niveau', example='L1'),
    'nom': fields.String(required=True, description='Nom complet', example='Licence 1'),
    'description': fields.String(description='Description'),
    'ordre': fields.Integer(required=True, description='Ordre de tri', example=1),
    'cycle': fields.String(required=True, description='Cycle', enum=['licence', 'master', 'doctorat']),
    'actif': fields.Boolean(description='Niveau actif', default=True)
})

# Service
niveau_service = NiveauService()
user_repo = UserRepository()


def require_admin():
    """Vérifie que l'utilisateur est admin"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")


@api.route('')
class NiveauList(Resource):
    @api.doc('list_niveaux')
    @api.param('actifs_seulement', 'Ne retourner que les niveaux actifs', type='boolean', default=False)
    @api.marshal_list_with(niveau_model)
    def get(self):
        """Liste tous les niveaux"""
        try:
            actifs_seulement = request.args.get('actifs_seulement', 'false').lower() == 'true'
            niveaux = niveau_service.get_all_niveaux(actifs_seulement=actifs_seulement)
            return niveaux, 200
        except Exception as e:
            logger.error(f"Erreur récupération niveaux: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_niveau', security='Bearer')
    @api.expect(niveau_create_model)
    @api.marshal_with(niveau_model, code=201)
    @jwt_required()
    def post(self):
        """Crée un nouveau niveau (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            niveau = niveau_service.create_niveau(data)
            return niveau, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:niveau_id>')
@api.param('niveau_id', 'ID du niveau')
class NiveauDetail(Resource):
    @api.doc('get_niveau')
    @api.marshal_with(niveau_model)
    def get(self, niveau_id):
        """Récupère un niveau par son ID"""
        try:
            niveau = niveau_service.get_niveau_by_id(niveau_id)
            if not niveau:
                api.abort(404, f"Niveau {niveau_id} non trouvé")
            return niveau, 200
        except Exception as e:
            logger.error(f"Erreur récupération niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_niveau', security='Bearer')
    @api.expect(niveau_create_model)
    @api.marshal_with(niveau_model)
    @jwt_required()
    def put(self, niveau_id):
        """Met à jour un niveau (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            niveau = niveau_service.update_niveau(niveau_id, data)
            return niveau, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_niveau', security='Bearer')
    @jwt_required()
    def delete(self, niveau_id):
        """Supprime un niveau (admin only)"""
        try:
            require_admin()
            niveau_service.delete_niveau(niveau_id)
            return {'message': 'Niveau supprimé avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/cycle/<string:cycle>')
@api.param('cycle', 'Cycle (licence, master, doctorat)')
class NiveauByCycle(Resource):
    @api.doc('get_niveaux_by_cycle')
    @api.marshal_list_with(niveau_model)
    def get(self, cycle):
        """Récupère les niveaux d'un cycle"""
        try:
            niveaux = niveau_service.get_niveaux_by_cycle(cycle)
            return niveaux, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur récupération niveaux par cycle: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
