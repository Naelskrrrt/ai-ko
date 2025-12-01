"""
Documentation API avec Swagger/OpenAPI
"""
from flask import Blueprint
from flask_restx import Api, Resource, fields, Namespace
from flask_jwt_extended import jwt_required

# Créer le namespace pour la documentation
api_bp = Blueprint('api_docs', __name__, url_prefix='/api')
api = Api(
    api_bp,
    version='1.0',
    title='AI-KO API',
    description='Documentation complète de l\'API AI-KO - Système Intelligent',
    doc='/docs/swagger/',
    prefix=''  # Pas de préfixe car le blueprint a déjà url_prefix='/api'
)

# Namespace pour les health checks
health_ns = Namespace(
    'health', description='Endpoints de vérification de santé')
api.add_namespace(health_ns)

# Namespace pour l'authentification
auth_ns = Namespace('auth', description='Endpoints d\'authentification')
api.add_namespace(auth_ns)

# Namespace pour l'administration (admin uniquement)
admin_ns = Namespace(
    'admin', description='Endpoints d\'administration (accès admin uniquement)')
api.add_namespace(admin_ns)

# Import et ajout des namespaces QCM et Correction (optionnels)
try:
    from app.api.qcm import api as qcm_api
    api.add_namespace(qcm_api, path='/qcm')
except ImportError as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(f"Namespace QCM non disponible: {e}")

try:
    from app.api.qcm_etudiant import api as qcm_etudiant_api
    api.add_namespace(qcm_etudiant_api, path='/qcm-etudiant')
except ImportError as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(f"Namespace QCM Étudiant non disponible: {e}")

try:
    from app.api.correction import api as correction_api
    api.add_namespace(correction_api, path='/correction')
except ImportError as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(f"Namespace Correction non disponible: {e}")

# Import et ajout des nouveaux namespaces (Système éducatif)
from app.api.niveau import api as niveau_api
from app.api.matiere import api as matiere_api
from app.api.classe import api as classe_api
from app.api.session_examen import api as session_api
from app.api.resultat import api as resultat_api

# Ajouter les nouveaux namespaces
api.add_namespace(niveau_api, path='/niveaux')
api.add_namespace(matiere_api, path='/matieres')
api.add_namespace(classe_api, path='/classes')
api.add_namespace(session_api, path='/sessions')
api.add_namespace(resultat_api, path='/resultats')

# Import et ajout des nouveaux namespaces (Refonte - Enseignants/Étudiants)
from app.api.etablissement import api as etablissement_api
from app.api.mention import api as mention_api
from app.api.parcours import api as parcours_api
from app.api.enseignant import api as enseignant_api
from app.api.etudiant import api as etudiant_api

# Ajouter les nouveaux namespaces (refonte)
api.add_namespace(etablissement_api, path='/etablissements')
api.add_namespace(mention_api, path='/mentions')
api.add_namespace(parcours_api, path='/parcours')
api.add_namespace(enseignant_api, path='/enseignants')
api.add_namespace(etudiant_api, path='/etudiants')

# Modèles de données pour la documentation
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

# Endpoints de documentation Admin


@admin_ns.route('/users/<user_id>/status')
@admin_ns.doc('toggle_user_status')
class ToggleUserStatus(Resource):
    @admin_ns.marshal_with(user_model, code=200, description='Statut utilisateur modifié avec succès')
    @admin_ns.response(400, 'Erreur de validation', error_model)
    @admin_ns.response(401, 'Non authentifié', error_model)
    @admin_ns.response(403, 'Accès refusé (rôle admin requis)', error_model)
    @admin_ns.response(404, 'Utilisateur non trouvé', error_model)
    @admin_ns.response(500, 'Erreur serveur', error_model)
    def patch(self, user_id):
        """
        Activer/Désactiver un utilisateur

        Bascule le statut d'activation d'un utilisateur (emailVerified).
        Seuls les administrateurs peuvent utiliser cet endpoint.
        Un administrateur ne peut pas modifier son propre statut.

        **Méthode HTTP:** PATCH
        **URL:** `/api/admin/users/{user_id}/status`
        **Headers requis:**
        - `Authorization: Bearer {token}` (token JWT admin)

        **Réponse:**
        - 200: Utilisateur avec statut mis à jour
        - 400: Erreur de validation (ex: tentative de modifier son propre statut)
        - 401: Token manquant ou invalide
        - 403: Utilisateur non admin
        - 404: Utilisateur non trouvé
        - 500: Erreur serveur
        """
        pass
