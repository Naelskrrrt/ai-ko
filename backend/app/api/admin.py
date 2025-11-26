"""
Endpoints d'administration (accès admin uniquement)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.decorators import require_role
from app.services.user_service import UserService
from app.services.qcm_service import QCMService
from app.services.question_service import QuestionService
from app.schemas.admin_user_schema import (
    UserCreateSchema, UserUpdateSchema, ChangeRoleSchema, UserResponseSchema
)
from app.schemas.qcm_schema import (
    QCMCreateSchema, QCMUpdateSchema, QCMResponseSchema
)
from app.schemas.question_schema import (
    QuestionCreateSchema, QuestionUpdateSchema, QuestionResponseSchema
)
from app.models.user import UserRole

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Instancier les services et schémas
user_service = UserService()
qcm_service = QCMService()
question_service = QuestionService()

# Import AdminStatisticsService
from app.services.admin_statistics_service import AdminStatisticsService
admin_stats_service = AdminStatisticsService()

user_create_schema = UserCreateSchema()
user_update_schema = UserUpdateSchema()
change_role_schema = ChangeRoleSchema()
user_response_schema = UserResponseSchema()

qcm_create_schema = QCMCreateSchema()
qcm_update_schema = QCMUpdateSchema()
qcm_response_schema = QCMResponseSchema()

question_create_schema = QuestionCreateSchema()
question_update_schema = QuestionUpdateSchema()
question_response_schema = QuestionResponseSchema()


@bp.route('/users', methods=['GET'])
@require_role('admin')
def get_users(current_user):
    """Récupère la liste paginée des utilisateurs avec filtres"""
    try:
        # Paramètres de pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        skip = (page - 1) * per_page
        
        # Filtres
        filters = {}
        role = request.args.get('role')
        if role:
            filters['role'] = role
        
        search = request.args.get('search')
        if search:
            filters['search'] = search
        
        active = request.args.get('active')
        if active is not None:
            filters['active'] = active.lower() == 'true'
        
        # Paramètres de tri
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Valider sort_by
        allowed_sort_fields = ['email', 'name', 'created_at', 'role']
        if sort_by not in allowed_sort_fields:
            sort_by = 'created_at'
        
        # Valider sort_order
        if sort_order not in ['asc', 'desc']:
            sort_order = 'desc'
        
        # Récupérer les utilisateurs
        users, total = user_service.get_users(filters=filters, skip=skip, limit=per_page, sort_by=sort_by, sort_order=sort_order)
        
        return jsonify({
            'users': [user_response_schema.dump(user) for user in users],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la récupération des utilisateurs: {str(e)}'}), 500


@bp.route('/users/<user_id>', methods=['GET'])
@require_role('admin')
def get_user(user_id, current_user):
    """Récupère les détails d'un utilisateur"""
    try:
        user = user_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
        return jsonify(user_response_schema.dump(user)), 200
        
    except Exception as e:
        return jsonify({'message': f'Erreur: {str(e)}'}), 500


@bp.route('/users', methods=['POST'])
@require_role('admin')
def create_user(current_user):
    """Crée un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        # Validation avec Marshmallow
        errors = user_create_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400
        
        validated_data = user_create_schema.load(data)
        
        # Créer l'utilisateur via le service
        user = user_service.create_user(validated_data)
        
        return jsonify(user_response_schema.dump(user)), 201
        
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la création: {str(e)}'}), 500


@bp.route('/users/<user_id>', methods=['PUT'])
@require_role('admin')
def update_user(user_id, current_user):
    """Met à jour un utilisateur"""
    try:
        data = request.get_json()
        
        # Validation avec Marshmallow
        errors = user_update_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400
        
        validated_data = user_update_schema.load(data)
        
        # Mettre à jour via le service
        user = user_service.update_user(user_id, validated_data, current_user_id=str(current_user.id))
        
        return jsonify(user_response_schema.dump(user)), 200
        
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la mise à jour: {str(e)}'}), 500


@bp.route('/users/<user_id>', methods=['DELETE'])
@require_role('admin')
def delete_user(user_id, current_user):
    """Supprime un utilisateur"""
    try:
        user_service.delete_user(user_id, current_user_id=str(current_user.id))
        return jsonify({'message': 'Utilisateur supprimé avec succès'}), 200
        
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la suppression: {str(e)}'}), 500


@bp.route('/users/<user_id>/role', methods=['PATCH'])
@require_role('admin')
def change_user_role(user_id, current_user):
    """Change le rôle d'un utilisateur"""
    try:
        data = request.get_json()
        
        # Validation avec Marshmallow
        errors = change_role_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400
        
        validated_data = change_role_schema.load(data)
        
        # Changer le rôle via le service
        user = user_service.change_role(user_id, validated_data['role'], current_user_id=str(current_user.id))
        
        return jsonify(user_response_schema.dump(user)), 200
        
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors du changement de rôle: {str(e)}'}), 500


