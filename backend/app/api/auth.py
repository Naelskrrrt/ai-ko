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
        
        # Créer l'utilisateur avec un rôle temporaire ADMIN
        # Le rôle sera définitivement défini lors de l'onboarding
        user = User(
            email=validated_data['email'],
            name=validated_data['name'],
            role=UserRole.ADMIN,  # Rôle temporaire
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
            'token': access_token,
            'requiresOnboarding': True  # Flag indiquant que l'onboarding est requis
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

        # Vérifier si l'utilisateur est actif (validé par admin)
        if not user.is_active:
            return jsonify({'message': 'Votre compte est en attente de validation par un administrateur'}), 403
        
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
        
        # Forcer le rechargement des relations pour s'assurer qu'elles sont à jour
        db.session.refresh(user)
        
        # Forcer le chargement explicite des relations
        _ = user.etudiant_profil
        _ = user.enseignant_profil
        
        etudiant_profil = getattr(user, 'etudiant_profil', None)
        enseignant_profil = getattr(user, 'enseignant_profil', None)
        has_profile = (etudiant_profil is not None) or (enseignant_profil is not None)
        
        # Créer le dict utilisateur avec profil
        user_dict = user.to_dict(include_profil=True)
        
        return jsonify({
            'user': user_response_schema.dump(user_dict),
            'onboardingComplete': has_profile,
            'requiresOnboarding': not has_profile
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erreur: {str(e)}'}), 500


@bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Mettre à jour le profil de l'utilisateur connecté"""
    try:
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({'message': 'Non authentifié'}), 401
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        
        # Champs modifiables uniquement
        if 'name' in data:
            user.name = data['name'].strip() if data['name'] else None
        
        if 'telephone' in data:
            telephone = data['telephone'].strip() if data['telephone'] else None
            # Validation basique du téléphone
            if telephone and len(telephone) > 20:
                return jsonify({'message': 'Le numéro de téléphone est trop long'}), 400
            user.telephone = telephone
        
        if 'adresse' in data:
            user.adresse = data['adresse'].strip() if data['adresse'] else None
        
        if 'dateNaissance' in data or 'date_naissance' in data:
            date_naissance = data.get('dateNaissance') or data.get('date_naissance')
            if date_naissance:
                try:
                    from datetime import datetime
                    if isinstance(date_naissance, str):
                        user.date_naissance = datetime.fromisoformat(date_naissance.replace('Z', '+00:00')).date()
                    else:
                        user.date_naissance = date_naissance
                except (ValueError, TypeError) as e:
                    return jsonify({'message': f'Format de date invalide: {str(e)}'}), 400
            else:
                user.date_naissance = None
        
        db.session.commit()
        
        return jsonify(user_response_schema.dump(user.to_dict())), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erreur lors de la mise à jour: {str(e)}'}), 500


@bp.route('/complete-profile', methods=['POST'])
@jwt_required()
def complete_profile():
    """Finaliser le profil après onboarding - Créer Étudiant ou Enseignant"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not user_id:
            return jsonify({'message': 'Non authentifié'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
        role = data.get('role')  # 'etudiant' ou 'enseignant'
        
        if role == 'etudiant':
            # Vérifier qu'un profil étudiant n'existe pas déjà
            if hasattr(user, 'etudiant_profil') and user.etudiant_profil:
                return jsonify({'message': 'Profil étudiant déjà existant'}), 400
            
            # Importer Etudiant
            from app.models.etudiant import Etudiant
            from datetime import datetime
            
            # Valider le numéro d'étudiant requis
            numero_etudiant = data.get('numeroEtudiant')
            if not numero_etudiant:
                return jsonify({'message': 'Numéro d\'étudiant requis'}), 400
            
            # Vérifier l'unicité du numéro d'étudiant
            existing_etudiant = Etudiant.query.filter_by(numero_etudiant=numero_etudiant).first()
            if existing_etudiant:
                # Générer un numéro unique automatiquement
                import random
                prefix = numero_etudiant[:2] if len(numero_etudiant) >= 2 else 'ET'
                for attempt in range(100):  # Maximum 100 tentatives
                    new_numero = f"{prefix}{random.randint(1000, 9999)}"
                    if not Etudiant.query.filter_by(numero_etudiant=new_numero).first():
                        numero_etudiant = new_numero
                        break
                else:
                    # Si on n'arrive pas à générer un numéro unique après 100 tentatives
                    return jsonify({'message': 'Impossible de générer un numéro d\'étudiant unique'}), 500
            
            # Créer le profil étudiant
            etudiant = Etudiant(
                user_id=user_id,
                numero_etudiant=numero_etudiant,
                etablissement_id=data.get('etablissementId'),
                niveau_id=data.get('niveauId'),
                mention_id=data.get('mentionId'),
                parcours_id=data.get('parcoursId'),
                annee_admission=data.get('anneeAdmission'),
                actif=False  # Désactivé par défaut, nécessite validation admin
            )
            
            # Mettre à jour le rôle et les infos complémentaires
            user.role = UserRole.ETUDIANT
            user.is_active = False  # Désactiver par défaut, nécessite validation admin
            if data.get('telephone'):
                user.telephone = data.get('telephone')
            if data.get('adresse'):
                user.adresse = data.get('adresse')
            if data.get('dateNaissance'):
                try:
                    user.date_naissance = datetime.fromisoformat(data.get('dateNaissance').replace('Z', '+00:00')).date()
                except (ValueError, TypeError):
                    pass
            
            db.session.add(etudiant)
            
        elif role == 'enseignant':
            # Vérifier qu'un profil enseignant n'existe pas déjà
            if hasattr(user, 'enseignant_profil') and user.enseignant_profil:
                return jsonify({'message': 'Profil enseignant déjà existant'}), 400
            
            # Importer Enseignant
            from app.models.enseignant import Enseignant
            from datetime import datetime
            
            # Valider le numéro d'enseignant requis
            numero_enseignant = data.get('numeroEnseignant')
            if not numero_enseignant:
                return jsonify({'message': 'Numéro d\'enseignant requis'}), 400
            
            # Vérifier l'unicité du numéro d'enseignant
            existing_enseignant = Enseignant.query.filter_by(numero_enseignant=numero_enseignant).first()
            if existing_enseignant:
                # Générer un numéro unique automatiquement
                import random
                prefix = numero_enseignant[:2] if len(numero_enseignant) >= 2 else 'EN'
                for attempt in range(100):  # Maximum 100 tentatives
                    new_numero = f"{prefix}{random.randint(1000, 9999)}"
                    if not Enseignant.query.filter_by(numero_enseignant=new_numero).first():
                        numero_enseignant = new_numero
                        break
                else:
                    # Si on n'arrive pas à générer un numéro unique après 100 tentatives
                    return jsonify({'message': 'Impossible de générer un numéro d\'enseignant unique'}), 500
            
            # Gérer date_embauche avec gestion d'erreur
            date_embauche = None
            if data.get('dateEmbauche'):
                try:
                    date_embauche = datetime.fromisoformat(data.get('dateEmbauche').replace('Z', '+00:00')).date()
                except (ValueError, TypeError):
                    # Logger l'erreur mais continuer sans date
                    pass
            
            # Créer le profil enseignant (specialite est géré via les matières, pas ici)
            enseignant = Enseignant(
                user_id=user_id,
                numero_enseignant=numero_enseignant,
                etablissement_id=data.get('etablissementId'),
                grade=data.get('grade'),
                departement=data.get('departement'),
                bureau=data.get('bureau'),
                date_embauche=date_embauche,
                actif=False  # Désactivé par défaut, nécessite validation admin
            )
            
            # Mettre à jour le rôle et les infos complémentaires
            user.role = UserRole.ENSEIGNANT
            user.is_active = False  # Désactiver par défaut, nécessite validation admin
            if data.get('telephone'):
                user.telephone = data.get('telephone')
            if data.get('adresse'):
                user.adresse = data.get('adresse')
            
            db.session.add(enseignant)
        else:
            return jsonify({'message': 'Rôle invalide. Doit être "etudiant" ou "enseignant"'}), 400
        
        # Commit avant de créer le nouveau token pour s'assurer que le rôle est bien enregistré
        db.session.commit()

        # Créer une notification admin pour la validation
        try:
            from app.models.admin_notification import AdminNotification
            role_name = "étudiant" if role == "etudiant" else "enseignant"
            notification = AdminNotification(
                type='pending_user',
                target_user_id=user_id,
                message=f'Nouvel {role_name} en attente de validation: {user.name} ({user.email})'
            )
            db.session.add(notification)
            db.session.commit()

            # Émettre événement WebSocket vers tous les admins connectés
            from app.events.notifications import notify_admin_pending_user
            notify_admin_pending_user(user_id, user.to_dict(include_profil=True))

        except Exception as notification_error:
            # Ne pas bloquer l'inscription si la notification échoue
            print(f"Erreur lors de la création de la notification admin: {notification_error}")
            db.session.rollback()  # Annuler la création de la notification seulement
        
        # Recharger l'utilisateur depuis la DB pour s'assurer que les relations sont chargées
        db.session.refresh(user)
        # Forcer le rechargement des relations
        if role == 'etudiant':
            _ = user.etudiant_profil  # Forcer le chargement de la relation
        elif role == 'enseignant':
            _ = user.enseignant_profil  # Forcer le chargement de la relation
        
        # Créer un nouveau token JWT avec le nouveau rôle
        # Le token précédent contenait le rôle ADMIN, maintenant on crée un nouveau token avec le bon rôle
        new_access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=7)
        )
        
        # Créer la réponse avec le nouveau token
        response = make_response(jsonify({
            'message': 'Profil complété avec succès',
            'user': user_response_schema.dump(user.to_dict(include_profil=True)),
            'token': new_access_token  # Retourner le nouveau token
        }), 200)
        
        # Mettre à jour les cookies avec le nouveau token (qui contient le bon rôle)
        set_access_cookies(response, new_access_token)
        
        return response
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erreur lors de la création du profil: {str(e)}'}), 500


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
                # Créer un nouvel utilisateur avec rôle temporaire ADMIN
                # Le rôle sera définitivement défini lors de l'onboarding
                user = User(
                    email=email,
                    name=name,
                    google_id=google_id,
                    avatar=avatar,
                    role=UserRole.ADMIN,  # Rôle temporaire
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

