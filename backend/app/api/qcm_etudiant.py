"""
Routes API pour les QCMs côté étudiant
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.qcm_etudiant_service import QCMEtudiantService
from app.repositories.user_repository import UserRepository
from app.services.matiere_service import MatiereService
from app.models.user import UserRole
from app.models.matiere import Matiere
from app import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

api = Namespace('qcm-etudiant', description='QCMs disponibles pour les étudiants')

qcm_etudiant_model = api.model('QCMEtudiant', {
    'id': fields.String(description='ID du QCM'),
    'titre': fields.String(description='Titre du QCM'),
    'description': fields.String(description='Description'),
    'duree': fields.Integer(description='Durée en minutes'),
    'matiere': fields.String(description='Matière'),
    'matiereId': fields.String(description='ID de la matière'),
    'difficultyLevel': fields.String(description='Niveau de difficulté'),
    'nombreQuestions': fields.Integer(description='Nombre de questions'),
    'createdAt': fields.String(description='Date de création'),
})

matiere_model = api.model('Matiere', {
    'id': fields.String(description='ID de la matière'),
    'code': fields.String(description='Code de la matière'),
    'nom': fields.String(description='Nom de la matière'),
    'description': fields.String(description='Description'),
    'couleur': fields.String(description='Couleur hex'),
    'icone': fields.String(description='Nom de l\'icône'),
})

update_matieres_model = api.model('UpdateMatieres', {
    'matieres_ids': fields.List(fields.String, required=True, description='Liste des IDs de matières'),
    'annee_scolaire': fields.String(description='Année scolaire', default='2024-2025'),
})

qcm_service = QCMEtudiantService()
user_repo = UserRepository()
matiere_service = MatiereService()


@api.route('/disponibles')
class QCMsDisponibles(Resource):
    @api.doc('get_qcms_disponibles', security='Bearer')
    @api.marshal_list_with(qcm_etudiant_model)
    @jwt_required()
    def get(self):
        """Récupère les QCMs publiés disponibles pour l'étudiant connecté"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                api.abort(403, "Accès réservé aux étudiants")
            
            qcms = qcm_service.get_qcms_disponibles(user_id)
            return qcms, 200
            
        except Exception as e:
            logger.error(f"Erreur récupération QCMs disponibles: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:qcm_id>')
@api.param('qcm_id', 'ID du QCM')
class GetQCM(Resource):
    @api.doc('get_qcm', security='Bearer')
    @jwt_required()
    def get(self, qcm_id):
        """Récupère un QCM par son ID"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                return {'message': "Accès réservé aux étudiants"}, 403
            
            # Vérifier l'accès au QCM
            if not qcm_service.can_access_qcm(qcm_id, user_id):
                return {'message': "Vous n'avez pas accès à ce QCM"}, 403
            
            # Récupérer le QCM
            from app.repositories.qcm_repository import QCMRepository
            qcm_repo = QCMRepository()
            qcm = qcm_repo.get_by_id(qcm_id)
            if not qcm:
                return {'message': "QCM non trouvé"}, 404
            
            return qcm.to_dict(), 200
            
        except Exception as e:
            logger.error(f"Erreur récupération QCM: {e}", exc_info=True)
            return {'message': f"Erreur interne: {str(e)}"}, 500


@api.route('/<string:qcm_id>/acces')
@api.param('qcm_id', 'ID du QCM')
class VerifierAcces(Resource):
    @api.doc('verifier_acces_qcm', security='Bearer')
    @jwt_required()
    def get(self, qcm_id):
        """Vérifie si l'étudiant peut accéder à un QCM"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                return {'canAccess': False}, 403
            
            can_access = qcm_service.can_access_qcm(qcm_id, user_id)
            return {'canAccess': can_access}, 200
            
        except Exception as e:
            logger.error(f"Erreur vérification accès: {e}", exc_info=True)
            return {'canAccess': False, 'message': f"Erreur interne: {str(e)}"}, 500


start_qcm_model = api.model('StartQCM', {
    'questions': fields.List(fields.Raw(), description='Liste des questions formatées'),
    'duree_restante_secondes': fields.Integer(description='Durée restante en secondes'),
    'resultat_id': fields.String(description='ID du résultat créé'),
    'date_debut': fields.String(description='Date de début'),
})

submit_qcm_request_model = api.model('SubmitQCMRequest', {
    'resultat_id': fields.String(required=True, description='ID du résultat'),
    'reponses': fields.Raw(required=True, description='Dictionnaire des réponses (question_id: reponse)'),
})

submit_qcm_response_model = api.model('SubmitQCMResponse', {
    'resultat_id': fields.String(description='ID du résultat'),
    'score_total': fields.Float(description='Score total'),
    'score_maximum': fields.Float(description='Score maximum'),
    'pourcentage': fields.Float(description='Pourcentage de réussite'),
    'questions_correctes': fields.Integer(description='Nombre de questions correctes'),
    'questions_total': fields.Integer(description='Nombre total de questions'),
})


@api.route('/<string:qcm_id>/demarrer')
@api.param('qcm_id', 'ID du QCM')
class DemarrerQCM(Resource):
    @api.doc('demarrer_qcm', security='Bearer')
    @api.marshal_with(start_qcm_model)
    @jwt_required()
    def post(self, qcm_id):
        """Démarre un QCM libre (sans session d'examen)"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                return {'message': "Accès réservé aux étudiants"}, 403
            
            # Vérifier l'accès au QCM
            if not qcm_service.can_access_qcm(qcm_id, user_id):
                return {'message': "Vous n'avez pas accès à ce QCM"}, 403
            
            # Récupérer le QCM
            from app.repositories.qcm_repository import QCMRepository
            qcm_repo = QCMRepository()
            qcm = qcm_repo.get_by_id(qcm_id)
            if not qcm:
                return {'message': "QCM non trouvé"}, 404
            
            if qcm.status != 'published':
                return {'message': "Ce QCM n'est pas publié"}, 400
            
            # Vérifier qu'il y a des questions
            questions = list(qcm.questions) if qcm.questions else []
            if not questions:
                return {'message': "Ce QCM ne contient aucune question"}, 400
            
            # Calculer le score maximum
            score_maximum = sum([q.points for q in questions])
            
            # Créer un résultat pour ce QCM libre
            from app.models.resultat import Resultat
            from app import db
            from datetime import datetime
            
            # Créer un résultat avec session_id = None (QCM libre, pas de session d'examen)
            resultat = Resultat(
                etudiant_id=user_id,
                session_id=None,  # QCM libre, pas de session
                qcm_id=qcm_id,
                numero_tentative=1,
                date_debut=datetime.utcnow(),
                questions_total=len(questions),
                score_maximum=score_maximum,
                status='en_cours'
            )
            
            db.session.add(resultat)
            db.session.commit()
            
            # Formater les questions pour le frontend
            from app.services.resultat_service import ResultatService
            resultat_service = ResultatService()
            questions_formatees = []
            for idx, question in enumerate(questions):
                q_dict = question.to_dict()
                
                # Extraire les textes des options (peuvent être des objets ou des strings)
                # IMPORTANT: Ne pas inclure d'information sur les réponses correctes pendant le QCM
                options_raw = q_dict.get('options', [])
                options_textes = []
                if isinstance(options_raw, list):
                    for opt in options_raw:
                        if isinstance(opt, str):
                            options_textes.append(opt)
                        elif isinstance(opt, dict):
                            # Extraire SEULEMENT le texte de l'objet, sans estCorrecte
                            texte = opt.get('texte') or opt.get('text') or str(opt)
                            options_textes.append(texte)
                
                # Pour vrai/faux, créer des options
                type_question = q_dict.get('type_question') or q_dict.get('typeQuestion', 'qcm')
                if type_question == 'vrai_faux':
                    options_textes = ['Vrai', 'Faux']
                
                questions_formatees.append({
                    'id': q_dict['id'],
                    'enonce': q_dict['enonce'],
                    'type_question': type_question,
                    'options': options_textes,
                    'points': q_dict.get('points', 1),
                    'ordre': idx + 1,
                })
            
            # Calculer la durée en secondes
            duree_secondes = (qcm.duree * 60) if qcm.duree else 0
            
            return {
                'questions': questions_formatees,
                'duree_restante_secondes': duree_secondes,
                'resultat_id': resultat.id,
                'date_debut': resultat.date_debut.isoformat(),
            }, 200
            
        except Exception as e:
            logger.error(f"Erreur démarrage QCM: {e}", exc_info=True)
            import traceback
            logger.error(traceback.format_exc())
            return {'message': f"Erreur interne: {str(e)}"}, 500


@api.route('/<string:qcm_id>/soumettre')
@api.param('qcm_id', 'ID du QCM')
class SoumettreQCM(Resource):
    @api.doc('soumettre_qcm', security='Bearer')
    @api.expect(submit_qcm_request_model)
    @api.marshal_with(submit_qcm_response_model)
    @jwt_required()
    def post(self, qcm_id):
        """Soumet les réponses d'un QCM libre"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                return {'message': "Accès réservé aux étudiants"}, 403
            
            data = request.get_json()
            resultat_id = data.get('resultat_id')
            reponses = data.get('reponses', {})
            
            if not resultat_id:
                return {'message': "resultat_id est requis"}, 400
            
            # Vérifier que le résultat appartient à l'étudiant
            from app.repositories.resultat_repository import ResultatRepository
            resultat_repo = ResultatRepository()
            resultat = resultat_repo.get_by_id(resultat_id)
            
            if not resultat:
                return {'message': "Résultat non trouvé"}, 404
            
            if resultat.etudiant_id != user_id:
                return {'message': "Vous ne pouvez pas soumettre ce résultat"}, 403
            
            if resultat.qcm_id != qcm_id:
                return {'message': "Le résultat ne correspond pas au QCM"}, 400
            
            # Utiliser le service de résultat pour corriger
            from app.services.resultat_service import ResultatService
            resultat_service = ResultatService()
            resultat_dict = resultat_service.soumettre_reponses(resultat_id, reponses)
            
            return {
                'resultat_id': resultat_id,
                'score_total': resultat_dict.get('scoreTotal', 0),
                'score_maximum': resultat_dict.get('scoreMaximum', 0),
                'pourcentage': resultat_dict.get('pourcentage', 0),
                'questions_correctes': resultat_dict.get('questionsCorrectes', 0),
                'questions_total': resultat_dict.get('questionsTotal', 0),
            }, 200
            
        except ValueError as e:
            return {'message': str(e)}, 400
        except Exception as e:
            logger.error(f"Erreur soumission QCM: {e}", exc_info=True)
            import traceback
            logger.error(traceback.format_exc())
            return {'message': f"Erreur interne: {str(e)}"}, 500


@api.route('/resultat/<string:resultat_id>')
@api.param('resultat_id', 'ID du résultat')
class GetQCMResultat(Resource):
    @api.doc('get_qcm_resultat', security='Bearer')
    @jwt_required()
    def get(self, resultat_id):
        """Récupère le résultat détaillé d'un QCM libre"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                return {'message': "Accès réservé aux étudiants"}, 403
            
            # Récupérer le résultat
            from app.repositories.resultat_repository import ResultatRepository
            from app.services.resultat_service import ResultatService
            resultat_repo = ResultatRepository()
            resultat_service = ResultatService()
            
            resultat = resultat_repo.get_by_id(resultat_id)
            if not resultat:
                return {'message': "Résultat non trouvé"}, 404
            
            # Vérifier que le résultat appartient à l'étudiant
            if resultat.etudiant_id != user_id:
                return {'message': "Vous n'avez pas accès à ce résultat"}, 403
            
            # Vérifier que c'est un QCM libre (session_id est None)
            if resultat.session_id is not None:
                return {'message': "Ce résultat n'est pas un QCM libre"}, 400
            
            # Récupérer le résultat avec les détails
            resultat_dict = resultat_service.get_resultat_by_id(resultat_id, include_details=True)
            if not resultat_dict:
                return {'message': "Résultat non trouvé"}, 404
            
            return resultat_dict, 200
            
        except Exception as e:
            logger.error(f"Erreur récupération résultat QCM: {e}", exc_info=True)
            import traceback
            logger.error(traceback.format_exc())
            return {'message': f"Erreur interne: {str(e)}"}, 500


@api.route('/matieres')
class MatieresEtudiant(Resource):
    @api.doc('get_matieres_etudiant', security='Bearer')
    @api.marshal_list_with(matiere_model)
    @jwt_required()
    def get(self):
        """Récupère toutes les matières disponibles (actives)"""
        try:
            matieres = matiere_service.get_all_matieres(actives_seulement=True)
            return matieres, 200
        except Exception as e:
            logger.error(f"Erreur récupération matières: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/matieres/mes-matieres')
class MesMatieres(Resource):
    @api.doc('get_mes_matieres', security='Bearer')
    @api.marshal_list_with(matiere_model)
    @jwt_required()
    def get(self):
        """Récupère les matières suivies par l'étudiant connecté"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                api.abort(403, "Accès réservé aux étudiants")
            
            # Récupérer le profil étudiant
            if not user.etudiant_profil:
                return [], 200  # Pas de profil étudiant, retourner liste vide
            
            etudiant = user.etudiant_profil
            # Récupérer les matières via la relation many-to-many (etudiant_matieres_v2)
            matieres = [m.to_dict() for m in etudiant.matieres.filter(Matiere.actif == True).all()]
            return matieres, 200
        except Exception as e:
            logger.error(f"Erreur récupération matières étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_mes_matieres', security='Bearer')
    @api.expect(update_matieres_model)
    @jwt_required()
    def put(self):
        """Met à jour les matières suivies par l'étudiant connecté"""
        try:
            user_id = get_jwt_identity()
            user = user_repo.get_by_id(user_id)
            
            if not user or user.role != UserRole.ETUDIANT:
                api.abort(403, "Accès réservé aux étudiants")
            
            # Récupérer le profil étudiant
            if not user.etudiant_profil:
                api.abort(404, "Profil étudiant non trouvé")
            
            etudiant = user.etudiant_profil
            data = request.get_json()
            matieres_ids = data.get('matieres_ids', [])
            annee_scolaire = data.get('annee_scolaire', '2024-2025')
            
            # Vérifier que toutes les matières existent et sont actives
            from app.repositories.matiere_repository import MatiereRepository
            matiere_repo = MatiereRepository()
            
            matieres_valides = []
            for matiere_id in matieres_ids:
                matiere = matiere_repo.get_by_id(matiere_id)
                if matiere and matiere.actif:
                    matieres_valides.append(matiere)
            
            # Supprimer toutes les associations existantes pour cet étudiant (table etudiant_matieres_v2)
            db.session.execute(
                db.text("DELETE FROM etudiant_matieres_v2 WHERE etudiant_id = :etudiant_id"),
                {"etudiant_id": etudiant.id}
            )
            db.session.flush()
            
            # Ajouter les nouvelles associations
            for matiere in matieres_valides:
                db.session.execute(
                    db.text("INSERT INTO etudiant_matieres_v2 (etudiant_id, matiere_id, annee_scolaire) VALUES (:etudiant_id, :matiere_id, :annee_scolaire)"),
                    {"etudiant_id": etudiant.id, "matiere_id": matiere.id, "annee_scolaire": annee_scolaire}
                )
            db.session.flush()
            
            db.session.commit()
            
            # Retourner les matières mises à jour
            # Recharger l'étudiant pour avoir les nouvelles relations
            from app.repositories.etudiant_repository import EtudiantRepository
            etudiant_repo = EtudiantRepository()
            etudiant_updated = etudiant_repo.get_by_id(etudiant.id)
            matieres = [m.to_dict() for m in etudiant_updated.matieres.filter(Matiere.actif == True).all()]
            return matieres, 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Erreur mise à jour matières étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

