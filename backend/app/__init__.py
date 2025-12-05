"""
Application Flask principale
"""
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from prometheus_flask_exporter import PrometheusMetrics
from datetime import timedelta
import os
from pathlib import Path

# Charger les variables d'environnement depuis .env
try:
    from dotenv import load_dotenv
    # Chercher le fichier .env dans le répertoire backend ou à la racine
    env_path = Path(__file__).parent.parent / '.env'
    if not env_path.exists():
        env_path = Path(__file__).parent.parent.parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"[INFO] Variables d'environnement chargées depuis: {env_path}")
    else:
        print("[WARNING] Fichier .env non trouvé. Les variables d'environnement doivent être définies autrement.")
except ImportError:
    print("[WARNING] python-dotenv non installé. Installez-le avec: pip install python-dotenv")
except Exception as e:
    print(f"[WARNING] Erreur lors du chargement du .env: {e}")

# Extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
# Flask-WTF CSRF n'est pas utilisé car on utilise JWT CSRF protection pour les API
# Si besoin de formulaires HTML plus tard, réactiver avec: from flask_wtf.csrf import CSRFProtect

# WebSocket
from app.extensions import socketio


def create_app(config=None):
    """Factory pour créer l'application Flask"""
    app = Flask(__name__)

    # Configuration du mode debug
    # Supporte FLASK_DEBUG=1, FLASK_DEBUG=True, ou FLASK_ENV=development
    flask_debug = os.getenv('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    flask_env = os.getenv('FLASK_ENV', '').lower()
    app.config['DEBUG'] = flask_debug or flask_env == 'development'

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

    # Configuration de la base de données
    # Priorité: DATABASE_URL > PostgreSQL Docker > SQLite local
    database_url = os.getenv('DATABASE_URL')

    # Si DATABASE_URL est défini et pointe vers SQLite, utiliser le chemin absolu
    if database_url and database_url.startswith('sqlite'):
        # Convertir le chemin relatif en chemin absolu
        if 'backend/app.db' in database_url:
            basedir = os.path.abspath(os.path.dirname(__file__))
            db_path = os.path.join(basedir, '..', 'app.db')
            database_url = f'sqlite:///{db_path}'
        print(f"[INFO] Utilisation de SQLite (forcé via DATABASE_URL): {database_url}")
    elif not database_url:
        # Essayer de détecter PostgreSQL Docker - tester une vraie connexion
        import socket
        postgres_available = False
        try:
            # Vérifier si le port est ouvert
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', 5432))
            sock.close()

            if result == 0:
                # Le port est ouvert, tester une vraie connexion PostgreSQL
                try:
                    # Essayer d'importer psycopg2
                    try:
                        import psycopg2
                    except ImportError:
                        # psycopg2 non installé, utiliser SQLite
                        raise ImportError("psycopg2 non installé")
                    
                    postgres_user = os.getenv('POSTGRES_USER', 'root')
                    postgres_password = os.getenv('POSTGRES_PASSWORD', 'root')
                    postgres_db = os.getenv('POSTGRES_DB', 'systeme_intelligent')
                    
                    # Tester la connexion
                    conn = psycopg2.connect(
                        host='localhost',
                        port=5432,
                        user=postgres_user,
                        password=postgres_password,
                        database=postgres_db,
                        connect_timeout=2
                    )
                    conn.close()
                    postgres_available = True
                    database_url = f'postgresql://{postgres_user}:{postgres_password}@localhost:5432/{postgres_db}'
                    print(f"[INFO] Utilisation de PostgreSQL: {database_url.split('@')[1]}")
                except (ImportError, Exception) as e:
                    # psycopg2 non installé ou connexion échouée
                    print(f"[INFO] PostgreSQL non disponible, utilisation de SQLite: {str(e)}")
                    postgres_available = False
        except Exception as e:
            print(f"[INFO] Détection PostgreSQL échouée: {e}")
            postgres_available = False

        # Si PostgreSQL n'est pas disponible, utiliser SQLite
        if not postgres_available:
            basedir = os.path.abspath(os.path.dirname(__file__))
            db_path = os.path.join(basedir, '..', 'app.db')
            database_url = f'sqlite:///{db_path}'
            print(f"[INFO] Utilisation de SQLite: {db_path}")

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configuration du pool de connexions pour éviter les problèmes de connexion intermittents
    # Particulièrement important pour les déploiements cloud (Railway, Heroku, etc.)
    engine_options = {
        'pool_size': 5,           # Nombre de connexions permanentes
        'pool_recycle': 300,      # Recycler les connexions après 5 minutes
        'pool_pre_ping': True,    # Vérifier la connexion avant utilisation
        'pool_timeout': 20,       # Timeout pour obtenir une connexion (réduit)
        'max_overflow': 10,       # Connexions supplémentaires si besoin
    }
    
    # Ajouter timeout de connexion pour PostgreSQL
    if database_url and 'postgresql' in database_url:
        engine_options['connect_args'] = {
            'connect_timeout': 10,  # Timeout de connexion à la DB (10 secondes)
            'options': '-c statement_timeout=30000'  # Timeout des requêtes (30 secondes)
        }
    
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_options
    app.config['JWT_SECRET_KEY'] = os.getenv(
        'JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_TOKEN_LOCATION'] = ['headers']  # Utiliser uniquement les headers pour éviter les conflits CSRF
    app.config['JWT_COOKIE_NAME'] = 'auth_token'
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Désactiver CSRF pour simplifier (JWT est déjà sécurisé)
    app.config['JWT_CSRF_CHECK_FORM'] = False
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

    # Configuration CSRF
    # Désactiver Flask-WTF CSRF pour les routes API (on utilise JWT CSRF protection)
    # Flask-WTF CSRF est principalement pour les formulaires HTML
    app.config['WTF_CSRF_ENABLED'] = False
    app.config['WTF_CSRF_TIME_LIMIT'] = None

    # CORS
    cors_origins = os.getenv(
        'CORS_ORIGINS', 'http://localhost:3000').split(',')
    # Nettoyer les origines (enlever les espaces)
    cors_origins = [origin.strip() for origin in cors_origins]

    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-TOKEN"],
            "expose_headers": ["Content-Type", "Authorization", "X-CSRF-TOKEN", "Content-Disposition", "Content-Length"],
            "supports_credentials": True,
            "max_age": 3600
        },
        r"/api/docs/*": {
            "origins": "*",  # Swagger UI accessible depuis n'importe où
            "methods": ["GET", "OPTIONS"],
        }
    })

    # Initialiser extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app)
    # Ne pas initialiser CSRF globalement car on utilise JWT CSRF protection pour les API
    # csrf.init_app(app)  # Désactivé - on utilise JWT CSRF protection à la place
    
    # Ajouter des claims additionnels au JWT (incluant le rôle)
    @jwt.additional_claims_loader
    def add_claims_to_access_token(identity):
        """Ajoute le rôle de l'utilisateur au token JWT"""
        from app.models.user import User
        user = User.query.get(identity)
        if user:
            return {
                'role': user.role.value if hasattr(user.role, 'value') else str(user.role),
                'email': user.email,
                'name': user.name
            }
        return {}

    # Prometheus metrics
    PrometheusMetrics(app)

    # Enregistrer blueprints
    from app.api.health import bp as health_bp
    from app.api.auth import bp as auth_bp
    from app.api.docs import api_bp as docs_bp
    from app.api.admin import bp as admin_bp
    from app.api.seed import bp as seed_bp
    from app.api.referentiels import bp as referentiels_bp
    from app.api.qcm_api import bp as qcm_api_bp
    from app.api.users_api import bp as users_api_bp
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp)
    app.register_blueprint(docs_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(seed_bp, url_prefix='/api')
    app.register_blueprint(referentiels_bp)  # Niveaux et Matières
    app.register_blueprint(qcm_api_bp)  # QCM étudiant, QCM, résultats, sessions
    app.register_blueprint(users_api_bp)  # Enseignants, Étudiants, Classes

    # Importer les événements WebSocket (nécessaire pour enregistrer les handlers)
    from app.events import notifications

    return app
