"""
Routes API pour la gestion des Résultats
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import HTTPException
from app.services.resultat_service import ResultatService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging
import traceback

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace(
    'resultats', description='Opérations sur les résultats d\'examen')

# Modèles pour la documentation Swagger
user_ref = api.model('UserRef', {
    'id': fields.String(description='ID de l\'utilisateur'),
    'name': fields.String(description='Nom de l\'utilisateur'),
    'email': fields.String(description='Email de l\'utilisateur')
})

session_ref = api.model('SessionRef', {
    'id': fields.String(description='ID de la session'),
    'titre': fields.String(description='Titre de la session')
})

qcm_ref_resultat = api.model('QCMRefResultat', {
    'id': fields.String(description='ID du QCM'),
    'titre': fields.String(description='Titre du QCM')
})

resultat_model = api.model('Resultat', {
    'id': fields.String(description='ID du résultat'),
    'etudiantId': fields.String(description='ID de l\'étudiant'),
    'etudiant': fields.Nested(user_ref, description='Informations de l\'étudiant'),
    'sessionId': fields.String(description='ID de la session'),
    'session': fields.Nested(session_ref, description='Informations de la session'),
    'qcmId': fields.String(description='ID du QCM'),
    'qcm': fields.Nested(qcm_ref_resultat, description='Informations du QCM'),
    'numeroTentative': fields.Integer(description='Numéro de la tentative'),
    'dateDebut': fields.String(description='Date de début'),
    'dateFin': fields.String(description='Date de fin'),
    'dureeReelleSecondes': fields.Integer(description='Durée réelle en secondes'),
    'scoreTotal': fields.Float(description='Score total obtenu'),
    'scoreMaximum': fields.Float(description='Score maximum possible'),
    'noteSur20': fields.Float(description='Note sur 20'),
    'pourcentage': fields.Float(description='Pourcentage de réussite'),
    'questionsTotal': fields.Integer(description='Nombre total de questions'),
    'questionsRepondues': fields.Integer(description='Nombre de questions répondues'),
    'questionsCorrectes': fields.Integer(description='Nombre de questions correctes'),
    'questionsIncorrectes': fields.Integer(description='Nombre de questions incorrectes'),
    'questionsPartielles': fields.Integer(description='Nombre de questions partiellement correctes'),
    'status': fields.String(description='Statut', enum=['en_cours', 'termine', 'abandonne', 'invalide']),
    'estReussi': fields.Boolean(description='Examen réussi'),
    'estValide': fields.Boolean(description='Résultat valide'),
    'feedbackAuto': fields.String(description='Feedback automatique'),
    'commentaireProf': fields.String(description='Commentaire du professeur'),
    'noteProf': fields.Float(description='Note ajustée par le professeur'),
    'reponsesDetail': fields.Raw(description='Détails des réponses (dictionnaire)'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

demarrer_examen_model = api.model('DemarrerExamen', {
    'sessionId': fields.String(required=True, description='ID de la session')
})

soumettre_reponses_model = api.model('SoumettreReponses', {
    'reponses': fields.Raw(required=True, description='Dictionnaire des réponses (question_id: reponse)')
})

commentaire_prof_model = api.model('CommentaireProf', {
    'commentaire': fields.String(required=True, description='Commentaire du professeur'),
    'noteProf': fields.Float(description='Note ajustée par le professeur (0-20)')
})

statistiques_session_model = api.model('StatistiquesSession', {
    'nombre_participants': fields.Integer(description='Nombre de participants'),
    'moyenne': fields.Float(description='Moyenne de la session'),
    'note_min': fields.Float(description='Note minimale'),
    'note_max': fields.Float(description='Note maximale'),
    'taux_reussite': fields.Float(description='Taux de réussite en %')
})

statistiques_etudiant_model = api.model('StatistiquesEtudiant', {
    'nombre_examens': fields.Integer(description='Nombre d\'examens passés'),
    'moyenne_generale': fields.Float(description='Moyenne générale'),
    'taux_reussite': fields.Float(description='Taux de réussite en %'),
    'examens_reussis': fields.Integer(description='Nombre d\'examens réussis'),
    'examens_echoues': fields.Integer(description='Nombre d\'examens échoués')
})

# Service
resultat_service = ResultatService()
user_repo = UserRepository()


def require_admin_or_teacher():
    """Vérifie que l'utilisateur est admin ou enseignant"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role not in [UserRole.ADMIN, UserRole.ENSEIGNANT]:
        api.abort(403, "Accès réservé aux administrateurs et enseignants")
    return user


