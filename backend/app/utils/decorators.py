"""
Décorateurs utilitaires pour la protection des routes
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User, UserRole


def require_role(role_name):
    """
    Décorateur vérifiant que l'utilisateur a un rôle spécifique
    Passe l'utilisateur courant comme premier argument à la fonction décorée
    
    Usage:
        @require_role('admin')
        def my_function(current_user):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({'message': 'Utilisateur non trouvé'}), 404
            
            # Vérifier le rôle
            if role_name == 'admin' and user.role != UserRole.ADMIN:
                return jsonify({'message': 'Accès réservé aux administrateurs'}), 403
            elif role_name == 'enseignant' and user.role != UserRole.ENSEIGNANT:
                return jsonify({'message': 'Accès réservé aux enseignants'}), 403
            elif role_name == 'etudiant' and user.role != UserRole.ETUDIANT:
                return jsonify({'message': 'Accès réservé aux étudiants'}), 403
            
            # Passer l'utilisateur comme premier argument
            return f(user, *args, **kwargs)
        
        return decorated_function
    return decorator


def require_complete_profile(f):
    """
    Décorateur vérifiant que l'utilisateur a un profil complet
    (profil Étudiant OU Enseignant)
    
    Les admins sont exemptés de cette vérification.
    
    À utiliser sur toutes les routes qui nécessitent un profil complet.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
        # Admins exemptés
        if user.role == UserRole.ADMIN:
            return f(*args, **kwargs)
        
        # Vérifier si l'utilisateur a un profil complet
        has_profile = (
            (hasattr(user, 'etudiant_profil') and user.etudiant_profil is not None) or
            (hasattr(user, 'enseignant_profil') and user.enseignant_profil is not None)
        )
        
        if not has_profile:
            return jsonify({
                'message': 'Profil incomplet. Veuillez terminer votre inscription.',
                'requiresOnboarding': True
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function
