"""
Routes API pour la gestion des QCM
"""
from flask import Blueprint, request, jsonify, abort
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.qcm_service import QCMService
from app.services.question_service import QuestionService
import logging
import base64

logger = logging.getLogger(__name__)

# Imports pour la génération asynchrone
try:
    from app.services.async_task_manager import task_manager
    from app.services.quiz_generation_service import (
        generate_quiz_from_text_async,
        generate_quiz_from_document_async,
        estimate_generation_time
    )
    QUIZ_GENERATION_AVAILABLE = True
except ImportError as e:
    QUIZ_GENERATION_AVAILABLE = False
    logger.warning(f"Génération de quiz non disponible: {e}")

# Namespace pour l'API
api = Namespace('qcm', description='Opérations sur les QCM')

# Modèles pour la documentation Swagger
qcm_model = api.model('QCM', {
    'id': fields.String(description='ID du QCM'),
    'titre': fields.String(required=True, description='Titre du QCM', min_length=3, max_length=255),
    'description': fields.String(description='Description du QCM', max_length=5000),
    'duree': fields.Integer(description='Durée en minutes', min=1, max=999),
    'matiere': fields.String(description='Matière', max_length=100),
    'status': fields.String(description='Statut', enum=['draft', 'published', 'archived']),
    'createurId': fields.String(description='ID du créateur'),
    'nombreQuestions': fields.Integer(description='Nombre de questions'),
    'createdAt': fields.String(description='Date de création'),
    'updatedAt': fields.String(description='Date de modification')
})

qcm_create_model = api.model('QCMCreate', {
    'titre': fields.String(required=True, description='Titre du QCM', min_length=3, max_length=255),
    'description': fields.String(description='Description du QCM'),
    'duree': fields.Integer(description='Durée en minutes'),
    'matiere': fields.String(description='Matière (texte, deprecated)'),
    'matiereId': fields.String(description='ID de la matière (recommandé)'),
    'status': fields.String(description='Statut', enum=['draft', 'published', 'archived'], default='draft')
})

qcm_update_model = api.model('QCMUpdate', {
    'titre': fields.String(description='Titre du QCM'),
    'description': fields.String(description='Description du QCM'),
    'duree': fields.Integer(description='Durée en minutes'),
    'matiere': fields.String(description='Matière (texte, deprecated)'),
    'matiereId': fields.String(description='ID de la matière (recommandé)'),
    'status': fields.String(description='Statut', enum=['draft', 'published', 'archived'])
})

generate_from_text_model = api.model('GenerateFromText', {
    'titre': fields.String(required=True, description='Titre du QCM'),
    'text': fields.String(required=True, description='Texte source pour la génération'),
    'num_questions': fields.Integer(description='Nombre de questions à générer', default=5, min=1, max=20),
    'matiere': fields.String(description='Matière'),
    'niveau_id': fields.String(description='ID du niveau académique'),
    'mention_id': fields.String(description='ID de la mention académique'),
    'parcours_id': fields.String(description='ID du parcours académique'),
    'duree': fields.Integer(description='Durée estimée en minutes')
})

generate_from_document_model = api.model('GenerateFromDocument', {
    'titre': fields.String(required=True, description='Titre du QCM'),
    'file_content': fields.String(required=True, description='Contenu du fichier en base64'),
    'file_type': fields.String(required=True, description='Type de fichier', enum=['pdf', 'docx']),
    'num_questions': fields.Integer(description='Nombre de questions à générer', default=5, min=1, max=20),
    'matiere': fields.String(description='Matière'),
    'niveau_id': fields.String(description='ID du niveau académique'),
    'mention_id': fields.String(description='ID de la mention académique'),
    'parcours_id': fields.String(description='ID du parcours académique'),
    'duree': fields.Integer(description='Durée estimée en minutes')
})

task_status_model = api.model('TaskStatus', {
    'task_id': fields.String(description='ID de la tâche'),
    'status': fields.String(description='Statut de la tâche', enum=['PENDING', 'PROGRESS', 'SUCCESS', 'FAILURE']),
    'result': fields.Raw(description='Résultat de la tâche'),
    'error': fields.String(description='Message d\'erreur si échec')
})

