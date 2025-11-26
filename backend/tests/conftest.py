"""
Configuration pytest pour les tests
"""
import pytest
import os
import sys
import tempfile
from unittest.mock import MagicMock

# Mock ML/PDF modules avant d'importer l'app
sys.modules['transformers'] = MagicMock()
sys.modules['torch'] = MagicMock()
sys.modules['PyPDF2'] = MagicMock()
sys.modules['sentence_transformers'] = MagicMock()

from app import create_app, db
from app.models.user import User, UserRole
from app.models.qcm import QCM
from app.models.question import Question
import bcrypt


@pytest.fixture(scope='session')
def app():
    """Crée une instance de l'application pour les tests"""
    # Créer un fichier de base de données temporaire
    db_fd, db_path = tempfile.mkstemp()

    # Configuration de test
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key',
        'JWT_SECRET_KEY': 'test-jwt-secret-key',
        'WTF_CSRF_ENABLED': False
    }

    app = create_app()
    app.config.update(test_config)

    # Créer les tables
    with app.app_context():
        db.create_all()

    yield app

    # Nettoyage
    with app.app_context():
        db.drop_all()

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture(scope='function')
def client(app):
    """Crée un client de test"""
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """Crée une session de base de données pour les tests"""
    with app.app_context():
        yield db.session
        db.session.rollback()


@pytest.fixture(scope='function')
def admin_user(app, db_session):
    """Crée un utilisateur admin pour les tests"""
    with app.app_context():
        password = 'admin123'
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        user = User(
            name='Admin User',
            email='admin@test.com',
            password=hashed.decode('utf-8'),
            role=UserRole.ADMIN,
            email_verified=True
        )
        db_session.add(user)
        db_session.commit()

        return user


@pytest.fixture(scope='function')
def normal_user(app, db_session):
    """Crée un utilisateur normal pour les tests"""
    with app.app_context():
        password = 'user123'
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        user = User(
            name='Normal User',
            email='user@test.com',
            password=hashed.decode('utf-8'),
            role=UserRole.USER,
            email_verified=True
        )
        db_session.add(user)
        db_session.commit()

        return user


@pytest.fixture(scope='function')
def admin_token(client, admin_user):
    """Crée un token JWT pour l'admin"""
    response = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'admin123'
    })
    data = response.get_json()
    return data.get('token')


@pytest.fixture(scope='function')
def user_token(client, normal_user):
    """Crée un token JWT pour l'utilisateur normal"""
    response = client.post('/api/auth/login', json={
        'email': 'user@test.com',
        'password': 'user123'
    })
    data = response.get_json()
    return data.get('token')


@pytest.fixture(scope='function')
def sample_qcm(app, db_session, normal_user):
    """Crée un QCM de test"""
    with app.app_context():
        qcm = QCM(
            titre='QCM de Test',
            description='Description du QCM de test',
            duree=60,
            matiere='Mathématiques',
            status='draft',
            createur_id=normal_user.id
        )
        db_session.add(qcm)
        db_session.commit()

        return qcm


@pytest.fixture(scope='function')
def sample_question(app, db_session, sample_qcm):
    """Crée une question de test"""
    with app.app_context():
        question = Question(
            enonce='Quelle est la capitale de la France?',
            type_question='qcm',
            points=1,
            qcm_id=sample_qcm.id,
            explication='Paris est la capitale de la France'
        )

        options = [
            {'id': 'a', 'texte': 'Paris', 'estCorrecte': True},
            {'id': 'b', 'texte': 'Lyon', 'estCorrecte': False},
            {'id': 'c', 'texte': 'Marseille', 'estCorrecte': False},
            {'id': 'd', 'texte': 'Toulouse', 'estCorrecte': False}
        ]
        question.set_options(options)

        db_session.add(question)
        db_session.commit()

        return question
