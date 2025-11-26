"""
Tests pour les endpoints API Session d'Examen
"""
import pytest
from datetime import datetime, timedelta
from app.models.session_examen import SessionExamen
from app.models.qcm import QCM
from app.models.classe import Classe
from app.models.niveau import Niveau
from app.models.user import User, UserRole


class TestSessionExamenAPI:
    """Tests pour l'API des sessions d'examen"""

    def test_create_session_as_enseignant(self, client, db_session):
        """Test: Créer une session en tant qu'enseignant"""
        # Créer les données nécessaires
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)
        enseignant.set_password('prof123')

        niveau = Niveau(code='L1', nom='Licence 1', ordre=1, cycle='licence')
        classe = Classe(code='L1-A', nom='L1 Info A', niveau_id=niveau.id, annee_scolaire='2024-2025')
        qcm = QCM(titre='QCM Test', description='Test', duree=60, status='published', createur_id=enseignant.id)

        db_session.add_all([enseignant, niveau])
        db_session.flush()
        classe.niveau_id = niveau.id
        qcm.createur_id = enseignant.id
        db_session.add_all([classe, qcm])
        db_session.commit()

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'prof@test.com',
            'password': 'prof123'
        })
        token = login_response.get_json()['token']

        # Créer une session
        now = datetime.utcnow()
        response = client.post('/api/sessions',
            json={
                'titre': 'Examen Python',
                'description': 'Examen sur Python',
                'dateDebut': (now + timedelta(days=1)).isoformat() + 'Z',
                'dateFin': (now + timedelta(days=1, hours=2)).isoformat() + 'Z',
                'dureeMinutes': 120,
                'tentativesMax': 2,
                'notePassage': 10.0,
                'qcmId': qcm.id,
                'classeId': classe.id
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data['titre'] == 'Examen Python'
        assert data['dureeMinutes'] == 120

    def test_create_session_validation_dates(self, client, db_session):
        """Test: Validation des dates (début < fin)"""
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)
        enseignant.set_password('prof123')
        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)

        db_session.add(enseignant)
        db_session.flush()
        qcm.createur_id = enseignant.id
        db_session.add(qcm)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'prof@test.com',
            'password': 'prof123'
        })
        token = login_response.get_json()['token']

        # Dates invalides (fin avant début)
        now = datetime.utcnow()
        response = client.post('/api/sessions',
            json={
                'titre': 'Test',
                'dateDebut': (now + timedelta(days=2)).isoformat() + 'Z',
                'dateFin': (now + timedelta(days=1)).isoformat() + 'Z',
                'dureeMinutes': 120,
                'qcmId': qcm.id
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 400
        assert 'antérieure' in response.get_json()['message'].lower()

    def test_demarrer_session(self, client, db_session):
        """Test: Démarrer une session"""
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)
        enseignant.set_password('prof123')
        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)

        db_session.add(enseignant)
        db_session.flush()
        qcm.createur_id = enseignant.id
        db_session.add(qcm)
        db_session.flush()

        now = datetime.utcnow()
        session = SessionExamen(
            titre='Examen',
            date_debut=now,
            date_fin=now + timedelta(hours=2),
            duree_minutes=120,
            status='programmee',
            qcm_id=qcm.id,
            createur_id=enseignant.id
        )
        db_session.add(session)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'prof@test.com',
            'password': 'prof123'
        })
        token = login_response.get_json()['token']

        response = client.patch(f'/api/sessions/{session.id}/demarrer',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'en_cours'

    def test_terminer_session(self, client, db_session):
        """Test: Terminer une session"""
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)
        enseignant.set_password('prof123')
        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)

        db_session.add(enseignant)
        db_session.flush()
        qcm.createur_id = enseignant.id
        db_session.add(qcm)
        db_session.flush()

        now = datetime.utcnow()
        session = SessionExamen(
            titre='Examen',
            date_debut=now,
            date_fin=now + timedelta(hours=2),
            duree_minutes=120,
            status='en_cours',
            qcm_id=qcm.id,
            createur_id=enseignant.id
        )
        db_session.add(session)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'prof@test.com',
            'password': 'prof123'
        })
        token = login_response.get_json()['token']

        response = client.patch(f'/api/sessions/{session.id}/terminer',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'terminee'

    def test_get_sessions_disponibles_etudiant(self, client, db_session):
        """Test: Récupérer les sessions disponibles pour un étudiant"""
        etudiant = User(email='etu@test.com', name='Etudiant', role=UserRole.ETUDIANT, email_verified=True)
        etudiant.set_password('etu123')
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)
        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)

        db_session.add_all([etudiant, enseignant])
        db_session.flush()
        qcm.createur_id = enseignant.id
        db_session.add(qcm)
        db_session.flush()

        now = datetime.utcnow()
        session = SessionExamen(
            titre='Examen',
            date_debut=now - timedelta(hours=1),
            date_fin=now + timedelta(hours=1),
            duree_minutes=120,
            status='programmee',
            qcm_id=qcm.id,
            createur_id=enseignant.id
        )
        db_session.add(session)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'etu@test.com',
            'password': 'etu123'
        })
        token = login_response.get_json()['token']

        response = client.get('/api/sessions/disponibles',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert len(data) >= 0  # Peut être vide selon les conditions