# Service
qcm_service = QCMService()
question_service = QuestionService()
from app.services.resultat_service import ResultatService
resultat_service = ResultatService()


@api.route('')
class QCMList(Resource):
    @api.doc('list_qcms', security='Bearer')
    @api.param('skip', 'Nombre d\'éléments à sauter', type='integer', default=0)
    @api.param('limit', 'Nombre d\'éléments à retourner', type='integer', default=100)
    @api.param('status', 'Filtrer par statut', type='string', enum=['draft', 'published', 'archived'])
    @api.param('matiere', 'Filtrer par matière', type='string')
    @jwt_required()
    def get(self):
        """Liste tous les QCM avec pagination et filtres"""
        try:
            skip = request.args.get('skip', 0, type=int)
            limit = request.args.get('limit', 100, type=int)
            status = request.args.get('status')
            matiere = request.args.get('matiere')
            user_id = get_jwt_identity()

            filters = {}
            if status:
                filters['status'] = status
            if matiere:
                filters['matiere'] = matiere
            
            # Filtrer par créateur sauf si c'est un admin
            # Vérifier si l'utilisateur est admin
            from app.repositories.user_repository import UserRepository
            from app.models.user import UserRole
            user_repo = UserRepository()
            user = user_repo.get_by_id(user_id)
            
            # Si l'utilisateur n'est pas admin, filtrer par ses propres QCM
            if user and user.role != UserRole.ADMIN:
                filters['createur_id'] = user_id

            qcms, total = qcm_service.get_qcms(filters=filters, skip=skip, limit=limit)

            # Retourner directement le dictionnaire (Flask-RESTX gère la sérialisation JSON)
            return {
                'data': qcms,
                'total': total,
                'skip': skip,
                'limit': limit
            }, 200

        except Exception as e:
            logger.error(f"Erreur récupération QCMs: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_qcm', security='Bearer')
    @api.expect(qcm_create_model)
    @api.marshal_with(qcm_model, code=201)
    @jwt_required()
    def post(self):
        """Crée un nouveau QCM"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()

            qcm = qcm_service.create_qcm(data, user_id)

            return qcm, 201

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création QCM: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:qcm_id>')
@api.param('qcm_id', 'ID du QCM')
class QCMDetail(Resource):
    @api.doc('get_qcm', security='Bearer')
    @api.marshal_with(qcm_model)
    @jwt_required()
    def get(self, qcm_id):
        """Récupère un QCM par son ID"""
        try:
            user_id = get_jwt_identity()
            
            # Vérifier les permissions d'accès
            if not qcm_service.can_access_qcm(qcm_id, user_id):
                api.abort(403, "Vous n'avez pas la permission d'accéder à ce QCM")
            
            qcm = qcm_service.get_qcm_by_id(qcm_id)
            if not qcm:
                api.abort(404, f"QCM {qcm_id} non trouvé")

            return qcm, 200

        except Exception as e:
            logger.error(f"Erreur récupération QCM: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_qcm', security='Bearer')
    @api.expect(qcm_update_model)
    @api.marshal_with(qcm_model)
    @jwt_required()
    def put(self, qcm_id):
        """Met à jour un QCM"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()

            qcm = qcm_service.update_qcm(qcm_id, data, user_id)

            return qcm, 200

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour QCM: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_qcm', security='Bearer')
    @jwt_required()
    def delete(self, qcm_id):
        """Supprime un QCM"""
        try:
            user_id = get_jwt_identity()
            success = qcm_service.delete_qcm(qcm_id, user_id)

            if success:
                return {'message': 'QCM supprimé avec succès'}, 200
            else:
                api.abort(404, f"QCM {qcm_id} non trouvé")

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression QCM: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/generate/text')
class GenerateFromText(Resource):
    @api.doc('generate_from_text', security='Bearer')
    @api.expect(generate_from_text_model)
    @api.marshal_with(task_status_model, code=202)
    @jwt_required()
    def post(self):
        """Génère un QCM à partir de texte brut (asynchrone)"""
        try:
            if not QUIZ_GENERATION_AVAILABLE:
                api.abort(503, "La génération de quiz nécessite 'transformers' et 'torch'. Installez-les avec: pip install transformers torch")
            
            data = request.get_json()
            user_id = get_jwt_identity()

            # Chercher la matière si elle est fournie en texte
            matiere_id = None
            matiere_text = data.get('matiere')
            if matiere_text:
                from app.repositories.matiere_repository import MatiereRepository
                from app.models.matiere import Matiere
                matiere_repo = MatiereRepository()
                
                # Chercher d'abord par code exact
                matiere_obj = matiere_repo.get_by_code(matiere_text.strip())
                
                # Si pas trouvé, chercher par nom exact
                if not matiere_obj:
                    matiere_obj = matiere_repo.session.query(Matiere).filter(
                        Matiere.nom.ilike(matiere_text.strip())
                    ).filter(Matiere.actif == True).first()
                
                # Si toujours pas trouvé, faire une recherche partielle
                if not matiere_obj:
                    results = matiere_repo.search(matiere_text.strip())
                    results = [m for m in results if m.actif]
                    if results:
                        matiere_obj = results[0]
                
                if matiere_obj and matiere_obj.actif:
                    matiere_id = matiere_obj.id
                    matiere_text = matiere_obj.nom  # Utiliser le nom officiel

            # Récupérer niveau, mention, parcours depuis les IDs ou codes
            niveau_id = data.get('niveau_id') or data.get('niveauId')
            mention_id = data.get('mention_id') or data.get('mentionId')
            parcours_id = data.get('parcours_id') or data.get('parcoursId')
            
            niveau_nom = None
            mention_nom = None
            parcours_nom = None
            
            if niveau_id:
                from app.repositories.niveau_repository import NiveauRepository
                niveau_repo = NiveauRepository()
                # Accepter soit un ID (UUID) soit un code (L1, L2, etc.)
                niveau_obj = niveau_repo.get_by_id(niveau_id)
                if not niveau_obj:
                    niveau_obj = niveau_repo.get_by_code(niveau_id)
                if niveau_obj:
                    niveau_nom = niveau_obj.nom
                    niveau_id = niveau_obj.id  # Utiliser l'ID réel
            
            if mention_id:
                from app.repositories.mention_repository import MentionRepository
                mention_repo = MentionRepository()
                mention_obj = mention_repo.get_by_id(mention_id)
                if mention_obj:
                    mention_nom = mention_obj.nom
            
            if parcours_id:
                from app.repositories.parcours_repository import ParcoursRepository
                parcours_repo = ParcoursRepository()
                parcours_obj = parcours_repo.get_by_id(parcours_id)
                if parcours_obj:
                    parcours_nom = parcours_obj.nom

            # Créer le QCM vide
            qcm_data = {
                'titre': data['titre'],
                'description': f"QCM généré automatiquement à partir de texte",
                'matiere': matiere_text,
                'matiereId': matiere_id,  # Ajouter matiereId si trouvé
                'niveauId': niveau_id,
                'mentionId': mention_id,
                'parcoursId': parcours_id,
                'duree': data.get('duree'),
                'status': 'draft'
            }

            qcm = qcm_service.create_qcm(qcm_data, user_id)

            # Estimer le temps de génération
            num_questions = data.get('num_questions', 5)
            estimated_time = estimate_generation_time(num_questions, is_document=False)
            
            # Créer une fonction wrapper qui recevra le task_id
            def run_generation(task_id_param):
                return generate_quiz_from_text_async(
                    task_id_param,
                    qcm['id'],
                    data['text'],
                    num_questions,
                    data.get('matiere'),
                    niveau_nom,  # Passer le nom du niveau
                    mention_nom,  # Passer le nom de la mention
                    parcours_nom  # Passer le nom du parcours
                )
            
            # Lancer la tâche asynchrone (task_id sera passé automatiquement)
            task_id = task_manager.create_task_with_id(run_generation)
            
            # Définir l'estimation de temps
            task_manager.set_estimated_duration(task_id, estimated_time)

            return {
                'task_id': task_id,
                'status': 'PENDING',
                'qcm_id': qcm['id'],
                'message': 'Génération en cours...',
                'estimated_duration_seconds': estimated_time
            }, 202

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur génération depuis texte: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/generate/document')
class GenerateFromDocument(Resource):
    @api.doc('generate_from_document', security='Bearer')
    @api.expect(generate_from_document_model)
    @api.marshal_with(task_status_model, code=202)
    @jwt_required()
    def post(self):
        """Génère un QCM à partir d'un document PDF/DOCX (asynchrone)"""
        try:
            if not QUIZ_GENERATION_AVAILABLE:
                api.abort(503, "La génération de quiz nécessite 'transformers' et 'torch'. Installez-les avec: pip install transformers torch")
            
            data = request.get_json()
            user_id = get_jwt_identity()

            # Décoder le fichier base64
            try:
                file_bytes = base64.b64decode(data['file_content'])
            except Exception as e:
                api.abort(400, f"Erreur décodage fichier: {str(e)}")

            # Chercher la matière si elle est fournie en texte
            matiere_id = None
            matiere_text = data.get('matiere')
            if matiere_text:
                from app.repositories.matiere_repository import MatiereRepository
                from app.models.matiere import Matiere
                matiere_repo = MatiereRepository()
                
                # Chercher d'abord par code exact
                matiere_obj = matiere_repo.get_by_code(matiere_text.strip())
                
                # Si pas trouvé, chercher par nom exact
                if not matiere_obj:
                    matiere_obj = matiere_repo.session.query(Matiere).filter(
                        Matiere.nom.ilike(matiere_text.strip())
                    ).filter(Matiere.actif == True).first()
                
                # Si toujours pas trouvé, faire une recherche partielle
                if not matiere_obj:
                    results = matiere_repo.search(matiere_text.strip())
                    results = [m for m in results if m.actif]
                    if results:
                        matiere_obj = results[0]
                
                if matiere_obj and matiere_obj.actif:
                    matiere_id = matiere_obj.id
                    matiere_text = matiere_obj.nom  # Utiliser le nom officiel

            # Récupérer niveau, mention, parcours depuis les IDs ou codes
            niveau_id = data.get('niveau_id') or data.get('niveauId')
            mention_id = data.get('mention_id') or data.get('mentionId')
            parcours_id = data.get('parcours_id') or data.get('parcoursId')
            
            niveau_nom = None
            mention_nom = None
            parcours_nom = None
            
            if niveau_id:
                from app.repositories.niveau_repository import NiveauRepository
                niveau_repo = NiveauRepository()
                # Accepter soit un ID (UUID) soit un code (L1, L2, etc.)
                niveau_obj = niveau_repo.get_by_id(niveau_id)
                if not niveau_obj:
                    niveau_obj = niveau_repo.get_by_code(niveau_id)
                if niveau_obj:
                    niveau_nom = niveau_obj.nom
                    niveau_id = niveau_obj.id  # Utiliser l'ID réel
            
            if mention_id:
                from app.repositories.mention_repository import MentionRepository
                mention_repo = MentionRepository()
                mention_obj = mention_repo.get_by_id(mention_id)
                if mention_obj:
                    mention_nom = mention_obj.nom
            
            if parcours_id:
                from app.repositories.parcours_repository import ParcoursRepository
                parcours_repo = ParcoursRepository()
                parcours_obj = parcours_repo.get_by_id(parcours_id)
                if parcours_obj:
                    parcours_nom = parcours_obj.nom

            # Créer le QCM vide
            qcm_data = {
                'titre': data['titre'],
                'description': f"QCM généré automatiquement à partir d'un document {data['file_type'].upper()}",
                'matiere': matiere_text,
                'matiereId': matiere_id,  # Ajouter matiereId si trouvé
                'niveauId': niveau_id,
                'mentionId': mention_id,
                'parcoursId': parcours_id,
                'duree': data.get('duree'),
                'status': 'draft'
            }

            qcm = qcm_service.create_qcm(qcm_data, user_id)

            # Estimer le temps de génération
            num_questions = data.get('num_questions', 5)
            estimated_time = estimate_generation_time(num_questions, is_document=True)
            
            # Créer une fonction wrapper qui recevra le task_id
            def run_generation_doc(task_id_param):
                return generate_quiz_from_document_async(
                    task_id_param,
                    qcm['id'],
                    file_bytes,
                    data['file_type'],
                    num_questions,
                    data.get('matiere'),
                    niveau_nom,  # Passer le nom du niveau
                    mention_nom,  # Passer le nom de la mention
                    parcours_nom  # Passer le nom du parcours
                )
            
            # Lancer la tâche asynchrone (task_id sera passé automatiquement)
            task_id = task_manager.create_task_with_id(run_generation_doc)
            
            # Définir l'estimation de temps
            task_manager.set_estimated_duration(task_id, estimated_time)

            return {
                'task_id': task_id,
                'status': 'PENDING',
                'qcm_id': qcm['id'],
                'message': 'Génération en cours...',
                'estimated_duration_seconds': estimated_time
            }, 202

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur génération depuis document: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/tasks/<string:task_id>')
@api.param('task_id', 'ID de la tâche asynchrone')
class TaskStatus(Resource):
    @api.doc('get_task_status', security='Bearer')
    @api.marshal_with(task_status_model)
    @jwt_required()
    def get(self, task_id):
        """Récupère le statut d'une tâche asynchrone"""
        try:
            task_status = task_manager.get_task_status(task_id)
            
            if not task_status:
                api.abort(404, f"Tâche {task_id} non trouvée")
            
            # Construire la réponse au format attendu
            response = {
                'task_id': task_id,
                'status': task_status['status'],
            }
            
            if task_status['status'] == 'PROGRESS':
                response['result'] = {
                    'status': task_status.get('message', 'En cours...'),
                    'progress': task_status.get('progress', 0),
                    'estimated_remaining_seconds': task_status.get('estimated_remaining_seconds'),
                    'elapsed_seconds': task_status.get('elapsed_seconds', 0)
                }
            elif task_status['status'] == 'SUCCESS':
                response['result'] = task_status.get('result')
            elif task_status['status'] == 'FAILURE':
                response['error'] = task_status.get('error', 'Erreur inconnue')
            
            return response, 200

        except Exception as e:
            logger.error(f"Erreur récupération statut tâche: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:qcm_id>/publish')
@api.param('qcm_id', 'ID du QCM')
class PublishQCM(Resource):
    @api.doc('publish_qcm', security='Bearer')
    @api.marshal_with(qcm_model)
    @jwt_required()
    def patch(self, qcm_id):
        """Publie un QCM (change le statut en 'published')"""
        try:
            user_id = get_jwt_identity()

            qcm = qcm_service.update_qcm(qcm_id, {'status': 'published'}, user_id)

            return qcm, 200

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur publication QCM: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


envoyer_eleves_model = api.model('EnvoyerEleves', {
    'qcm_id': fields.String(description='ID du QCM'),
    'nombre_etudiants': fields.Integer(description='Nombre d\'étudiants qui ont reçu le QCM'),
    'matiere': fields.String(description='Matière du QCM'),
})


@api.route('/<string:qcm_id>/envoyer_aux_eleves')
@api.param('qcm_id', 'ID du QCM')
class EnvoyerAuxEleves(Resource):
    @api.doc('envoyer_qcm_aux_eleves', security='Bearer')
    @jwt_required()
    def post(self, qcm_id):
        """Envoie le QCM à tous les élèves qui suivent la matière du QCM"""
        try:
            logger.info(f"Requête POST reçue pour envoyer QCM {qcm_id} aux élèves")
            user_id = get_jwt_identity()
            logger.info(f"User ID: {user_id}")
            
            # Récupérer le QCM
            qcm_dict = qcm_service.get_qcm_by_id(qcm_id)
            if not qcm_dict:
                return {'message': f"QCM {qcm_id} non trouvé"}, 404
            
            # Récupérer l'objet QCM pour accéder aux relations
            qcm_obj = qcm_service.qcm_repo.get_by_id(qcm_id)
            if not qcm_obj:
                return {'message': f"QCM {qcm_id} non trouvé"}, 404
            
            # Vérifier les permissions
            from app.repositories.user_repository import UserRepository
            from app.models.user import UserRole
            user_repo = UserRepository()
            user = user_repo.get_by_id(user_id)
            if user and user.role != UserRole.ADMIN:
                # Vérifier que l'utilisateur est le créateur du QCM
                if qcm_obj.createur_id != user_id:
                    return {'message': "Vous n'avez pas la permission d'envoyer ce QCM"}, 403
            
            # Vérifier que le QCM a une matière, et essayer de la trouver si elle est en texte
            if not qcm_obj.matiere_id:
                # Essayer de trouver la matière par le texte
                if qcm_obj.matiere:
                    from app.repositories.matiere_repository import MatiereRepository
                    from app.models.matiere import Matiere
                    matiere_repo = MatiereRepository()
                    
                    # Chercher d'abord par code exact
                    matiere_obj = matiere_repo.get_by_code(qcm_obj.matiere.strip())
                    
                    # Si pas trouvé, chercher par nom exact
                    if not matiere_obj:
                        matiere_obj = matiere_repo.session.query(Matiere).filter(
                            Matiere.nom.ilike(qcm_obj.matiere.strip())
                        ).filter(Matiere.actif == True).first()
                    
                    # Si toujours pas trouvé, faire une recherche partielle
                    if not matiere_obj:
                        results = matiere_repo.search(qcm_obj.matiere.strip())
                        results = [m for m in results if m.actif]
                        if results:
                            matiere_obj = results[0]
                    
                    # Si trouvé, mettre à jour le QCM
                    if matiere_obj and matiere_obj.actif:
                        logger.info(f"Mise à jour automatique du QCM {qcm_id}: assignation de la matière {matiere_obj.nom} (ID: {matiere_obj.id})")
                        qcm_obj.matiere_id = matiere_obj.id
                        qcm_obj.matiere = matiere_obj.nom  # Utiliser le nom officiel
                        from app import db
                        db.session.commit()
                        # Recharger l'objet
                        qcm_obj = qcm_service.qcm_repo.get_by_id(qcm_id)
                    else:
                        logger.warning(f"QCM {qcm_id} n'a pas de matière assignée (matiere_id: {qcm_obj.matiere_id}, matiere texte: {qcm_obj.matiere}) - matière non trouvée")
                        return {
                            'message': f"Le QCM doit avoir une matière assignée pour être envoyé aux élèves. La matière '{qcm_obj.matiere}' n'a pas été trouvée. Veuillez modifier le QCM et sélectionner une matière valide.",
                            'error': 'NO_MATIERE'
                        }, 400
                else:
                    logger.warning(f"QCM {qcm_id} n'a pas de matière assignée (ni matiere_id ni matiere texte)")
                    return {
                        'message': "Le QCM doit avoir une matière assignée pour être envoyé aux élèves. Veuillez modifier le QCM et sélectionner une matière.",
                        'error': 'NO_MATIERE'
                    }, 400
            
            # Publier le QCM s'il ne l'est pas déjà
            if qcm_obj.status != 'published':
                qcm_dict = qcm_service.update_qcm(qcm_id, {'status': 'published'}, user_id)
            
            # Compter le nombre d'étudiants qui suivent cette matière
            etudiants = user_repo.session.query(user_repo.model).filter(
                user_repo.model.role == UserRole.ETUDIANT
            ).all()
            
            nombre_etudiants = 0
            for etudiant in etudiants:
                # Utiliser le profil étudiant pour accéder aux matières
                if not etudiant.etudiant_profil:
                    continue
                matieres = etudiant.etudiant_profil.matieres.filter_by(actif=True).all()
                matieres_ids = [m.id for m in matieres]
                if qcm_obj.matiere_id in matieres_ids:
                    nombre_etudiants += 1
            
            # Récupérer le nom de la matière
            matiere_nom = qcm_obj.matiere
            if qcm_obj.matiere_obj:
                matiere_nom = qcm_obj.matiere_obj.nom
            
            response_data = {
                'qcm_id': qcm_id,
                'nombre_etudiants': nombre_etudiants,
                'matiere': matiere_nom or 'Non spécifiée'
            }
            
            # Retourner directement le dictionnaire (Flask-RESTX gère la sérialisation JSON)
            return response_data, 200

        except ValueError as e:
            return {'message': str(e)}, 400
        except Exception as e:
            logger.error(f"Erreur envoi QCM aux élèves: {e}", exc_info=True)
            import traceback
            logger.error(traceback.format_exc())
            return {'message': f"Erreur interne: {str(e)}"}, 500


@api.route('/<string:qcm_id>/questions')
@api.param('qcm_id', 'ID du QCM')
class QCMQuestions(Resource):
    @api.doc('get_qcm_questions', security='Bearer')
    @jwt_required()
    def get(self, qcm_id):
        """Récupère toutes les questions d'un QCM"""
        try:
            questions = question_service.get_questions_by_qcm(qcm_id)

            return {
                'qcm_id': qcm_id,
                'questions': questions,
                'total': len(questions)
            }, 200

        except Exception as e:
            logger.error(f"Erreur récupération questions: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_qcm_question', security='Bearer')
    @jwt_required()
    def post(self, qcm_id):
        """Crée une nouvelle question pour un QCM"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()
            
            # Ajouter le qcm_id aux données
            data['qcm_id'] = qcm_id
            
            # Vérifier que l'utilisateur peut modifier ce QCM
            qcm = qcm_service.get_qcm_by_id(qcm_id)
            if not qcm:
                api.abort(404, f"QCM {qcm_id} non trouvé")
            
            from app.repositories.user_repository import UserRepository
            from app.models.user import UserRole
            user_repo = UserRepository()
            user = user_repo.get_by_id(user_id)
            
            if user and user.role != UserRole.ADMIN:
                # Récupérer le QCM complet pour vérifier le créateur
                from app.repositories.qcm_repository import QCMRepository
                qcm_repo = QCMRepository()
                qcm_obj = qcm_repo.get_by_id(qcm_id)
                if qcm_obj and qcm_obj.createur_id != user_id:
                    api.abort(403, "Vous n'avez pas la permission d'ajouter des questions à ce QCM")
            
            question = question_service.create_question(data, user_id)
            return question, 201

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur création question: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:qcm_id>/questions/<string:question_id>')
@api.param('qcm_id', 'ID du QCM')
@api.param('question_id', 'ID de la question')
class QCMQuestionDetail(Resource):
    @api.doc('update_qcm_question', security='Bearer')
    @jwt_required()
    def put(self, qcm_id, question_id):
        """Met à jour une question d'un QCM"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()
            
            # Vérifier que l'utilisateur peut modifier ce QCM
            qcm = qcm_service.get_qcm_by_id(qcm_id)
            if not qcm:
                api.abort(404, f"QCM {qcm_id} non trouvé")
            
            from app.repositories.user_repository import UserRepository
            from app.models.user import UserRole
            user_repo = UserRepository()
            user = user_repo.get_by_id(user_id)
            
            if user and user.role != UserRole.ADMIN:
                from app.repositories.qcm_repository import QCMRepository
                qcm_repo = QCMRepository()
                qcm_obj = qcm_repo.get_by_id(qcm_id)
                if qcm_obj and qcm_obj.createur_id != user_id:
                    api.abort(403, "Vous n'avez pas la permission de modifier les questions de ce QCM")
            
            question = question_service.update_question(question_id, data, user_id)
            return question, 200

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur mise à jour question: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_qcm_question', security='Bearer')
    @jwt_required()
    def delete(self, qcm_id, question_id):
        """Supprime une question d'un QCM"""
        try:
            user_id = get_jwt_identity()
            
            # Vérifier que l'utilisateur peut modifier ce QCM
            qcm = qcm_service.get_qcm_by_id(qcm_id)
            if not qcm:
                api.abort(404, f"QCM {qcm_id} non trouvé")
            
            from app.repositories.user_repository import UserRepository
            from app.models.user import UserRole
            user_repo = UserRepository()
            user = user_repo.get_by_id(user_id)
            
            if user and user.role != UserRole.ADMIN:
                from app.repositories.qcm_repository import QCMRepository
                qcm_repo = QCMRepository()
                qcm_obj = qcm_repo.get_by_id(qcm_id)
                if qcm_obj and qcm_obj.createur_id != user_id:
                    api.abort(403, "Vous n'avez pas la permission de supprimer les questions de ce QCM")
            
            success = question_service.delete_question(question_id, user_id)
            if success:
                return {'message': 'Question supprimée avec succès'}, 200
            else:
                api.abort(404, f"Question {question_id} non trouvée")

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur suppression question: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


# Modèle pour les statistiques QCM
statistiques_qcm_model = api.model('StatistiquesQCM', {
    'nombre_soumissions': fields.Integer(description='Nombre total de soumissions'),
    'nombre_etudiants_uniques': fields.Integer(description='Nombre d\'étudiants uniques'),
    'moyenne_note_sur_20': fields.Float(description='Moyenne des notes sur 20'),
    'moyenne_pourcentage': fields.Float(description='Moyenne des pourcentages'),
    'taux_reussite': fields.Float(description='Taux de réussite en %'),
    'note_min': fields.Float(description='Note minimale'),
    'note_max': fields.Float(description='Note maximale'),
    'note_mediane': fields.Float(description='Note médiane'),
    'duree_moyenne_secondes': fields.Float(description='Durée moyenne en secondes'),
    'distribution_notes': fields.List(fields.Raw, description='Distribution des notes'),
    'statistiques_par_question': fields.List(fields.Raw, description='Statistiques par question'),
    'resultats': fields.List(fields.Raw, description='Liste des résultats'),
    'qcm': fields.Raw(description='Informations sur le QCM')
})


@api.route('/<string:qcm_id>/statistiques')
@api.param('qcm_id', 'ID du QCM')
class QCMStatistiques(Resource):
    @api.doc('get_qcm_statistiques', security='Bearer')
    @api.marshal_with(statistiques_qcm_model)
    @jwt_required()
    def get(self, qcm_id):
        """Récupère les statistiques complètes d'un QCM (admin/enseignant)"""
        try:
            user_id = get_jwt_identity()
            
            # Vérifier que le QCM existe
            qcm = qcm_service.get_qcm_by_id(qcm_id)
            if not qcm:
                api.abort(404, f"QCM {qcm_id} non trouvé")
            
            # Vérifier les permissions (admin ou créateur du QCM)
            from app.repositories.user_repository import UserRepository
            from app.models.user import UserRole
            user_repo = UserRepository()
            user = user_repo.get_by_id(user_id)
            
            if user and user.role != UserRole.ADMIN:
                # Vérifier que l'utilisateur est le créateur du QCM
                from app.repositories.qcm_repository import QCMRepository
                qcm_repo = QCMRepository()
                qcm_obj = qcm_repo.get_by_id(qcm_id)
                if qcm_obj and qcm_obj.createur_id != user_id:
                    api.abort(403, "Vous n'avez pas la permission de voir les statistiques de ce QCM")
            
            # Récupérer les statistiques
            stats = resultat_service.get_statistiques_qcm(qcm_id)
            
            return stats, 200

        except ValueError as e:
            api.abort(400, str(e))
        except Exception as e:
            logger.error(f"Erreur récupération statistiques QCM: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
