"""
Routes API pour la gestion des Étudiants
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.etudiant_service import EtudiantService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

api = Namespace('etudiants', description='Opérations sur les étudiants')

# Modèles Swagger
etudiant_model = api.model('Etudiant', {
    'id': fields.String(description='ID de l\'étudiant'),
    'userId': fields.String(required=True, description='ID de l\'utilisateur'),
    'numeroEtudiant': fields.String(required=True, description='Numéro d\'étudiant'),
    'anneeAdmission': fields.String(description='Année d\'admission'),
    'etablissementId': fields.String(required=True, description='ID de l\'établissement'),
    'mentionId': fields.String(description='ID de la mention'),
    'parcoursId': fields.String(description='ID du parcours'),
    'niveauId': fields.String(description='ID du niveau'),
    'actif': fields.Boolean(description='Étudiant actif')
})

etudiant_create_model = api.model('EtudiantCreate', {
    'userId': fields.String(required=True),
    'numeroEtudiant': fields.String(required=True),
    'anneeAdmission': fields.String(),
    'etablissementId': fields.String(required=True),
    'mentionId': fields.String(),
    'parcoursId': fields.String(),
    'niveauId': fields.String(),
    'matieres': fields.List(fields.String(), description='IDs des matières'),
    'actif': fields.Boolean(default=True)
})

etudiant_service = EtudiantService()
user_repo = UserRepository()

def require_admin():
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")

def require_admin_or_self(etudiant_id):
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if user.role == UserRole.ADMIN:
        return
    # Vérifier si c'est l'étudiant lui-même
    etudiant = etudiant_service.get_etudiant_by_user_id(user_id)
    if not etudiant or etudiant['id'] != etudiant_id:
        api.abort(403, "Accès non autorisé")

@api.route('')
class EtudiantList(Resource):
    @api.doc('list_etudiants')
    @api.param('page', 'Page', type='int', default=1)
    @api.param('per_page', 'Résultats par page', type='int', default=50)
    @jwt_required()
    def get(self):
        """Liste tous les étudiants (pagination)"""
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
            result = etudiant_service.get_all_etudiants(page=page, per_page=per_page)
            return result, 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_etudiant', security='Bearer')
    @api.expect(etudiant_create_model)
    @jwt_required()
    def post(self):
        """Crée un étudiant (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            # Convertir camelCase en snake_case
            if 'userId' in data:
                data['user_id'] = data.pop('userId')
            if 'numeroEtudiant' in data:
                data['numero_etudiant'] = data.pop('numeroEtudiant')
            if 'anneeAdmission' in data:
                data['annee_admission'] = data.pop('anneeAdmission')
            if 'etablissementId' in data:
                data['etablissement_id'] = data.pop('etablissementId')
            if 'mentionId' in data:
                data['mention_id'] = data.pop('mentionId')
            if 'parcoursId' in data:
                data['parcours_id'] = data.pop('parcoursId')
            if 'niveauId' in data:
                data['niveau_id'] = data.pop('niveauId')
            etudiant = etudiant_service.create_etudiant(data)
            return etudiant, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/me')
class EtudiantMe(Resource):
    @api.doc('get_etudiant_me', security='Bearer')
    @jwt_required()
    def get(self):
        """Profil de l'étudiant connecté"""
        try:
            user_id = get_jwt_identity()
            etudiant = etudiant_service.get_etudiant_by_user_id(user_id)
            if not etudiant:
                api.abort(404, "Profil étudiant non trouvé")
            return etudiant, 200
        except Exception as e:
            logger.error(f"Erreur récupération profil: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/<string:etudiant_id>')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantDetail(Resource):
    @api.doc('get_etudiant', security='Bearer')
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère un étudiant par son ID"""
        try:
            include_relations = request.args.get('include_relations', 'false').lower() == 'true'
            etudiant = etudiant_service.get_etudiant_by_id(etudiant_id, include_relations=include_relations)
            if not etudiant:
                api.abort(404, f"Étudiant {etudiant_id} non trouvé")
            return etudiant, 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_etudiant', security='Bearer')
    @api.expect(etudiant_create_model)
    @jwt_required()
    def put(self, etudiant_id):
        """Met à jour un étudiant (admin/étudiant lui-même)"""
        try:
            require_admin_or_self(etudiant_id)
            data = request.get_json()
            # Convertir camelCase
            if 'numeroEtudiant' in data:
                data['numero_etudiant'] = data.pop('numeroEtudiant')
            if 'anneeAdmission' in data:
                data['annee_admission'] = data.pop('anneeAdmission')
            if 'etablissementId' in data:
                data['etablissement_id'] = data.pop('etablissementId')
            if 'mentionId' in data:
                data['mention_id'] = data.pop('mentionId')
            if 'parcoursId' in data:
                data['parcours_id'] = data.pop('parcoursId')
            if 'niveauId' in data:
                data['niveau_id'] = data.pop('niveauId')
            etudiant = etudiant_service.update_etudiant(etudiant_id, data)
            return etudiant, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_etudiant', security='Bearer')
    @jwt_required()
    def delete(self, etudiant_id):
        """Supprime un étudiant (admin only)"""
        try:
            require_admin()
            etudiant_service.delete_etudiant(etudiant_id)
            return {'message': 'Étudiant supprimé avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/<string:etudiant_id>/details-evaluations')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantDetailsEvaluations(Resource):
    @api.doc('get_etudiant_details_evaluations', security='Bearer')
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les détails complets d'un étudiant avec ses évaluations et statistiques"""
        try:
            from app.services.resultat_service import ResultatService
            from app.repositories.etudiant_repository import EtudiantRepository
            
            resultat_service = ResultatService()
            etudiant_repo = EtudiantRepository()
            
            # Récupérer l'étudiant avec relations
            etudiant = etudiant_repo.get_by_id(etudiant_id)
            if not etudiant:
                api.abort(404, f"Étudiant {etudiant_id} non trouvé")
            
            # Récupérer les informations de base
            etudiant_data = etudiant.to_dict(include_relations=True)
            
            # Récupérer les résultats (évaluations)
            resultats = resultat_service.get_resultats_by_etudiant(etudiant.user_id)
            
            # Récupérer les statistiques
            stats = resultat_service.get_statistiques_etudiant(etudiant.user_id)
            
            # Trier les résultats par date (plus récents en premier)
            resultats_tries = sorted(
                resultats,
                key=lambda r: r.get('dateFin') or r.get('dateDebut') or '',
                reverse=True
            )
            
            # Limiter aux 10 derniers résultats
            derniers_resultats = resultats_tries[:10]
            
            # Calculer les notes par matière
            notes_par_matiere = {}
            for resultat in resultats:
                if resultat.get('status') == 'termine' and resultat.get('noteSur20') is not None:
                    qcm = resultat.get('qcm', {})
                    matiere_nom = qcm.get('matiere') if qcm else None
                    if matiere_nom:
                        if matiere_nom not in notes_par_matiere:
                            notes_par_matiere[matiere_nom] = []
                        notes_par_matiere[matiere_nom].append(resultat.get('noteSur20'))
            
            # Calculer les moyennes par matière
            moyennes_par_matiere = {
                matiere: sum(notes) / len(notes) if notes else 0
                for matiere, notes in notes_par_matiere.items()
            }
            
            return {
                'etudiant': etudiant_data,
                'statistiques': stats,
                'derniersResultats': derniers_resultats,
                'notesParMatiere': moyennes_par_matiere,
                'totalResultats': len(resultats)
            }, 200
        except Exception as e:
            logger.error(f"Erreur récupération détails évaluations: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/<string:etudiant_id>/matieres')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantMatieres(Resource):
    @api.doc('get_etudiant_matieres', security='Bearer')
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les matières de l'étudiant"""
        try:
            matieres = etudiant_service.get_matieres(etudiant_id)
            return matieres, 200
        except Exception as e:
            logger.error(f"Erreur récupération matières: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/<string:etudiant_id>/matieres/<string:matiere_id>')
@api.param('etudiant_id', 'ID de l\'étudiant')
@api.param('matiere_id', 'ID de la matière')
class EtudiantMatiereAssignment(Resource):
    @api.doc('enroll_matiere', security='Bearer')
    @jwt_required()
    def post(self, etudiant_id, matiere_id):
        """Inscrit l'étudiant à une matière (admin only)"""
        try:
            require_admin()
            etudiant_service.enroll_matiere(etudiant_id, matiere_id)
            return {'message': 'Étudiant inscrit à la matière avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur inscription matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('unenroll_matiere', security='Bearer')
    @jwt_required()
    def delete(self, etudiant_id, matiere_id):
        """Désinscrit l'étudiant d'une matière (admin only)"""
        try:
            require_admin()
            etudiant_service.unenroll_matiere(etudiant_id, matiere_id)
            return {'message': 'Étudiant désinscrit de la matière avec succès'}, 200
        except Exception as e:
            logger.error(f"Erreur désinscription matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/<string:etudiant_id>/classes')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantClasses(Resource):
    @api.doc('get_etudiant_classes', security='Bearer')
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les classes de l'étudiant"""
        try:
            classes = etudiant_service.get_classes(etudiant_id)
            return classes, 200
        except Exception as e:
            logger.error(f"Erreur récupération classes: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/<string:etudiant_id>/classes/<string:classe_id>')
@api.param('etudiant_id', 'ID de l\'étudiant')
@api.param('classe_id', 'ID de la classe')
class EtudiantClasseAssignment(Resource):
    @api.doc('assign_classe', security='Bearer')
    @jwt_required()
    def post(self, etudiant_id, classe_id):
        """Assigne l'étudiant à une classe (admin only)"""
        try:
            require_admin()
            etudiant_service.assign_classe(etudiant_id, classe_id)
            return {'message': 'Étudiant assigné à la classe avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur assignation classe: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/mention/<string:mention_id>')
@api.param('mention_id', 'ID de la mention')
class EtudiantByMention(Resource):
    @api.doc('get_etudiants_by_mention', security='Bearer')
    @jwt_required()
    def get(self, mention_id):
        """Récupère les étudiants d'une mention"""
        try:
            etudiants = etudiant_service.get_etudiants_by_mention(mention_id)
            return etudiants, 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants par mention: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/parcours/<string:parcours_id>')
@api.param('parcours_id', 'ID du parcours')
class EtudiantByParcours(Resource):
    @api.doc('get_etudiants_by_parcours', security='Bearer')
    @jwt_required()
    def get(self, parcours_id):
        """Récupère les étudiants d'un parcours"""
        try:
            etudiants = etudiant_service.get_etudiants_by_parcours(parcours_id)
            return etudiants, 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants par parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

@api.route('/niveau/<string:niveau_id>')
@api.param('niveau_id', 'ID du niveau')
class EtudiantByNiveau(Resource):
    @api.doc('get_etudiants_by_niveau', security='Bearer')
    @jwt_required()
    def get(self, niveau_id):
        """Récupère les étudiants d'un niveau"""
        try:
            etudiants = etudiant_service.get_etudiants_by_niveau(niveau_id)
            return etudiants, 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants par niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