@api.route('')
class ResultatList(Resource):
    @api.doc('list_resultats', security='Bearer')
    @api.param('skip', 'Nombre d\'éléments à sauter', type='integer', default=0)
    @api.param('limit', 'Nombre d\'éléments à retourner', type='integer', default=100)
    @api.param('etudiant_id', 'Filtrer par étudiant', type='string')
    @api.param('session_id', 'Filtrer par session', type='string')
    @api.param('status', 'Filtrer par statut', type='string')
    @api.marshal_with(resultat_model, as_list=True)
    @jwt_required()
    def get(self):
        """Liste tous les résultats avec pagination (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            skip = request.args.get('skip', 0, type=int)
            limit = request.args.get('limit', 100, type=int)
            etudiant_id = request.args.get('etudiant_id')
            session_id = request.args.get('session_id')
            status = request.args.get('status')

            filters = {}
            if etudiant_id:
                filters['etudiant_id'] = etudiant_id
            if session_id:
                filters['session_id'] = session_id
            if status:
                filters['status'] = status

            resultats, total = resultat_service.get_all_resultats(
                skip=skip, limit=limit, filters=filters)

            return {
                'data': resultats,
                'total': total,
                'skip': skip,
                'limit': limit
            }, 200

        except Exception as e:
            logger.error(f"Erreur récupération résultats: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:resultat_id>')
@api.param('resultat_id', 'ID du résultat')
class ResultatDetail(Resource):
    @api.doc('get_resultat', security='Bearer')
    @api.param('include_details', 'Inclure les détails des réponses', type='boolean', default=False)
    @api.marshal_with(resultat_model)
    @jwt_required()
    def get(self, resultat_id):
        """Récupère un résultat par son ID avec filtrage selon le rôle"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            if not user:
                api.abort(401, "Utilisateur non trouvé")

            # Utiliser la méthode qui filtre selon le rôle et la publication
            resultat = resultat_service.get_resultat_etudiant_filtre(
                resultat_id, user_id, user.role.value)
            if not resultat:
                api.abort(404, f"Résultat {resultat_id} non trouvé")

            return resultat, 200
        except HTTPException:
            # Laisser les exceptions HTTP (404, 403, etc.) se propager naturellement
            raise
        except ValueError as e:
            logger.error(
                f"Erreur valeur récupération résultat: {e}", exc_info=True)
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur récupération résultat: {e}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/session/<string:session_id>/etudiant')
@api.param('session_id', 'ID de la session')
class ResultatBySession(Resource):
    @api.doc('get_resultat_by_session', security='Bearer')
    @api.param('include_details', 'Inclure les détails des réponses', type='boolean', default=False)
    @api.marshal_with(resultat_model)
    @jwt_required()
    def get(self, session_id):
        """Récupère le résultat d'un étudiant pour une session donnée (avec filtrage selon publication)"""
        try:
            include_details = request.args.get(
                'include_details', 'false').lower() == 'true'
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            if not user:
                api.abort(401, "Utilisateur non trouvé")

            resultat = resultat_service.get_resultat_by_session_and_user(
                session_id, user_id, include_details=include_details)
            if not resultat:
                api.abort(404, f"Aucun résultat trouvé pour cette session")
            
            # Si étudiant et résultat non publié, filtrer les données
            if user.role == UserRole.ETUDIANT and not resultat.get('estPublie', False):
                # Retourner seulement les infos partielles
                return {
                    'id': resultat.get('id'),
                    'sessionId': resultat.get('sessionId'),
                    'status': resultat.get('status'),
                    'estPublie': False,
                    'dateDebut': resultat.get('dateDebut'),
                    'dateFin': resultat.get('dateFin'),
                    'dureeReelleSecondes': resultat.get('dureeReelleSecondes'),
                    'message': 'En attente de validation par l\'enseignant'
                }, 200

            return resultat, 200
        except HTTPException:
            raise
        except ValueError as e:
            logger.error(
                f"Erreur valeur récupération résultat par session: {e}", exc_info=True)
            api.abort(400, str(e))
        except Exception as e:
            logger.error(
                f"Erreur récupération résultat par session: {e}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/session/<string:session_id>')
@api.param('session_id', 'ID de la session')
class ResultatsBySession(Resource):
    @api.doc('get_resultats_by_session', security='Bearer')
    @api.marshal_list_with(resultat_model)
    @jwt_required()
    def get(self, session_id):
        """Récupère tous les résultats d'une session (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            resultats = resultat_service.get_resultats_by_session(session_id)
            return resultats, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération résultats par session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


# Modèle pour StartExamResponse
start_exam_response_model = api.model('StartExamResponse', {
    'session_id': fields.String(description='ID de la session de résultat'),
    'examen': fields.Raw(description='Informations de l\'examen formatées'),
    'duree_restante_secondes': fields.Integer(description='Durée restante en secondes'),
    'questions': fields.List(fields.Raw(), description='Liste des questions formatées'),
    'reponses_sauvegardees': fields.Raw(description='Réponses sauvegardées (vide au démarrage)')
})


@api.route('/demarrer')
class DemarrerExamen(Resource):
    @api.doc('demarrer_examen', security='Bearer')
    @api.expect(demarrer_examen_model)
    @api.marshal_with(start_exam_response_model, code=201)
    @jwt_required()
    def post(self):
        """Démarre un examen pour l'étudiant connecté et retourne le format StartExamResponse"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            session_id = data.get('sessionId')

            if not session_id:
                api.abort(400, "L'ID de la session est requis")

            response = resultat_service.demarrer_examen_format(
                session_id, user_id)
            return response, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur démarrage examen: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:resultat_id>/temps-restant')
@api.param('resultat_id', 'ID du résultat')
class TempsRestant(Resource):
    @api.doc('get_temps_restant', security='Bearer')
    @jwt_required()
    def get(self, resultat_id):
        """Récupère le temps restant pour un examen en cours (calculé côté serveur pour éviter la triche)"""
        try:
            user_id = get_jwt_identity()

            # Récupérer le résultat
            resultat = resultat_service.resultat_repo.get_by_id(resultat_id)
            if not resultat:
                api.abort(404, "Résultat non trouvé")

            # Vérifier que l'étudiant accède à son propre résultat
            if resultat.etudiant_id != user_id:
                api.abort(403, "Vous ne pouvez pas accéder à ce résultat")

            # Récupérer la session pour obtenir la durée totale
            session = resultat_service.session_repo.get_by_id(
                resultat.session_id)
            if not session:
                api.abort(404, "Session non trouvée")

            # Calculer le temps restant basé sur le temps réel écoulé
            from datetime import datetime
            now = datetime.utcnow()
            duree_totale_secondes = session.duree_minutes * 60

            # Si l'examen n'est pas en cours, retourner 0 secondes restantes au lieu d'une erreur
            if resultat.status != 'en_cours':
                return {
                    'duree_restante_secondes': 0,
                    'date_debut_examen': resultat.date_debut.isoformat() if resultat.date_debut else None,
                    'duree_totale_secondes': duree_totale_secondes,
                    'temps_ecoule_secondes': duree_totale_secondes,
                    'status': resultat.status
                }, 200

            temps_ecoule_secondes = (now - resultat.date_debut).total_seconds()
            duree_restante_secondes = max(
                0, duree_totale_secondes - int(temps_ecoule_secondes))

            return {
                'duree_restante_secondes': duree_restante_secondes,
                'date_debut_examen': resultat.date_debut.isoformat() if resultat.date_debut else None,
                'duree_totale_secondes': duree_totale_secondes,
                'temps_ecoule_secondes': int(temps_ecoule_secondes),
                'status': resultat.status
            }, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(
                f"Erreur récupération temps restant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:resultat_id>/soumettre')
@api.param('resultat_id', 'ID du résultat')
class SoumettreReponses(Resource):
    @api.doc('soumettre_reponses', security='Bearer')
    @api.expect(soumettre_reponses_model)
    @api.marshal_with(resultat_model)
    @jwt_required()
    def post(self, resultat_id):
        """Soumet les réponses de l'étudiant"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            reponses = data.get('reponses', {})

            # Vérifier que l'étudiant soumet bien son propre examen
            resultat = resultat_service.get_resultat_by_id(resultat_id)
            if not resultat or resultat['etudiantId'] != user_id:
                api.abort(403, "Vous ne pouvez pas soumettre ce résultat")

            resultat = resultat_service.soumettre_reponses(
                resultat_id, reponses)
            return resultat, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur soumission réponses: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:resultat_id>/commentaire')
@api.param('resultat_id', 'ID du résultat')
class AjouterCommentaire(Resource):
    @api.doc('ajouter_commentaire', security='Bearer')
    @api.expect(commentaire_prof_model)
    @api.marshal_with(resultat_model)
    @jwt_required()
    def post(self, resultat_id):
        """Ajoute un commentaire de professeur (admin/enseignant)"""
        try:
            user = require_admin_or_teacher()
            data = request.get_json()
            commentaire = data.get('commentaire')
            note_prof = data.get('noteProf')

            resultat = resultat_service.ajouter_commentaire_prof(
                resultat_id, commentaire, note_prof, user.id
            )
            return resultat, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur ajout commentaire: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:resultat_id>/regenerer-commentaire')
@api.param('resultat_id', 'ID du résultat')
class RegenererCommentaire(Resource):
    @api.doc('regenerer_commentaire', security='Bearer')
    @api.marshal_with(resultat_model)
    @jwt_required()
    def post(self, resultat_id):
        """Régénère le commentaire IA pour un résultat (admin/enseignant)"""
        try:
            user = require_admin_or_teacher()
            resultat = resultat_service.regenerer_commentaire_ia(
                resultat_id, user.id
            )
            return resultat, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur régénération commentaire: {e}", exc_info=True)
            logger.error(traceback.format_exc())
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/etudiant/<string:etudiant_id>')
@api.param('etudiant_id', 'ID de l\'étudiant')
class ResultatsByEtudiant(Resource):
    @api.doc('get_resultats_etudiant', security='Bearer')
    @api.marshal_list_with(resultat_model)
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les résultats d'un étudiant"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            # Étudiant ne peut voir que ses résultats
            if user.role == UserRole.ETUDIANT and user_id != etudiant_id:
                api.abort(403, "Vous ne pouvez voir que vos propres résultats")

            resultats = resultat_service.get_resultats_by_etudiant(etudiant_id)
            return resultats, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération résultats étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/session/<string:session_id>/statistiques')
@api.param('session_id', 'ID de la session')
class StatistiquesSession(Resource):
    @api.doc('get_statistiques_session', security='Bearer')
    @api.marshal_with(statistiques_session_model)
    @jwt_required()
    def get(self, session_id):
        """Récupère les statistiques d'une session (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            stats = resultat_service.get_statistiques_session(session_id)
            return stats, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération statistiques session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/etudiant/<string:etudiant_id>/statistiques')
@api.param('etudiant_id', 'ID de l\'étudiant')
class StatistiquesEtudiant(Resource):
    @api.doc('get_statistiques_etudiant', security='Bearer')
    @api.marshal_with(statistiques_etudiant_model)
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les statistiques d'un étudiant"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            # Étudiant ne peut voir que ses stats
            if user.role == UserRole.ETUDIANT and user_id != etudiant_id:
                api.abort(
                    403, "Vous ne pouvez voir que vos propres statistiques")

            stats = resultat_service.get_statistiques_etudiant(etudiant_id)
            return stats, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération statistiques étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


# Modèles pour les nouveaux endpoints formatés frontend
etudiant_stats_model = api.model('EtudiantStats', {
    'examens_passes': fields.Integer(description='Nombre d\'examens passés'),
    'examens_en_attente': fields.Integer(description='Nombre d\'examens en attente'),
    'moyenne_generale': fields.Float(description='Moyenne générale'),
    'taux_reussite': fields.Float(description='Taux de réussite en %'),
    'meilleure_note': fields.Float(description='Meilleure note obtenue'),
    'moins_bonne_note': fields.Float(description='Moins bonne note obtenue')
})

recent_result_model = api.model('RecentResult', {
    'id': fields.String(description='ID du résultat'),
    'examen_titre': fields.String(description='Titre de l\'examen'),
    'matiere': fields.String(description='Matière'),
    'note': fields.Float(description='Note obtenue'),
    'note_max': fields.Float(description='Note maximale'),
    'pourcentage': fields.Float(description='Pourcentage'),
    'statut': fields.String(description='Statut', enum=['en_attente', 'corrige']),
    'date_passage': fields.String(description='Date de passage'),
    'feedback': fields.String(description='Feedback')
})

resultat_simple_model = api.model('ResultatSimple', {
    'id': fields.String(description='ID du résultat'),
    'examen_titre': fields.String(description='Titre de l\'examen'),
    'matiere': fields.String(description='Matière'),
    'note': fields.Float(description='Note obtenue'),
    'note_max': fields.Float(description='Note maximale'),
    'pourcentage': fields.Float(description='Pourcentage'),
    'date_passage': fields.String(description='Date de passage'),
    'statut': fields.String(description='Statut', enum=['en_attente', 'corrige'])
})

historique_statistiques_model = api.model('HistoriqueStatistiques', {
    'moyenne_generale': fields.Float(description='Moyenne générale'),
    'meilleure_note': fields.Float(description='Meilleure note'),
    'moins_bonne_note': fields.Float(description='Moins bonne note'),
    'total_examens': fields.Integer(description='Total d\'examens'),
    'taux_reussite': fields.Float(description='Taux de réussite en %')
})

historique_notes_model = api.model('HistoriqueNotes', {
    'resultats': fields.List(fields.Nested(resultat_simple_model), description='Liste des résultats'),
    'statistiques': fields.Nested(historique_statistiques_model, description='Statistiques')
})


@api.route('/etudiant/<string:etudiant_id>/stats')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantStats(Resource):
    @api.doc('get_etudiant_stats', security='Bearer')
    @api.marshal_with(etudiant_stats_model)
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les statistiques formatées pour le dashboard étudiant"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            # Étudiant ne peut voir que ses stats
            if user.role == UserRole.ETUDIANT and user_id != etudiant_id:
                api.abort(
                    403, "Vous ne pouvez voir que vos propres statistiques")

            stats = resultat_service.get_stats_etudiant_format(etudiant_id)
            return stats, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération stats étudiant formatées: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/etudiant/<string:etudiant_id>/recent')
@api.param('etudiant_id', 'ID de l\'étudiant')
class RecentResultats(Resource):
    @api.doc('get_recent_resultats', security='Bearer')
    @api.param('limit', 'Nombre de résultats à retourner', type='integer', default=10)
    @api.marshal_list_with(recent_result_model)
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les résultats récents formatés pour le dashboard étudiant"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            # Étudiant ne peut voir que ses résultats
            if user.role == UserRole.ETUDIANT and user_id != etudiant_id:
                api.abort(403, "Vous ne pouvez voir que vos propres résultats")

            limit = request.args.get('limit', 10, type=int)
            resultats = resultat_service.get_recent_resultats(
                etudiant_id, limit=limit)
            return resultats, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération résultats récents: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/etudiant/<string:etudiant_id>/historique')
@api.param('etudiant_id', 'ID de l\'étudiant')
class HistoriqueComplet(Resource):
    @api.doc('get_historique_complet', security='Bearer')
    @api.marshal_with(historique_notes_model)
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère l'historique complet avec statistiques formaté pour le frontend"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)

            # Étudiant ne peut voir que son historique
            if user.role == UserRole.ETUDIANT and user_id != etudiant_id:
                api.abort(403, "Vous ne pouvez voir que votre propre historique")

            historique = resultat_service.get_historique_complet(etudiant_id)
            return historique, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération historique complet: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


# Endpoints de publication
@api.route('/<string:resultat_id>/publier')
@api.param('resultat_id', 'ID du résultat')
class PublierResultat(Resource):
    @api.doc('publier_resultat', security='Bearer')
    @api.marshal_with(resultat_model)
    @jwt_required()
    def post(self, resultat_id):
        """Publie un résultat individuel (enseignant uniquement)"""
        try:
            require_admin_or_teacher()
            resultat = resultat_service.publier_resultat(resultat_id)
            return resultat, 200
        except ValueError as e:
            logger.warning(f"Erreur validation publication: {e}")
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur publication résultat: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:resultat_id>/depublier')
@api.param('resultat_id', 'ID du résultat')
class DepublierResultat(Resource):
    @api.doc('depublier_resultat', security='Bearer')
    @api.marshal_with(resultat_model)
    @jwt_required()
    def post(self, resultat_id):
        """Dépublie un résultat individuel (enseignant uniquement)"""
        try:
            require_admin_or_teacher()
            resultat = resultat_service.depublier_resultat(resultat_id)
            return resultat, 200
        except ValueError as e:
            logger.warning(f"Erreur validation dépublication: {e}")
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur dépublication résultat: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


publication_session_response = api.model('PublicationSessionResponse', {
    'session_id': fields.String(description='ID de la session'),
    'total_resultats': fields.Integer(description='Nombre total de résultats'),
    'resultats_termines': fields.Integer(description='Nombre de résultats terminés'),
    'resultats_publies': fields.Integer(description='Nombre de résultats publiés'),
    'message': fields.String(description='Message de confirmation')
})


@api.route('/session/<string:session_id>/publier-tous')
@api.param('session_id', 'ID de la session')
class PublierResultatsSession(Resource):
    @api.doc('publier_resultats_session', security='Bearer')
    @api.marshal_with(publication_session_response)
    @jwt_required()
    def post(self, session_id):
        """Publie tous les résultats terminés d'une session (enseignant uniquement)"""
        try:
            require_admin_or_teacher()
            result = resultat_service.publier_resultats_session(session_id)
            return result, 200
        except ValueError as e:
            logger.warning(f"Erreur validation publication session: {e}")
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur publication résultats session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


# Endpoints d'export PDF
@api.route('/<string:resultat_id>/export-pdf')
@api.param('resultat_id', 'ID du résultat')
class ExportPDFResultat(Resource):
    @api.doc('export_pdf_resultat', security='Bearer')
    @jwt_required()
    def get(self, resultat_id):
        """Exporte un résultat individuel en PDF (enseignant uniquement)"""
        try:
            from flask import send_file
            from app.services.pdf_service import PDFService
            
            require_admin_or_teacher()
            
            pdf_service = PDFService()
            pdf_buffer = pdf_service.generer_pdf_resultat_individuel(resultat_id)
            
            # Récupérer des infos pour le nom du fichier
            resultat = resultat_service.get_resultat_by_id(resultat_id)
            etudiant_name = resultat.get('etudiant', {}).get('name', 'etudiant').replace(' ', '_')
            session_titre = resultat.get('session', {}).get('titre', 'examen').replace(' ', '_')
            filename = f"resultat_{etudiant_name}_{session_titre}.pdf"
            
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=filename
            )
        except ValueError as e:
            logger.warning(f"Erreur validation export PDF: {e}")
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur export PDF résultat: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/session/<string:session_id>/export-pdf')
@api.param('session_id', 'ID de la session')
class ExportPDFSession(Resource):
    @api.doc('export_pdf_session', security='Bearer')
    @jwt_required()
    def get(self, session_id):
        """Exporte le récapitulatif d'une session en PDF (enseignant uniquement)"""
        try:
            from flask import send_file
            from app.services.pdf_service import PDFService
            from app.repositories.session_examen_repository import SessionExamenRepository
            
            require_admin_or_teacher()
            
            logger.info(f"Début export PDF pour session {session_id}")
            
            pdf_service = PDFService()
            pdf_buffer = pdf_service.generer_pdf_recapitulatif_session(session_id)
            
            logger.info(f"PDF généré avec succès pour session {session_id}")
            
            # Récupérer le titre de la session pour le nom du fichier
            session_repo = SessionExamenRepository()
            session = session_repo.get_by_id(session_id)
            session_titre = session.titre.replace(' ', '_') if session else 'session'
            filename = f"recapitulatif_{session_titre}.pdf"
            
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=filename
            )
        except ValueError as e:
            logger.warning(f"Erreur validation export PDF session: {e}")
            logger.warning(traceback.format_exc())
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur export PDF session: {e}", exc_info=True)
            logger.error(traceback.format_exc())
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:resultat_id>/details-etudiant')
@api.param('resultat_id', 'ID du résultat')
class DetailsEtudiant(Resource):
    @api.doc('get_details_etudiant', security='Bearer')
    @jwt_required()
    def get(self, resultat_id):
        """Récupère les détails complets d'un étudiant pour un résultat (enseignant uniquement)"""
        try:
            require_admin_or_teacher()
            
            # Récupérer le résultat avec tous les détails
            resultat = resultat_service.get_resultat_by_id(resultat_id, include_details=True)
            if not resultat:
                api.abort(404, "Résultat non trouvé")
            
            # Récupérer les infos complètes de l'étudiant
            etudiant_id = resultat.get('etudiantId')
            etudiant = user_repo.get_by_id(etudiant_id)
            if not etudiant:
                api.abort(404, "Étudiant non trouvé")
            
            # Construire la réponse avec toutes les infos
            response = {
                'resultat': resultat,
                'etudiant': etudiant.to_dict(include_profil=True)
            }
            
            return response, 200
        except ValueError as e:
            logger.warning(f"Erreur validation détails étudiant: {e}")
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur récupération détails étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
