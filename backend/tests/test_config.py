"""
Configuration et fixtures pytest pour les tests
"""
import pytest
import os
import sys
from datetime import datetime
from unittest.mock import MagicMock

# Mock transformers module avant d'importer l'app
sys.modules['transformers'] = MagicMock()
sys.modules['torch'] = MagicMock()

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.user import User, UserRole
from app.models.niveau import Niveau
from app.models.matiere import Matiere
from app.models.classe import Classe
from app.models.qcm import QCM
from app.models.question import Question
from app.models.session_examen import SessionExamen
from app.models.resultat import Resultat


@pytest.fixture(scope='session')
def app():
    """Crée une instance de l'application pour les tests"""
    # Configuration pour les tests
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Crée un client de test"""
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """Crée une session de base de données pour les tests"""
    with app.app_context():
        db.session.rollback()
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()
        yield db.session
        db.session.rollback()


def get_auth_headers(token):
    """Retourne les headers d'authentification avec le token"""
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
