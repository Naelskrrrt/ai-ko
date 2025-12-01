"""
Routes API pour la gestion des Sessions d'Examen
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.session_examen_service import SessionExamenService
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
import logging

logger = logging.getLogger(__name__)

# Namespace pour l'API
api = Namespace(
    'sessions', description='Opérations sur les sessions d\'examen')

# Modèles pour la documentation Swagger
qcm_ref = api.model('QCMRef', {
    'id': fields.String(description='ID du QCM'),
    'titre': fields.String(description='Titre du QCM')
})

classe_ref = api.model('ClasseRef', {
    'id': fields.String(description='ID de la classe'),
    'code': fields.String(description='Code de la classe'),
    'nom': fields.String(description='Nom de la classe')
})

session_model = api.model('SessionExamen', {
    'id': fields.String(description='ID de la session'),
    'titre': fields.String(required=True, description='Titre de la session'),
    'description': fields.String(description='Description'),
    'dateDebut': fields.String(required=True, description='Date de début (ISO 8601)'),
    'dateFin': fields.String(required=True, description='Date de fin (ISO 8601)'),
    'dureeMinutes': fields.Integer(required=True, description='Durée en minutes'),
    'tentativesMax': fields.Integer(description='Nombre maximum de tentatives', default=1),
    'melangeQuestions': fields.Boolean(description='Mélanger les questions', default=True),
    'melangeOptions': fields.Boolean(description='Mélanger les options', default=True),
    'afficherCorrection': fields.Boolean(description='Afficher la correction', default=True),
    'notePassage': fields.Float(description='Note de passage', default=10.0),
    'status': fields.String(description='Statut', enum=['programmee', 'en_cours', 'en_pause', 'terminee', 'annulee']),
    'resultatsPublies': fields.Boolean(description='Résultats publiés', default=False),
    'matiere': fields.String(description='Matière récupérée depuis le QCM associé'),
    'qcmId': fields.String(required=True, description='ID du QCM'),
    'qcm': fields.Nested(qcm_ref, description='Informations du QCM'),
    'classeId': fields.String(description='ID de la classe (optionnel)'),
    'classe': fields.Nested(classe_ref, description='Informations de la classe'),
    'createurId': fields.String(description='ID du créateur'),
    'nombreParticipants': fields.Integer(description='Nombre de participants'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

# Modèle pour la réponse paginée
session_list_response = api.model('SessionListResponse', {
    'data': fields.List(fields.Nested(session_model), description='Liste des sessions'),
    'total': fields.Integer(description='Nombre total de sessions'),
    'skip': fields.Integer(description='Nombre d\'éléments sautés'),
    'limit': fields.Integer(description='Nombre d\'éléments retournés')
})

session_create_model = api.model('SessionExamenCreate', {
    'titre': fields.String(required=True, description='Titre de la session'),
    'description': fields.String(description='Description'),
    'dateDebut': fields.String(required=True, description='Date de début (ISO 8601)', example='2025-01-25T10:00:00Z'),
    'dateFin': fields.String(required=True, description='Date de fin (ISO 8601)', example='2025-01-25T12:00:00Z'),
    'dureeMinutes': fields.Integer(required=True, description='Durée en minutes', example=120),
    'tentativesMax': fields.Integer(description='Nombre maximum de tentatives', default=1),
    'melangeQuestions': fields.Boolean(description='Mélanger les questions', default=True),
    'melangeOptions': fields.Boolean(description='Mélanger les options', default=True),
    'afficherCorrection': fields.Boolean(description='Afficher la correction', default=True),
    'notePassage': fields.Float(description='Note de passage', default=10.0),
    'status': fields.String(description='Statut', enum=['programmee', 'en_cours', 'terminee', 'annulee'], default='programmee'),
    'qcmId': fields.String(required=True, description='ID du QCM'),
    'classeId': fields.String(description='ID de la classe (optionnel)'),
    'niveauId': fields.String(description='ID du niveau académique (optionnel)'),
    'mentionId': fields.String(description='ID de la mention académique (optionnel)'),
    'parcoursId': fields.String(description='ID du parcours académique (optionnel)')
})

# Service
session_service = SessionExamenService()
user_repo = UserRepository()


def require_admin_or_teacher():
    """Vérifie que l'utilisateur est admin ou enseignant"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role not in [UserRole.ADMIN, UserRole.ENSEIGNANT]:
        api.abort(403, "Accès réservé aux administrateurs et enseignants")
    return user


