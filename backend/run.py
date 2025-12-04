"""
Point d'entrée de l'application Flask
"""
import os
from pathlib import Path

# Charger les variables d'environnement depuis .env AVANT d'importer l'application
# Cela garantit que les services (comme ai_service) ont accès aux variables
try:
    from dotenv import load_dotenv
    # Chercher le fichier .env dans le répertoire backend ou à la racine
    backend_dir = Path(__file__).parent
    env_path = backend_dir / '.env'
    if not env_path.exists():
        env_path = backend_dir.parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"[INFO] Variables d'environnement chargées depuis: {env_path}")
    else:
        print(f"[WARNING] Fichier .env non trouvé. Cherché dans: {env_path}")
        print("[WARNING] Les variables d'environnement doivent être définies autrement.")
except ImportError:
    print("[WARNING] python-dotenv non installé. Installez-le avec: pip install python-dotenv")
except Exception as e:
    print(f"[WARNING] Erreur lors du chargement du .env: {e}")

import sys
print(f"[INFO] Python version: {sys.version}")
print(f"[INFO] DATABASE_URL défini: {'Oui' if os.getenv('DATABASE_URL') else 'Non'}")

print("[INFO] Import de l'application Flask...")
try:
    from app import create_app, db
    from app.extensions import socketio
    import click
    print("[INFO] Imports réussis")
except Exception as e:
    print(f"[ERROR] Erreur lors des imports: {e}")
    import traceback
    traceback.print_exc()
    raise

print("[INFO] Création de l'application Flask...")
try:
    app = create_app()
    print("[INFO] Application Flask créée avec succès")
except Exception as e:
    print(f"[ERROR] Erreur lors de la création de l'app: {e}")
    import traceback
    traceback.print_exc()
    raise

# Initialiser la base de données au démarrage (créer les tables si elles n'existent pas)
def init_database():
    """Initialise la base de données en créant les tables manquantes"""
    print("[INFO] Début de l'initialisation de la base de données...")
    try:
        with app.app_context():
            # Importer tous les modèles pour que SQLAlchemy les connaisse
            from app.models import (
                User, UserRole, QCM, Question,
                Niveau, Matiere, Classe, SessionExamen, Resultat, AIModelConfig,
                Etablissement, Mention, Parcours, Enseignant, Etudiant, AdminNotification
            )
            
            # Vérifier si les tables existent
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            if 'users' not in existing_tables:
                print("[INFO] Tables non trouvées, création en cours...")
                db.create_all()
                print("[INFO] ✅ Tables créées avec succès!")
            else:
                print("[INFO] ✅ Base de données déjà initialisée")
    except Exception as e:
        print(f"[ERROR] Erreur lors de l'initialisation de la DB: {e}")
        import traceback
        traceback.print_exc()
        # Ne pas bloquer le démarrage - les migrations peuvent gérer ça
        print("[WARNING] L'application va démarrer malgré l'erreur DB. Les endpoints health répondront.")

# Ne PAS initialiser la DB au démarrage sur Railway/Production
# Les migrations Alembic gèrent la structure de la DB
# L'init au démarrage peut bloquer si la DB n'est pas immédiatement disponible
if os.getenv('FLASK_ENV') == 'development' or os.getenv('INIT_DB_ON_START') == '1':
    print("[INFO] Initialisation de la base de données (mode dev)...")
    try:
        init_database()
    except Exception as e:
        print(f"[ERROR] Erreur lors de l'init DB: {e}")
else:
    print("[INFO] Démarrage en mode production - skip init DB (utiliser les migrations)")

print("[INFO] Application Flask prête à recevoir des requêtes.")


@app.shell_context_processor
def make_shell_context():
    """Context pour Flask shell"""
    return {'db': db}


@app.cli.command('seed-users')
@click.option('--force', is_flag=True, help='Force la recréation même si les utilisateurs existent')
def seed_users_command(force):
    """Crée les utilisateurs de test (Admin, Enseignant, Étudiant)"""
    from scripts.seed_users import create_seed_data
    try:
        create_seed_data()
        click.echo('✅ Utilisateurs de test créés avec succès!')
    except Exception as e:
        click.echo(f'❌ Erreur: {str(e)}', err=True)
        raise


if __name__ == '__main__':
    # Mode développement uniquement
    # Supporte FLASK_DEBUG=1, FLASK_DEBUG=True, ou FLASK_ENV=development
    flask_debug = os.getenv('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    flask_env = os.getenv('FLASK_ENV', '').lower()
    debug_mode = flask_debug or flask_env == 'development' or app.config.get(
        'DEBUG', False)

    # Utiliser Flask standard au lieu de SocketIO pour éviter les conflits
    print(f"Démarrage du serveur sur http://0.0.0.0:{os.getenv('PORT', 5000)}")
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=debug_mode
    )
