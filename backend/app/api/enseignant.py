"""
Routes API pour la gestion des Enseignants
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.enseignant_service import EnseignantService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

api = Namespace('enseignants', description='Opérations sur les enseignants')

# Modèles Swagger
enseignant_model = api.model('Enseignant', {
    'id': fields.String(description='ID de l\'enseignant'),
    'userId': fields.String(required=True, description='ID de l\'utilisateur'),
    'numeroEnseignant': fields.String(required=True, description='Numéro d\'enseignant'),
    'grade': fields.String(description='Grade'),
    'specialite': fields.String(description='Spécialité'),
    'departement': fields.String(description='Département'),
    'bureau': fields.String(description='Bureau'),
    'horairesDisponibilite': fields.String(description='Horaires de disponibilité'),
    'etablissementId': fields.String(required=True, description='ID de l\'établissement'),
    'dateEmbauche': fields.String(description='Date d\'embauche'),
    'actif': fields.Boolean(description='Enseignant actif')
})

enseignant_create_model = api.model('EnseignantCreate', {
    'userId': fields.String(required=True),
    'numeroEnseignant': fields.String(required=True),
    'grade': fields.String(),
    'specialite': fields.String(),
    'departement': fields.String(),
    'bureau': fields.String(),
    'horairesDisponibilite': fields.String(),
    'etablissementId': fields.String(required=True),
    'dateEmbauche': fields.String(),
    'actif': fields.Boolean(default=True)
})

enseignant_service = EnseignantService()
user_repo = UserRepository()


def require_admin():
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")


def require_admin_or_self(enseignant_id):
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if user.role == UserRole.ADMIN:
        return
    # Vérifier si c'est l'enseignant lui-même
    enseignant = enseignant_service.get_enseignant_by_user_id(user_id)
    if not enseignant or enseignant['id'] != enseignant_id:
        api.abort(403, "Accès non autorisé")


@api.route('')
class EnseignantList(Resource):
    @api.doc('list_enseignants')
    @api.param('page', 'Page', type='int', default=1)
    @api.param('per_page', 'Résultats par page', type='int', default=50)
    @jwt_required()
    def get(self):
        """Liste tous les enseignants (pagination)"""
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
            result = enseignant_service.get_all_enseignants(
                page=page, per_page=per_page)
            return result, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération enseignants: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_enseignant', security='Bearer')
    @api.expect(enseignant_create_model)
    @jwt_required()
    def post(self):
        """Crée un enseignant (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            # Convertir camelCase en snake_case
            if 'userId' in data:
                data['user_id'] = data.pop('userId')
            if 'numeroEnseignant' in data:
                data['numero_enseignant'] = data.pop('numeroEnseignant')
            if 'etablissementId' in data:
                data['etablissement_id'] = data.pop('etablissementId')
            if 'dateEmbauche' in data:
                data['date_embauche'] = data.pop('dateEmbauche')
            if 'horairesDisponibilite' in data:
                data['horaires_disponibilite'] = data.pop(
                    'horairesDisponibilite')
            enseignant = enseignant_service.create_enseignant(data)
            return enseignant, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création enseignant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/me')
class EnseignantMe(Resource):
    @api.doc('get_enseignant_me', security='Bearer')
    @jwt_required()
    def get(self):
        """Profil de l'enseignant connecté"""
        try:
            user_id = get_jwt_identity()
            include_relations = request.args.get(
                'include_relations', 'false').lower() == 'true'
            enseignant = enseignant_service.get_enseignant_by_user_id(
                user_id, include_relations=include_relations)
            if not enseignant:
                api.abort(404, "Profil enseignant non trouvé")
            return enseignant, 200
        except Exception as e:
            logger.error(f"Erreur récupération profil: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


# Modèle pour les statistiques de l'enseignant
enseignant_statistiques_model = api.model('EnseignantStatistiques', {
    'total_qcms': fields.Integer(description='Nombre total de QCMs'),
    'qcms_publies': fields.Integer(description='Nombre de QCMs publiés'),
    'qcms_brouillon': fields.Integer(description='Nombre de QCMs en brouillon'),
    'total_sessions': fields.Integer(description='Nombre total de sessions'),
    'sessions_actives': fields.Integer(description='Nombre de sessions actives'),
    'sessions_programmees': fields.Integer(description='Nombre de sessions programmées'),
    'sessions_terminees': fields.Integer(description='Nombre de sessions terminées'),
    'total_etudiants': fields.Integer(description='Nombre d\'étudiants liés'),
    'taux_reussite': fields.Float(description='Taux de réussite global en %'),
    'total_resultats': fields.Integer(description='Nombre total de résultats'),
    'resultats_reussis': fields.Integer(description='Nombre de résultats réussis'),
})


@api.route('/<string:enseignant_id>/statistiques')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantStatistiques(Resource):
    @api.doc('get_enseignant_statistiques', security='Bearer')
    @api.marshal_with(enseignant_statistiques_model)
    @jwt_required()
    def get(self, enseignant_id):
        """Récupère les statistiques complètes d'un enseignant"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            # Vérifier que l'utilisateur est admin ou le même enseignant
            if user.role != UserRole.ADMIN:
                enseignant = enseignant_service.get_enseignant_by_user_id(
                    user_id)
                if not enseignant or enseignant['id'] != enseignant_id:
                    api.abort(
                        403, "Vous ne pouvez voir que vos propres statistiques")

            stats = enseignant_service.get_statistiques(enseignant_id)
            return stats, 200
        except ValueError as e:
            api.abort(404, str(e))
        except Exception as e:
            logger.error(
                f"Erreur récupération statistiques enseignant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantDetail(Resource):
    @api.doc('get_enseignant', security='Bearer')
    @jwt_required()
    def get(self, enseignant_id):
        """Récupère un enseignant par son ID"""
        try:
            include_relations = request.args.get(
                'include_relations', 'false').lower() == 'true'
            enseignant = enseignant_service.get_enseignant_by_id(
                enseignant_id, include_relations=include_relations)
            if not enseignant:
                api.abort(404, f"Enseignant {enseignant_id} non trouvé")
            return enseignant, 200
        except Exception as e:
            logger.error(f"Erreur récupération enseignant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_enseignant', security='Bearer')
    @api.expect(enseignant_create_model)
    @jwt_required()
    def put(self, enseignant_id):
        """Met à jour un enseignant (admin/enseignant lui-même)"""
        try:
            require_admin_or_self(enseignant_id)
            data = request.get_json()
            # Convertir camelCase
            if 'numeroEnseignant' in data:
                data['numero_enseignant'] = data.pop('numeroEnseignant')
            if 'etablissementId' in data:
                data['etablissement_id'] = data.pop('etablissementId')
            if 'dateEmbauche' in data:
                data['date_embauche'] = data.pop('dateEmbauche')
            if 'horairesDisponibilite' in data:
                data['horaires_disponibilite'] = data.pop(
                    'horairesDisponibilite')
            # Note: 'specialite' reste tel quel car géré dans le service
            enseignant = enseignant_service.update_enseignant(
                enseignant_id, data)
            return enseignant, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour enseignant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_enseignant', security='Bearer')
    @jwt_required()
    def delete(self, enseignant_id):
        """Supprime un enseignant (admin only)"""
        try:
            require_admin()
            enseignant_service.delete_enseignant(enseignant_id)
            return {'message': 'Enseignant supprimé avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression enseignant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/matieres')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantMatieres(Resource):
    @api.doc('get_enseignant_matieres', security='Bearer')
    @jwt_required()
    def get(self, enseignant_id):
        """Récupère les matières de l'enseignant"""
        try:
            matieres = enseignant_service.get_matieres(enseignant_id)
            return matieres, 200
        except Exception as e:
            logger.error(f"Erreur récupération matières: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_enseignant_matieres', security='Bearer')
    @jwt_required()
    def put(self, enseignant_id):
        """Met à jour toutes les matières de l'enseignant"""
        try:
            require_admin_or_self(enseignant_id)
            data = request.get_json()
            matieres_ids = data.get('matieres_ids', [])
            
            # Appeler le service pour mettre à jour
            enseignant_service.update_matieres(enseignant_id, matieres_ids)
            return {'message': 'Matières mises à jour avec succès'}, 200
        except Exception as e:
            logger.error(f"Erreur mise à jour matières: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/matieres/<string:matiere_id>')
@api.param('enseignant_id', 'ID de l\'enseignant')
@api.param('matiere_id', 'ID de la matière')
class EnseignantMatiereAssignment(Resource):
    @api.doc('assign_matiere', security='Bearer')
    @jwt_required()
    def post(self, enseignant_id, matiere_id):
        """Assigne une matière à l'enseignant (admin only)"""
        try:
            require_admin()
            enseignant_service.assign_matiere(enseignant_id, matiere_id)
            return {'message': 'Matière assignée avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur assignation matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('unassign_matiere', security='Bearer')
    @jwt_required()
    def delete(self, enseignant_id, matiere_id):
        """Retire une matière de l'enseignant (admin only)"""
        try:
            require_admin()
            enseignant_service.unassign_matiere(enseignant_id, matiere_id)
            return {'message': 'Matière retirée avec succès'}, 200
        except Exception as e:
            logger.error(f"Erreur retrait matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/niveaux')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantNiveaux(Resource):
    @api.doc('get_enseignant_niveaux', security='Bearer')
    @jwt_required()
    def get(self, enseignant_id):
        """Récupère les niveaux de l'enseignant"""
        try:
            niveaux = enseignant_service.get_niveaux(enseignant_id)
            return niveaux, 200
        except Exception as e:
            logger.error(f"Erreur récupération niveaux: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/niveaux/<string:niveau_id>')
@api.param('enseignant_id', 'ID de l\'enseignant')
@api.param('niveau_id', 'ID du niveau')
class EnseignantNiveauAssignment(Resource):
    @api.doc('assign_niveau', security='Bearer')
    @jwt_required()
    def post(self, enseignant_id, niveau_id):
        """Assigne un niveau à l'enseignant (admin only)"""
        try:
            require_admin()
            enseignant_service.assign_niveau(enseignant_id, niveau_id)
            return {'message': 'Niveau assigné avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur assignation niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/parcours')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantParcours(Resource):
    @api.doc('get_enseignant_parcours', security='Bearer')
    @jwt_required()
    def get(self, enseignant_id):
        """Récupère les parcours de l'enseignant"""
        try:
            parcours = enseignant_service.get_parcours(enseignant_id)
            return parcours, 200
        except Exception as e:
            logger.error(f"Erreur récupération parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/parcours/<string:parcours_id>')
@api.param('enseignant_id', 'ID de l\'enseignant')
@api.param('parcours_id', 'ID du parcours')
class EnseignantParcoursAssignment(Resource):
    @api.doc('assign_parcours', security='Bearer')
    @jwt_required()
    def post(self, enseignant_id, parcours_id):
        """Assigne un parcours à l'enseignant (admin only)"""
        try:
            require_admin()
            enseignant_service.assign_parcours(enseignant_id, parcours_id)
            return {'message': 'Parcours assigné avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur assignation parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/mentions')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantMentions(Resource):
    @api.doc('get_enseignant_mentions', security='Bearer')
    @jwt_required()
    def get(self, enseignant_id):
        """Récupère les mentions de l'enseignant"""
        try:
            mentions = enseignant_service.get_mentions(enseignant_id)
            return mentions, 200
        except Exception as e:
            logger.error(f"Erreur récupération mentions: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/etablissement/<string:etablissement_id>')
@api.param('etablissement_id', 'ID de l\'établissement')
class EnseignantByEtablissement(Resource):
    @api.doc('get_enseignants_by_etablissement', security='Bearer')
    @jwt_required()
    def get(self, etablissement_id):
        """Récupère les enseignants d'un établissement"""
        try:
            enseignants = enseignant_service.get_enseignants_by_etablissement(
                etablissement_id)
            return enseignants, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération enseignants par établissement: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/etudiants')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantEtudiants(Resource):
    @api.doc('get_enseignant_etudiants', security='Bearer')
    @api.param('matiere_id', 'Filtrer par matière', type='string')
    @api.param('niveau_id', 'Filtrer par niveau', type='string')
    @api.param('parcours_id', 'Filtrer par parcours', type='string')
    @api.param('mention_id', 'Filtrer par mention', type='string')
    @api.param('annee_scolaire', 'Filtrer par année scolaire (ex: 2024-2025)', type='string')
    @api.param('page', 'Numéro de page', type='int', default=1)
    @api.param('per_page', 'Résultats par page', type='int', default=50)
    @jwt_required()
    def get(self, enseignant_id):
        """Récupère les étudiants liés à un enseignant

        Un étudiant est lié s'il partage au moins un critère commun avec l'enseignant:
        - Matière commune
        - Même niveau
        - Même parcours
        - Même mention
        """
        try:
            # Récupérer les filtres individuels
            matiere_id = request.args.get('matiere_id')
            niveau_id = request.args.get('niveau_id')
            parcours_id = request.args.get('parcours_id')
            mention_id = request.args.get('mention_id')
            annee_scolaire = request.args.get('annee_scolaire')
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))

            result = enseignant_service.get_etudiants_lies(
                enseignant_id=enseignant_id,
                niveau_id=niveau_id,
                matiere_id=matiere_id,
                parcours_id=parcours_id,
                mention_id=mention_id,
                annee_scolaire=annee_scolaire,
                page=page,
                per_page=per_page
            )
            return result, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(
                f"Erreur récupération étudiants liés: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:enseignant_id>/etudiants/export-pdf')
@api.param('enseignant_id', 'ID de l\'enseignant')
class EnseignantEtudiantsExportPDF(Resource):
    @api.doc('export_pdf_etudiants', security='Bearer')
    @api.param('matiere_id', 'Filtrer par matière', type='string')
    @api.param('niveau_id', 'Filtrer par niveau', type='string')
    @api.param('parcours_id', 'Filtrer par parcours', type='string')
    @api.param('mention_id', 'Filtrer par mention', type='string')
    @api.param('annee_scolaire', 'Filtrer par année scolaire (ex: 2024-2025)', type='string')
    @jwt_required()
    def get(self, enseignant_id):
        """Exporte les étudiants liés à un enseignant en PDF"""
        from flask import Response
        from app.services.pdf_service import PDFService

        try:
            # Récupérer les filtres individuels
            matiere_id = request.args.get('matiere_id')
            niveau_id = request.args.get('niveau_id')
            parcours_id = request.args.get('parcours_id')
            mention_id = request.args.get('mention_id')
            annee_scolaire = request.args.get('annee_scolaire')

            # Créer un dictionnaire de filtres pour le PDF
            filters = {}
            if matiere_id:
                filters['matiere_id'] = matiere_id
            if niveau_id:
                filters['niveau_id'] = niveau_id
            if parcours_id:
                filters['parcours_id'] = parcours_id
            if mention_id:
                filters['mention_id'] = mention_id
            if annee_scolaire:
                filters['annee_scolaire'] = annee_scolaire

            # Récupérer tous les étudiants (sans pagination pour le PDF)
            result = enseignant_service.get_etudiants_lies(
                enseignant_id=enseignant_id,
                niveau_id=niveau_id,
                matiere_id=matiere_id,
                parcours_id=parcours_id,
                mention_id=mention_id,
                annee_scolaire=annee_scolaire,
                page=1,
                per_page=1000  # Limite élevée pour récupérer tous les étudiants
            )

            etudiants_data = result.get('items', [])

            # Générer le PDF
            pdf_service = PDFService()
            pdf_buffer = pdf_service.generer_pdf_eleves_enseignant(
                enseignant_id=enseignant_id,
                etudiants_data=etudiants_data,
                filters=filters if filters else None
            )

            # Récupérer le nom de l'enseignant pour le nom de fichier
            enseignant = enseignant_service.get_enseignant_by_id(enseignant_id)
            enseignant_name = enseignant.get('user', {}).get(
                'name', 'enseignant') if enseignant else 'enseignant'
            # Nettoyer le nom de fichier (enlever caractères spéciaux)
            import re
            filename = re.sub(r'[^\w\-_.]', '_', f"eleves_{enseignant_name}.pdf")

            return Response(
                pdf_buffer,
                mimetype='application/pdf',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type'
                }
            )
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur export PDF étudiants: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