@api.route('')
class SessionList(Resource):
    @api.doc('list_sessions', security='Bearer')
    @api.param('skip', 'Nombre d\'éléments à sauter', type='integer', default=0)
    @api.param('limit', 'Nombre d\'éléments à retourner', type='integer', default=100)
    @api.param('status', 'Filtrer par statut', type='string')
    @api.param('qcm_id', 'Filtrer par QCM', type='string')
    @api.param('classe_id', 'Filtrer par classe', type='string')
    @api.marshal_with(session_list_response)
    @jwt_required()
    def get(self):
        """Liste toutes les sessions avec pagination"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            skip = request.args.get('skip', 0, type=int)
            limit = request.args.get('limit', 100, type=int)
            status = request.args.get('status')
            qcm_id = request.args.get('qcm_id')
            classe_id = request.args.get('classe_id')

            filters = {}
            if status:
                filters['status'] = status
            if qcm_id:
                filters['qcm_id'] = qcm_id
            if classe_id:
                filters['classe_id'] = classe_id
            
            # Pour les enseignants, filtrer par createur_id pour ne voir que leurs sessions
            # Les admins peuvent voir toutes les sessions
            if user and user.role == UserRole.ENSEIGNANT:
                filters['createur_id'] = user_id

            sessions, total = session_service.get_all_sessions(
                skip=skip, limit=limit, filters=filters)

            return {
                'data': sessions,
                'total': total,
                'skip': skip,
                'limit': limit
            }, 200

        except Exception as e:
            logger.error(f"Erreur récupération sessions: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_session', security='Bearer')
    @api.expect(session_create_model)
    @api.marshal_with(session_model, code=201)
    @jwt_required()
    def post(self):
        """Crée une nouvelle session (admin/enseignant)"""
        try:
            user = require_admin_or_teacher()
            data = request.get_json()
            session = session_service.create_session(data, user.id)
            return session, 201
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:session_id>')
@api.param('session_id', 'ID de la session')
class SessionDetail(Resource):
    @api.doc('get_session', security='Bearer')
    @api.param('format', 'Format de réponse: "examen" pour format frontend, "session" pour format standard', type='string', default='session')
    @jwt_required()
    def get(self, session_id):
        """Récupère une session par son ID"""
        try:
            format_type = request.args.get('format', 'session')
            
            if format_type == 'examen':
                # Retourner le format examen pour le frontend
                user_id = get_jwt_identity()
                from app.repositories.resultat_repository import ResultatRepository
                from app.repositories.qcm_repository import QCMRepository
                from datetime import datetime
                
                session = session_service.session_repo.get_by_id(session_id)
                if not session:
                    api.abort(404, f"Session {session_id} non trouvée")
                
                qcm_repo = QCMRepository()
                resultat_repo = ResultatRepository()
                qcm = qcm_repo.get_by_id(session.qcm_id)
                if not qcm:
                    api.abort(404, "QCM associé non trouvé")
                
                nombre_questions = len(qcm.questions) if qcm.questions else 0
                total_points = sum([q.points for q in qcm.questions]) if qcm.questions else 0
                
                nb_tentatives = resultat_repo.count_tentatives(user_id, session_id)
                # NOTE: tentatives_restantes désactivé temporairement (pas de limite)
                tentatives_restantes = 999  # Valeur arbitraire élevée pour indiquer "illimité"
                
                now = datetime.utcnow()
                resultats_etudiant = resultat_repo.get_by_etudiant(user_id)
                resultats_session = [r for r in resultats_etudiant if r.session_id == session.id]
                
                # Vérifier s'il y a un résultat terminé (priorité)
                resultat_termine = next(
                    (r for r in resultats_session if r.status == 'termine'), None)
                
                if session.status == 'terminee':
                    statut = 'termine'
                elif resultat_termine:
                    statut = 'termine'
                else:
                    # Vérifier s'il y a un résultat en cours
                    resultat_en_cours = next(
                        (r for r in resultats_session if r.status == 'en_cours'), None)
                    
                    if resultat_en_cours:
                        statut = 'en_cours'
                    elif session.date_debut > now:
                        statut = 'disponible'
                    else:
                        statut = 'disponible'
                
                niveau = 'Non spécifié'
                if session.classe and session.classe.niveau:
                    niveau = session.classe.niveau.nom
                
                examen_formate = {
                    'id': session.id,
                    'titre': session.titre,
                    'description': session.description,
                    'matiere': qcm.matiere if qcm else 'Non spécifiée',
                    'niveau': niveau,
                    'dateDebut': session.date_debut.isoformat() if session.date_debut else None,
                    'dateFin': session.date_fin.isoformat() if session.date_fin else None,
                    'dureeMinutes': session.duree_minutes,
                    'nombreQuestions': nombre_questions,
                    'totalPoints': total_points,
                    'statut': statut,
                    'tentatives_restantes': max(0, tentatives_restantes),
                    'qcm': {
                        'id': qcm.id,
                        'titre': qcm.titre,
                        'matiere': qcm.matiere
                    } if qcm else None,
                    'classe': {
                        'id': session.classe.id,
                        'code': session.classe.code,
                        'nom': session.classe.nom,
                        'niveau': {
                            'nom': session.classe.niveau.nom
                        } if session.classe.niveau else None
                    } if session.classe else None
                }
                return examen_formate, 200
            else:
                # Format standard
                session = session_service.get_session_by_id(session_id)
                if not session:
                    api.abort(404, f"Session {session_id} non trouvée")
                return session, 200
        except Exception as e:
            logger.error(f"Erreur récupération session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_session', security='Bearer')
    @api.expect(session_create_model)
    @api.marshal_with(session_model)
    @jwt_required()
    def put(self, session_id):
        """Met à jour une session (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            user_id = get_jwt_identity()
            data = request.get_json()
            session = session_service.update_session(session_id, data, user_id)
            return session, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_session', security='Bearer')
    @jwt_required()
    def delete(self, session_id):
        """Supprime une session (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            user_id = get_jwt_identity()
            session_service.delete_session(session_id, user_id)
            return {'message': 'Session supprimée avec succès'}, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:session_id>/demarrer')
@api.param('session_id', 'ID de la session')
class SessionDemarrer(Resource):
    @api.doc('demarrer_session', security='Bearer')
    @api.marshal_with(session_model)
    @jwt_required()
    def patch(self, session_id):
        """Démarre une session (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            session = session_service.demarrer_session(session_id)
            return session, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur démarrage session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:session_id>/terminer')
@api.param('session_id', 'ID de la session')
class SessionTerminer(Resource):
    @api.doc('terminer_session', security='Bearer')
    @api.marshal_with(session_model)
    @jwt_required()
    def patch(self, session_id):
        """Termine une session (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            session = session_service.terminer_session(session_id)
            return session, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur terminaison session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:session_id>/pause')
@api.param('session_id', 'ID de la session')
class SessionPause(Resource):
    @api.doc('pause_session', security='Bearer')
    @api.marshal_with(session_model)
    @jwt_required()
    def patch(self, session_id):
        """Met une session en pause (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            session = session_service.mettre_en_pause(session_id)
            return session, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise en pause session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:session_id>/reprendre')
@api.param('session_id', 'ID de la session')
class SessionReprendre(Resource):
    @api.doc('reprendre_session', security='Bearer')
    @api.marshal_with(session_model)
    @jwt_required()
    def patch(self, session_id):
        """Reprend une session en pause (admin/enseignant)"""
        try:
            require_admin_or_teacher()
            session = session_service.reprendre_session(session_id)
            return session, 200
        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur reprise session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/disponibles')
class SessionsDisponibles(Resource):
    @api.doc('get_sessions_disponibles', security='Bearer')
    @api.param('format', 'Format de réponse: "examen" pour format frontend, "session" pour format standard', type='string', default='examen')
    @jwt_required()
    def get(self):
        """Récupère les sessions disponibles pour l'étudiant connecté"""
        try:
            user_id = get_jwt_identity()
            format_type = request.args.get('format', 'examen')

            if format_type == 'examen':
                # Format Examen[] pour le frontend
                sessions = session_service.get_sessions_disponibles_format(
                    user_id)
                return sessions, 200
            else:
                # Format Session standard
                sessions = session_service.get_sessions_disponibles(user_id)
                return sessions, 200
        except Exception as e:
            logger.error(
                f"Erreur récupération sessions disponibles: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:session_id>/questions')
@api.param('session_id', 'ID de la session')
class SessionQuestions(Resource):
    @api.doc('get_session_questions', security='Bearer')
    @jwt_required()
    def get(self, session_id):
        """Récupère les questions d'une session formatées pour le frontend"""
        try:
            from app.repositories.question_repository import QuestionRepository
            import random

            user_id = get_jwt_identity()

            # Récupérer la session
            session = session_service.get_session_by_id(session_id)
            if not session:
                api.abort(404, f"Session {session_id} non trouvée")

            # Récupérer le QCM
            from app.repositories.qcm_repository import QCMRepository
            qcm_repo = QCMRepository()
            qcm = qcm_repo.get_by_id(session['qcmId'])
            if not qcm:
                api.abort(404, "QCM non trouvé")

            # Récupérer les questions
            question_repo = QuestionRepository()
            questions = question_repo.get_by_qcm(session['qcmId'])

            # Mélanger les questions si configuré
            if session.get('melangeQuestions', False):
                questions = list(questions)
                random.shuffle(questions)

            # Formater les questions pour le frontend
            questions_formatees = []
            for idx, q in enumerate(questions):
                question_dict = q.to_dict()

                # Mélanger les options si configuré et extraire les textes
                options_raw = question_dict.get('options', [])
                if session.get('melangeOptions', False) and isinstance(options_raw, list):
                    options_raw = list(options_raw)
                    random.shuffle(options_raw)

                # Extraire les textes des options (peuvent être des objets ou des strings)
                # IMPORTANT: Ne pas inclure d'information sur les réponses correctes pendant l'examen
                options_textes = []
                if isinstance(options_raw, list):
                    for opt in options_raw:
                        if isinstance(opt, str):
                            options_textes.append(opt)
                        elif isinstance(opt, dict):
                            # Extraire SEULEMENT le texte de l'objet, sans estCorrecte
                            texte = opt.get('texte') or opt.get(
                                'text') or str(opt)
                            options_textes.append(texte)

                # Formater selon le type frontend
                # IMPORTANT: Ne pas inclure reponseCorrecte ou toute information sur les bonnes réponses
                question_formatee = {
                    'id': question_dict['id'],
                    'numero': idx + 1,
                    'enonce': question_dict['enonce'],
                    'type_question': question_dict.get('typeQuestion', question_dict.get('type_question', 'qcm')),
                    'options': options_textes,
                    'points': question_dict['points'],
                    'aide': question_dict.get('explication')
                    # Ne PAS inclure: 'reponseCorrecte', 'reponse_correcte', ou toute info sur les bonnes réponses
                }

                # Pour vrai/faux, créer des options
                if question_formatee['type_question'] == 'vrai_faux':
                    question_formatee['options'] = ['Vrai', 'Faux']

                questions_formatees.append(question_formatee)

            return {
                'session_id': session_id,
                'questions': questions_formatees,
                'total': len(questions_formatees)
            }, 200

        except Exception as e:
            logger.error(
                f"Erreur récupération questions session: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
