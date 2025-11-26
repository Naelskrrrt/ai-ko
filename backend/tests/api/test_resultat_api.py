"""
Tests pour les endpoints API Résultat
"""
import pytest
from datetime import datetime, timedelta
from app.models.resultat import Resultat
from app.models.session_examen import SessionExamen
from app.models.qcm import QCM
from app.models.question import Question
from app.models.user import User, UserRole


class TestResultatAPI:
    """Tests pour l'API des résultats"""

    def test_demarrer_examen(self, client, db_session):
        """Test: Démarrer un examen en tant qu'étudiant"""
        # Créer les données nécessaires
        etudiant = User(email='etu@test.com', name='Etudiant', role=UserRole.ETUDIANT, email_verified=True)
        etudiant.set_password('etu123')
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)

        db_session.add_all([etudiant, enseignant])
        db_session.flush()

        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)
        db_session.add(qcm)
        db_session.flush()

        question = Question(
            enonce='Question test',
            type_question='qcm',
            options='["A", "B", "C", "D"]',
            reponse_correcte='A',
            points=1,
            qcm_id=qcm.id
        )
        db_session.add(question)
        db_session.flush()

        now = datetime.utcnow()
        session = SessionExamen(
            titre='Examen',
            date_debut=now - timedelta(hours=1),
            date_fin=now + timedelta(hours=2),
            duree_minutes=120,
            tentatives_max=2,
            status='programmee',
            qcm_id=qcm.id,
            createur_id=enseignant.id
        )
        db_session.add(session)
        db_session.commit()

        # Login étudiant
        login_response = client.post('/api/auth/login', json={
            'email': 'etu@test.com',
            'password': 'etu123'
        })
        token = login_response.get_json()['token']

        # Démarrer l'examen
        response = client.post('/api/resultats/demarrer',
            json={'sessionId': session.id},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data['status'] == 'en_cours'
        assert data['numeroTentative'] == 1
        assert data['questionsTotal'] == 1

    def test_demarrer_examen_tentatives_max_depassees(self, client, db_session):
        """Test: Ne peut pas dépasser le nombre max de tentatives"""
        etudiant = User(email='etu@test.com', name='Etudiant', role=UserRole.ETUDIANT, email_verified=True)
        etudiant.set_password('etu123')
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)

        db_session.add_all([etudiant, enseignant])
        db_session.flush()

        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)
        db_session.add(qcm)
        db_session.flush()

        question = Question(enonce='Test', type_question='qcm', reponse_correcte='A', points=1, qcm_id=qcm.id)
        db_session.add(question)
        db_session.flush()

        now = datetime.utcnow()
        session = SessionExamen(
            titre='Examen',
            date_debut=now - timedelta(hours=1),
            date_fin=now + timedelta(hours=2),
            duree_minutes=120,
            tentatives_max=1,  # Une seule tentative autorisée
            status='programmee',
            qcm_id=qcm.id,
            createur_id=enseignant.id
        )
        db_session.add(session)
        db_session.flush()

        # Créer un résultat existant
        resultat = Resultat(
            etudiant_id=etudiant.id,
            session_id=session.id,
            qcm_id=qcm.id,
            numero_tentative=1,
            date_debut=now,
            questions_total=1,
            score_maximum=1.0,
            status='termine'
        )
        db_session.add(resultat)
        db_session.commit()

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'etu@test.com',
            'password': 'etu123'
        })
        token = login_response.get_json()['token']

        # Tenter de démarrer une 2ème tentative
        response = client.post('/api/resultats/demarrer',
            json={'sessionId': session.id},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 400
        assert 'tentatives' in response.get_json()['message'].lower()

    def test_soumettre_reponses(self, client, db_session):
        """Test: Soumettre les réponses d'un examen"""
        etudiant = User(email='etu@test.com', name='Etudiant', role=UserRole.ETUDIANT, email_verified=True)
        etudiant.set_password('etu123')
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)

        db_session.add_all([etudiant, enseignant])
        db_session.flush()

        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)
        db_session.add(qcm)
        db_session.flush()

        question = Question(enonce='Test', type_question='qcm', reponse_correcte='A', points=1, qcm_id=qcm.id)
        db_session.add(question)
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
        db_session.flush()

        resultat = Resultat(
            etudiant_id=etudiant.id,
            session_id=session.id,
            qcm_id=qcm.id,
            numero_tentative=1,
            date_debut=now,
            questions_total=1,
            score_maximum=1.0,
            status='en_cours'
        )
        db_session.add(resultat)
        db_session.commit()

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'etu@test.com',
            'password': 'etu123'
        })
        token = login_response.get_json()['token']

        # Soumettre les réponses
        response = client.post(f'/api/resultats/{resultat.id}/soumettre',
            json={'reponses': {str(question.id): 'A'}},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'termine'
        assert data['questionsRepondues'] == 1

    def test_ajouter_commentaire_prof(self, client, db_session):
        """Test: Ajouter un commentaire de professeur"""
        etudiant = User(email='etu@test.com', name='Etudiant', role=UserRole.ETUDIANT, email_verified=True)
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)
        enseignant.set_password('prof123')

        db_session.add_all([etudiant, enseignant])
        db_session.flush()

        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)
        db_session.add(qcm)
        db_session.flush()

        now = datetime.utcnow()
        session = SessionExamen(
            titre='Examen',
            date_debut=now,
            date_fin=now + timedelta(hours=2),
            duree_minutes=120,
            status='terminee',
            qcm_id=qcm.id,
            createur_id=enseignant.id
        )
        db_session.add(session)
        db_session.flush()

        resultat = Resultat(
            etudiant_id=etudiant.id,
            session_id=session.id,
            qcm_id=qcm.id,
            numero_tentative=1,
            date_debut=now,
            date_fin=now + timedelta(hours=1),
            questions_total=1,
            score_maximum=1.0,
            score_total=0.8,
            note_sur_20=16.0,
            status='termine'
        )
        db_session.add(resultat)
        db_session.commit()

        # Login enseignant
        login_response = client.post('/api/auth/login', json={
            'email': 'prof@test.com',
            'password': 'prof123'
        })
        token = login_response.get_json()['token']

        # Ajouter commentaire
        response = client.post(f'/api/resultats/{resultat.id}/commentaire',
            json={
                'commentaire': 'Bon travail !',
                'noteProf': 17.0
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['commentaireProf'] == 'Bon travail !'
        assert data['noteProf'] == 17.0

    def test_get_statistiques_etudiant(self, client, db_session):
        """Test: Récupérer les statistiques d'un étudiant"""
        etudiant = User(email='etu@test.com', name='Etudiant', role=UserRole.ETUDIANT, email_verified=True)
        etudiant.set_password('etu123')
        enseignant = User(email='prof@test.com', name='Prof', role=UserRole.ENSEIGNANT, email_verified=True)

        db_session.add_all([etudiant, enseignant])
        db_session.flush()

        qcm = QCM(titre='QCM', description='Test', duree=60, status='published', createur_id=enseignant.id)
        db_session.add(qcm)
        db_session.flush()

        now = datetime.utcnow()
        session = SessionExamen(
            titre='Examen',
            date_debut=now,
            date_fin=now + timedelta(hours=2),
            duree_minutes=120,
            status='terminee',
            qcm_id=qcm.id,
            createur_id=enseignant.id
        )
        db_session.add(session)
        db_session.flush()

        # Créer quelques résultats
        for i in range(3):
            resultat = Resultat(
                etudiant_id=etudiant.id,
                session_id=session.id,
                qcm_id=qcm.id,
                numero_tentative=i+1,
                date_debut=now,
                date_fin=now + timedelta(hours=1),
                questions_total=10,
                score_maximum=10.0,
                score_total=8.0,
                note_sur_20=16.0,
                status='termine',
                est_reussi=True
            )
            db_session.add(resultat)
        db_session.commit()

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'etu@test.com',
            'password': 'etu123'
        })
        token = login_response.get_json()['token']

        # Récupérer stats
        response = client.get(f'/api/resultats/etudiant/{etudiant.id}/statistiques',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['nombre_examens'] == 3
        assert data['examens_reussis'] == 3
        assert data['moyenne_generale'] == 16.0