@bp.route('/users/<user_id>/status', methods=['PATCH'])
@require_role('admin')
def toggle_user_status(user_id, current_user):
    """Active ou désactive un utilisateur"""
    try:
        # Basculer le statut via le service
        user = user_service.toggle_status(user_id, current_user_id=str(current_user.id))

        return jsonify(user_response_schema.dump(user)), 200

    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors du changement de statut: {str(e)}'}), 500


# ========================
# Routes QCM
# ========================

@bp.route('/qcm', methods=['GET'])
@require_role('admin')
def get_qcms(current_user):
    """Récupère la liste paginée des QCM avec filtres"""
    try:
        # Paramètres de pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        skip = (page - 1) * per_page

        # Filtres
        filters = {}
        status = request.args.get('status')
        if status:
            filters['status'] = status

        matiere = request.args.get('matiere')
        if matiere:
            filters['matiere'] = matiere

        createur_id = request.args.get('createur_id')
        if createur_id:
            filters['createur_id'] = createur_id

        search = request.args.get('search')
        if search:
            filters['search'] = search

        # Récupérer les QCM
        qcms, total = qcm_service.get_qcms(filters=filters, skip=skip, limit=per_page)

        return jsonify({
            'qcms': [qcm_response_schema.dump(qcm) for qcm in qcms],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        return jsonify({'message': f'Erreur lors de la récupération des QCM: {str(e)}'}), 500


@bp.route('/qcm/<qcm_id>', methods=['GET'])
@require_role('admin')
def get_qcm(qcm_id, current_user):
    """Récupère les détails d'un QCM"""
    try:
        qcm = qcm_service.get_qcm_by_id(qcm_id)
        if not qcm:
            return jsonify({'message': 'QCM non trouvé'}), 404

        return jsonify(qcm_response_schema.dump(qcm)), 200

    except Exception as e:
        return jsonify({'message': f'Erreur: {str(e)}'}), 500


@bp.route('/qcm', methods=['POST'])
@require_role('admin')
def create_qcm(current_user):
    """Crée un nouveau QCM"""
    try:
        data = request.get_json()

        # Validation avec Marshmallow
        errors = qcm_create_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400

        validated_data = qcm_create_schema.load(data)

        # Créer le QCM via le service
        qcm = qcm_service.create_qcm(validated_data, createur_id=str(current_user.id))

        return jsonify(qcm_response_schema.dump(qcm)), 201

    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la création: {str(e)}'}), 500


@bp.route('/qcm/<qcm_id>', methods=['PUT'])
@require_role('admin')
def update_qcm(qcm_id, current_user):
    """Met à jour un QCM"""
    try:
        data = request.get_json()

        # Validation avec Marshmallow
        errors = qcm_update_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400

        validated_data = qcm_update_schema.load(data)

        # Mettre à jour via le service
        qcm = qcm_service.update_qcm(qcm_id, validated_data, user_id=str(current_user.id))

        return jsonify(qcm_response_schema.dump(qcm)), 200

    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la mise à jour: {str(e)}'}), 500


@bp.route('/qcm/<qcm_id>', methods=['DELETE'])
@require_role('admin')
def delete_qcm(qcm_id, current_user):
    """Supprime un QCM"""
    try:
        qcm_service.delete_qcm(qcm_id, user_id=str(current_user.id))
        return jsonify({'message': 'QCM supprimé avec succès'}), 200

    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la suppression: {str(e)}'}), 500


# ========================
# Routes Questions
# ========================

@bp.route('/questions', methods=['GET'])
@require_role('admin')
def get_questions(current_user):
    """Récupère la liste paginée des questions avec filtres"""
    try:
        # Paramètres de pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        skip = (page - 1) * per_page

        # Filtres
        filters = {}
        type_question = request.args.get('type_question')
        if type_question:
            filters['type_question'] = type_question

        qcm_id = request.args.get('qcm_id')
        if qcm_id:
            filters['qcm_id'] = qcm_id

        search = request.args.get('search')
        if search:
            filters['search'] = search

        # Récupérer les questions
        questions, total = question_service.get_questions(filters=filters, skip=skip, limit=per_page)

        return jsonify({
            'questions': [question_response_schema.dump(question) for question in questions],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        return jsonify({'message': f'Erreur lors de la récupération des questions: {str(e)}'}), 500


@bp.route('/questions/<question_id>', methods=['GET'])
@require_role('admin')
def get_question(question_id, current_user):
    """Récupère les détails d'une question"""
    try:
        question = question_service.get_question_by_id(question_id)
        if not question:
            return jsonify({'message': 'Question non trouvée'}), 404

        return jsonify(question_response_schema.dump(question)), 200

    except Exception as e:
        return jsonify({'message': f'Erreur: {str(e)}'}), 500


@bp.route('/questions', methods=['POST'])
@require_role('admin')
def create_question(current_user):
    """Crée une nouvelle question"""
    try:
        data = request.get_json()

        # Validation avec Marshmallow
        errors = question_create_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400

        validated_data = question_create_schema.load(data)

        # Créer la question via le service
        question = question_service.create_question(validated_data, user_id=str(current_user.id))

        return jsonify(question_response_schema.dump(question)), 201

    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la création: {str(e)}'}), 500


@bp.route('/questions/<question_id>', methods=['PUT'])
@require_role('admin')
def update_question(question_id, current_user):
    """Met à jour une question"""
    try:
        data = request.get_json()

        # Validation avec Marshmallow
        errors = question_update_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400

        validated_data = question_update_schema.load(data)

        # Mettre à jour via le service
        question = question_service.update_question(question_id, validated_data, user_id=str(current_user.id))

        return jsonify(question_response_schema.dump(question)), 200

    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la mise à jour: {str(e)}'}), 500


@bp.route('/questions/<question_id>', methods=['DELETE'])
@require_role('admin')
def delete_question(question_id, current_user):
    """Supprime une question"""
    try:
        question_service.delete_question(question_id, user_id=str(current_user.id))
        return jsonify({'message': 'Question supprimée avec succès'}), 200

    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la suppression: {str(e)}'}), 500


# ========================
# Routes Statistiques
# ========================

@bp.route('/statistics/dashboard', methods=['GET'])
@require_role('admin')
def get_dashboard_stats(current_user):
    """Récupère les statistiques complètes du dashboard"""
    try:
        stats = admin_stats_service.get_full_dashboard_stats()
        return jsonify(stats), 200

    except Exception as e:
        return jsonify({'message': f'Erreur lors de la récupération des statistiques: {str(e)}'}), 500


@bp.route('/statistics/metrics', methods=['GET'])
@require_role('admin')
def get_metrics(current_user):
    """Récupère les métriques principales"""
    try:
        metrics = admin_stats_service.get_dashboard_metrics()
        return jsonify(metrics), 200

    except Exception as e:
        return jsonify({'message': f'Erreur lors de la récupération des métriques: {str(e)}'}), 500


@bp.route('/statistics/users-by-role', methods=['GET'])
@require_role('admin')
def get_users_by_role_stats(current_user):
    """Récupère la répartition des utilisateurs par rôle"""
    try:
        stats = admin_stats_service.get_users_by_role()
        return jsonify(stats), 200

    except Exception as e:
        return jsonify({'message': f'Erreur lors de la récupération des statistiques: {str(e)}'}), 500


@bp.route('/statistics/qcms-by-status', methods=['GET'])
@require_role('admin')
def get_qcms_by_status_stats(current_user):
    """Récupère la répartition des QCM par statut"""
    try:
        stats = admin_stats_service.get_qcms_by_status()
        return jsonify(stats), 200

    except Exception as e:
        return jsonify({'message': f'Erreur lors de la récupération des statistiques: {str(e)}'}), 500


