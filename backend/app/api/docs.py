"""
Documentation API avec Swagger/OpenAPI

IMPORTANT: Ce fichier est uniquement pour la documentation Swagger.
Les vraies routes sont implémentées dans leurs fichiers respectifs :
- app/api/health.py
- app/api/auth.py
- app/api/admin.py
- etc.

Pour éviter les conflits de routes, ce fichier utilise le préfixe '/docs'
et ne crée AUCUNE route réelle sous '/api'.
"""
from flask import Blueprint
from flask_restx import Api, Resource, fields, Namespace
from flask_jwt_extended import jwt_required

# IMPORTANT: Blueprint avec préfixe '/docs' pour éviter tout conflit
api_bp = Blueprint('api_docs', __name__, url_prefix='/docs')
api = Api(
    api_bp,
    version='1.0',
    title='AI-KO API',
    description='Documentation complète de l\'API AI-KO - Système Intelligent',
    doc='/',  # Swagger UI accessible à /docs/
    prefix='/api'  # Prefix pour afficher les routes comme /api/... dans Swagger
)

# ============================================================================
# RÈGLE: Ne JAMAIS créer de classe Resource ici pour les endpoints existants
# Seuls les MODÈLES de données sont définis ici pour la documentation
# ============================================================================

# Namespace pour les health checks (DOCUMENTATION UNIQUEMENT)
health_ns = Namespace(
    'health', description='Endpoints de vérification de santé')
api.add_namespace(health_ns)

# Namespace pour l'authentification (DOCUMENTATION UNIQUEMENT)
auth_ns = Namespace('auth', description='Endpoints d\'authentification')
api.add_namespace(auth_ns)

# Namespace pour l'administration (DOCUMENTATION UNIQUEMENT)
# Namespace pour l'administration (DOCUMENTATION UNIQUEMENT)
admin_ns = Namespace(
    'admin', description='Endpoints d\'administration (accès admin uniquement)')
api.add_namespace(admin_ns)

# ============================================================================
# NE PAS importer de namespaces réels ici - ils ont leurs propres routes
# Cette section est commentée pour éviter tout conflit
# ============================================================================
# try:
#     from app.api.qcm import api as qcm_api
#     api.add_namespace(qcm_api, path='/qcm')
# except ImportError as e:
#     import logging
#     logger = logging.getLogger(__name__)
#     logger.warning(f"Namespace QCM non disponible: {e}")

# ============================================================================
# MODÈLES DE DONNÉES UNIQUEMENT (pas de routes)
# ============================================================================
# ============================================================================
# MODÈLES DE DONNÉES UNIQUEMENT (pas de routes)
# ============================================================================

register_model = api.model('RegisterRequest', {
    'name': fields.String(required=True, description='Nom de l\'utilisateur', example='John Doe'),
    'email': fields.String(required=True, description='Email de l\'utilisateur', example='john@example.com'),
    'password': fields.String(required=True, description='Mot de passe (min 6 caractères)', example='password123')
})

login_model = api.model('LoginRequest', {
    'email': fields.String(required=True, description='Email de l\'utilisateur', example='john@example.com'),
    'password': fields.String(required=True, description='Mot de passe', example='password123')
})

user_model = api.model('User', {
    'id': fields.String(description='ID unique de l\'utilisateur', example='123e4567-e89b-12d3-a456-426614174000'),
    'email': fields.String(description='Email de l\'utilisateur', example='john@example.com'),
    'name': fields.String(description='Nom de l\'utilisateur', example='John Doe'),
    'avatar': fields.String(description='URL de l\'avatar', example='https://example.com/avatar.jpg'),
    'emailVerified': fields.Boolean(description='Email vérifié', example=True),
    'createdAt': fields.String(description='Date de création', example='2025-01-21T10:00:00'),
    'updatedAt': fields.String(description='Date de mise à jour', example='2025-01-21T10:00:00')
})

