"""
Décorateurs pour la protection des routes
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.models.user import User


def require_role(*allowed_roles):
    """
    Décorateur pour protéger une route en fonction du rôle de l'utilisateur.
    
    Usage:
        @bp.route('/qcm', methods=['POST'])
        @require_role('enseignant', 'admin')
        def create_qcm():
            # Seuls les enseignants et admins peuvent accéder
            pass
    
    Args:
        *allowed_roles: Rôles autorisés à accéder à la route (ex: 'admin', 'enseignant', 'etudiant')
    
    Returns:
        Fonction décorée qui vérifie le rôle avant d'exécuter la route
    
    Raises:
        401: Si l'utilisateur n'est pas authentifié
        403: Si l'utilisateur n'a pas le rôle requis
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            # Vérifier que le JWT est valide
            verify_jwt_in_request()
            
            # Récupérer l'identité depuis le token JWT
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({'message': 'Token invalide ou expiré'}), 401
            
            # Récupérer l'utilisateur depuis la base de données
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({'message': 'Utilisateur non trouvé'}), 404
            
            # Vérifier que l'utilisateur a un rôle autorisé
            user_role_value = user.role.value if user.role else None
            
            if user_role_value not in allowed_roles:
                return jsonify({
                    'message': f'Accès refusé. Rôles autorisés: {", ".join(allowed_roles)}',
                    'your_role': user_role_value
                }), 403
            
            # Ajouter l'utilisateur aux kwargs pour faciliter l'accès dans la route
            kwargs['current_user'] = user
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator



