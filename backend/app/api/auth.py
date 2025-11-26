"""
Endpoints d'authentification
"""
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt, set_access_cookies
from app import db
from app.models.user import User, UserRole
from app.schemas.user_schema import UserRegisterSchema, UserLoginSchema, UserResponseSchema
import os
import requests
from datetime import timedelta
from urllib.parse import quote_plus

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Instancier les schémas
register_schema = UserRegisterSchema()
login_schema = UserLoginSchema()
user_response_schema = UserResponseSchema()


@bp.route('/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        # Validation avec Marshmallow
        errors = register_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400
        
        validated_data = register_schema.load(data)
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter_by(email=validated_data['email']).first()
        if existing_user:
            return jsonify({'message': 'Cet email est déjà utilisé'}), 400
        
        # Déterminer le rôle (par défaut admin pour les premiers utilisateurs)
        role = UserRole.ADMIN
        if validated_data.get('role'):
            try:
                role = UserRole(validated_data['role'])
            except ValueError:
                return jsonify({'message': 'Rôle invalide'}), 400
        
        # Créer l'utilisateur
        user = User(
            email=validated_data['email'],
            name=validated_data['name'],
            role=role,
            email_verified=False
        )
        user.set_password(validated_data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Créer le token JWT
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=7)
        )
        
        response = make_response(jsonify({
            'user': user_response_schema.dump(user.to_dict()),
            'token': access_token
        }), 201)
        
        # Utiliser set_access_cookies pour configurer automatiquement les cookies JWT et CSRF
        set_access_cookies(response, access_token)
        
        return response
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erreur lors de l\'inscription: {str(e)}'}), 500


@bp.route('/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    try:
        data = request.get_json()
        
        # Validation avec Marshmallow
        errors = login_schema.validate(data)
        if errors:
            return jsonify({'message': 'Erreur de validation', 'errors': errors}), 400
        
        validated_data = login_schema.load(data)
        
        # Trouver l'utilisateur
        user = User.query.filter_by(email=validated_data['email']).first()
        
        if not user or not user.check_password(validated_data['password']):
            return jsonify({'message': 'Email ou mot de passe incorrect'}), 401
        
        # Créer le token JWT
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=7)
        )
        
        response = make_response(jsonify({
            'user': user_response_schema.dump(user.to_dict()),
            'token': access_token
        }), 200)
        
        # Utiliser set_access_cookies pour configurer automatiquement les cookies JWT et CSRF
        set_access_cookies(response, access_token)
        
        return response
        
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la connexion: {str(e)}'}), 500


@bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)
def logout():
    """Déconnexion (le token sera invalidé côté client)"""
    # Supprimer le cookie même si le token n'est pas valide
    response = make_response(jsonify({'message': 'Déconnexion réussie'}), 200)
    # Supprimer le cookie avec les mêmes paramètres que lors de la création
    response.set_cookie(
        'auth_token',
        '',
        max_age=0,
        httponly=True,
        secure=os.getenv('FLASK_ENV') == 'production',
        samesite='Lax',
        path='/'
    )
    return response


@bp.route('/me', methods=['GET'])
@jwt_required(optional=True)
def get_me():
    """Récupérer le profil de l'utilisateur connecté"""
    try:
        # Essayer de récupérer le token depuis le header Authorization ou le cookie
        user_id = get_jwt_identity()
        
        if not user_id:
            # Essayer de récupérer depuis le cookie
            token = request.cookies.get('auth_token')
            if token:
                try:
                    from flask_jwt_extended import decode_token
                    decoded = decode_token(token)
                    user_id = decoded.get('sub')
                except Exception:
                    return jsonify({'message': 'Token invalide'}), 401
            else:
                return jsonify({'message': 'Non authentifié'}), 401
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
        return jsonify(user_response_schema.dump(user.to_dict())), 200
        
    except Exception as e:
        return jsonify({'message': f'Erreur: {str(e)}'}), 500


@bp.route('/oauth/google', methods=['GET'])
def google_oauth():
    """Redirection vers Google OAuth"""
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:3000/api/auth/callback/google')
    
    if not google_client_id:
        return jsonify({'message': 'Google OAuth non configuré'}), 500
    
    # Encoder l'URI de redirection pour l'URL
    redirect_uri_encoded = quote_plus(redirect_uri)
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={google_client_id}&"
        f"redirect_uri={redirect_uri_encoded}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"access_type=offline"
    )
    
    return jsonify({'auth_url': auth_url}), 200


@bp.route('/oauth/google/callback', methods=['POST'])
def google_oauth_callback():
    """Callback Google OAuth - Créer ou connecter l'utilisateur"""
    try:
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify({'message': 'Code OAuth manquant'}), 400
        
        google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:3000/api/auth/callback/google')
        
        if not google_client_id or not google_client_secret:
            return jsonify({'message': 'Google OAuth non configuré'}), 500
        
        # Échanger le code contre un token
        token_response = requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': google_client_id,
            'client_secret': google_client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        })
        
        if token_response.status_code != 200:
            return jsonify({'message': 'Erreur lors de l\'échange du token'}), 400
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        # Récupérer les informations utilisateur
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_info_response.status_code != 200:
            return jsonify({'message': 'Erreur lors de la récupération des infos utilisateur'}), 400
        
        user_info = user_info_response.json()
        google_id = user_info.get('id')
        email = user_info.get('email')
        name = user_info.get('name')
        avatar = user_info.get('picture')
        
        # Chercher ou créer l'utilisateur
        user = User.query.filter_by(google_id=google_id).first()
        
        if not user:
            # Vérifier si un utilisateur avec cet email existe déjà
            user = User.query.filter_by(email=email).first()
            if user:
                # Lier le compte Google à l'utilisateur existant
                user.google_id = google_id
                user.avatar = avatar
                user.email_verified = True
            else:
                # Créer un nouvel utilisateur
                user = User(
                    email=email,
                    name=name,
                    google_id=google_id,
                    avatar=avatar,
                    role=UserRole.ADMIN,  # Par défaut admin pour OAuth
                    email_verified=True
                )
                db.session.add(user)
        else:
            # Mettre à jour les informations
            user.email = email
            user.name = name
            user.avatar = avatar
            user.email_verified = True
        
        db.session.commit()
        
        # Créer le token JWT
        jwt_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=7)
        )
        
        response = make_response(jsonify({
            'user': user_response_schema.dump(user.to_dict()),
            'token': jwt_token
        }), 200)
        
        # Utiliser set_access_cookies pour configurer automatiquement les cookies JWT et CSRF
        set_access_cookies(response, jwt_token)
        
        return response
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erreur OAuth: {str(e)}'}), 500