auth_response_model = api.model('AuthResponse', {
    'user': fields.Nested(user_model, description='Informations de l\'utilisateur'),
    'token': fields.String(description='Token JWT pour l\'authentification', example='eyJ0eXAiOiJKV1QiLCJhbGc...')
})

error_model = api.model('Error', {
    'message': fields.String(description='Message d\'erreur', example='Email et mot de passe requis')
})

google_oauth_response = api.model('GoogleOAuthResponse', {
    'auth_url': fields.String(description='URL de redirection vers Google OAuth',
                              example='https://accounts.google.com/o/oauth2/v2/auth?...')
})

google_callback_model = api.model('GoogleCallbackRequest', {
    'code': fields.String(required=True, description='Code OAuth retourné par Google', example='4/0Aean...')
})

health_response_model = api.model('HealthResponse', {
    'status': fields.String(description='Statut du service', example='healthy'),
    'service': fields.String(description='Nom du service', example='ai-ko-backend')
})

detailed_health_response = api.model('DetailedHealthResponse', {
    'status': fields.String(description='Statut global', example='healthy'),
    'service': fields.String(description='Nom du service', example='ai-ko-backend'),
    'database': fields.String(description='Statut de la base de données', example='healthy'),
    'redis': fields.String(description='Statut de Redis', example='healthy')
})

# ============================================================================
# DOCUMENTATION DES ENDPOINTS (Classes Resource pour documentation Swagger uniquement)
# ATTENTION: Ces classes NE créent PAS de vraies routes car le blueprint est sur /docs
# Les vraies routes sont dans health.py, auth.py, admin.py, etc.
# ============================================================================

# Endpoints de documentation Health


@health_ns.route('/health')
@health_ns.doc('health')
class Health(Resource):
    @health_ns.marshal_with(health_response_model, code=200, description='Service opérationnel')
    def get(self):
        """
        Health check simple

        Vérifie que le service backend est opérationnel.
        Utilisé par Docker et Kubernetes pour les health checks.
        """
        pass


@health_ns.route('/health/detailed')
@health_ns.doc('health_detailed')
class HealthDetailed(Resource):
    @health_ns.marshal_with(detailed_health_response, code=200, description='Health check détaillé')
    @health_ns.response(503, 'Service non disponible', error_model)
    def get(self):
        """
        Health check détaillé

        Vérifie l'état de santé du service et de ses dépendances :
        - Base de données PostgreSQL
        - Redis
        """
        pass


@health_ns.route('/health/ready')
@health_ns.doc('health_ready')
class HealthReady(Resource):
    @health_ns.marshal_with(health_response_model, code=200, description='Service prêt')
    @health_ns.response(503, 'Service non prêt', error_model)
    def get(self):
        """
        Readiness check

        Indique si l'application est prête à recevoir du trafic.
        Utilisé par Kubernetes pour les readiness probes.
        """
        pass


@health_ns.route('/health/live')
@health_ns.doc('health_live')
class HealthLive(Resource):
    @health_ns.marshal_with(health_response_model, code=200, description='Service vivant')
    def get(self):
        """
        Liveness check

        Indique si l'application est vivante (mais pas forcément prête).
        Utilisé par Kubernetes pour les liveness probes.
        """
        pass

# Endpoints de documentation Auth


@auth_ns.route('/register')
@auth_ns.doc('register')
class Register(Resource):
    @auth_ns.expect(register_model)
    @auth_ns.marshal_with(auth_response_model, code=201, description='Utilisateur créé avec succès')
    @auth_ns.response(400, 'Erreur de validation', error_model)
    @auth_ns.response(500, 'Erreur serveur', error_model)
    def post(self):
        """
        Inscription d'un nouvel utilisateur

        Crée un nouveau compte utilisateur avec email et mot de passe.
        Le mot de passe est hashé avec bcrypt avant stockage.
        """
        pass


