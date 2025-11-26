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

from app import create_app, db

app = create_app()


@app.shell_context_processor
def make_shell_context():
    """Context pour Flask shell"""
    return {'db': db}


if __name__ == '__main__':
    # Mode développement uniquement
    # Supporte FLASK_DEBUG=1, FLASK_DEBUG=True, ou FLASK_ENV=development
    flask_debug = os.getenv('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    flask_env = os.getenv('FLASK_ENV', '').lower()
    debug_mode = flask_debug or flask_env == 'development' or app.config.get(
        'DEBUG', False)

    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=True
    )