@auth_ns.route('/login')
@auth_ns.doc('login')
class Login(Resource):
    @auth_ns.expect(login_model)
    @auth_ns.marshal_with(auth_response_model, code=200, description='Connexion réussie')
    @auth_ns.response(400, 'Erreur de validation', error_model)
    @auth_ns.response(401, 'Identifiants incorrects', error_model)
    @auth_ns.response(500, 'Erreur serveur', error_model)
    def post(self):
        """
        Connexion d'un utilisateur

        Authentifie un utilisateur avec son email et mot de passe.
        Retourne un token JWT valide pendant 7 jours.
        """
        pass


@auth_ns.route('/logout')
@auth_ns.doc('logout')
class Logout(Resource):
    @auth_ns.response(200, 'Déconnexion réussie')
    @auth_ns.response(401, 'Non authentifié', error_model)
    def post(self):
        """
        Déconnexion

        Déconnecte l'utilisateur actuel. Le token JWT doit être fourni.
        """
        pass


@auth_ns.route('/me')
@auth_ns.doc('get_me')
class GetMe(Resource):
    @auth_ns.marshal_with(user_model, code=200, description='Profil utilisateur')
    @auth_ns.response(401, 'Non authentifié', error_model)
    @auth_ns.response(404, 'Utilisateur non trouvé', error_model)
    def get(self):
        """
        Récupérer le profil de l'utilisateur connecté

        Retourne les informations de l'utilisateur actuellement authentifié.
        Le token JWT peut être fourni via le header Authorization ou le cookie auth_token.
        """
        pass


@auth_ns.route('/oauth/google')
@auth_ns.doc('google_oauth')
class GoogleOAuth(Resource):
    @auth_ns.marshal_with(google_oauth_response, code=200, description='URL OAuth générée')
    @auth_ns.response(500, 'Google OAuth non configuré', error_model)
    def get(self):
        """
        Redirection vers Google OAuth

        Retourne l'URL de redirection vers Google pour l'authentification OAuth.
        L'utilisateur doit être redirigé vers cette URL.
        """
        pass


@auth_ns.route('/oauth/google/callback')
@auth_ns.doc('google_oauth_callback')
class GoogleOAuthCallback(Resource):
    @auth_ns.expect(google_callback_model)
    @auth_ns.marshal_with(auth_response_model, code=200, description='Connexion Google réussie')
    @auth_ns.response(400, 'Code OAuth manquant ou invalide', error_model)
    @auth_ns.response(500, 'Erreur OAuth', error_model)
    def post(self):
        """
        Callback Google OAuth

        Traite le code OAuth retourné par Google et crée/connecte l'utilisateur.
        Si l'utilisateur existe déjà (par email ou google_id), il est connecté.
        Sinon, un nouveau compte est créé.
        """
        pass


# ========================
# Modèles de réponse Admin
# ========================

# Note: Les modèles ci-dessous sont définis pour la documentation mais les endpoints
# réels sont implémentés dans admin.py. Ne pas créer de Resource ici pour éviter
# les conflits de routes.

toggle_status_response_model = api.model('ToggleStatusResponse', {
    'success': fields.Boolean(description='Succès de l\'opération', example=True),
    'message': fields.String(description='Message descriptif', example='L\'utilisateur John Doe a été activé'),
    'data': fields.Nested(api.model('ToggleStatusData', {
        'user': fields.Nested(user_model, description='Utilisateur mis à jour'),
        'previousStatus': fields.Boolean(description='Statut précédent', example=False),
        'newStatus': fields.Boolean(description='Nouveau statut', example=True)
    }))
})

toggle_status_error_model = api.model('ToggleStatusError', {
    'success': fields.Boolean(description='Succès de l\'opération', example=False),
    'message': fields.String(description='Message d\'erreur', example='Utilisateur non trouvé'),
    'error': fields.Nested(api.model('ErrorDetails', {
        'code': fields.String(description='Code d\'erreur', example='USER_NOT_FOUND'),
        'details': fields.String(description='Détails de l\'erreur', example='Utilisateur non trouvé')
    }))
})

# Note: L'endpoint PATCH /api/admin/users/{user_id}/status est implémenté dans admin.py
# Ne pas créer de Resource ici pour éviter les conflits de routes avec flask_restx
