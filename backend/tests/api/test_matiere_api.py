"""
Tests pour les endpoints API Matière
"""
import pytest
from app.models.matiere import Matiere
from app.models.user import User, UserRole


class TestMatiereAPI:
    """Tests pour l'API des matières"""

    def test_get_all_matieres(self, client, db_session):
        """Test: Récupérer toutes les matières"""
        matiere1 = Matiere(code='PROG201', nom='Python', coefficient=2.0, couleur='#3776AB', actif=True)
        matiere2 = Matiere(code='PROG301', nom='Java', coefficient=2.5, couleur='#007396', actif=True)
        db_session.add_all([matiere1, matiere2])
        db_session.commit()

        response = client.get('/api/matieres')
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 2

    def test_get_matieres_actives_only(self, client, db_session):
        """Test: Filtrer les matières actives"""
        matiere1 = Matiere(code='PROG201', nom='Python', coefficient=2.0, actif=True)
        matiere2 = Matiere(code='PROG301', nom='Java', coefficient=2.5, actif=False)
        db_session.add_all([matiere1, matiere2])
        db_session.commit()

        response = client.get('/api/matieres?actives_seulement=true')
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]['code'] == 'PROG201'

    def test_create_matiere_as_admin(self, client, db_session):
        """Test: Créer une matière en tant qu'admin"""
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        db_session.add(admin)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        response = client.post('/api/matieres',
            json={
                'code': 'ALGO101',
                'nom': 'Algorithmique',
                'description': 'Cours d\'algorithmique',
                'coefficient': 3.0,
                'couleur': '#10B981',
                'icone': 'algorithm'
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data['code'] == 'ALGO101'
        assert data['coefficient'] == 3.0

    def test_create_matiere_validation_coefficient(self, client, db_session):
        """Test: Validation du coefficient (0.5-5.0)"""
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        db_session.add(admin)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        # Coefficient trop élevé
        response = client.post('/api/matieres',
            json={'code': 'TEST', 'nom': 'Test', 'coefficient': 10.0},
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 400
        assert 'coefficient' in response.get_json()['message'].lower()

    def test_create_matiere_validation_couleur(self, client, db_session):
        """Test: Validation du format couleur hex"""
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        db_session.add(admin)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        # Couleur invalide
        response = client.post('/api/matieres',
            json={'code': 'TEST', 'nom': 'Test', 'coefficient': 2.0, 'couleur': 'rouge'},
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 400
        assert 'hexadécimal' in response.get_json()['message'].lower()

    def test_update_matiere(self, client, db_session):
        """Test: Mettre à jour une matière"""
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        matiere = Matiere(code='PROG201', nom='Python', coefficient=2.0)
        db_session.add_all([admin, matiere])
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        response = client.put(f'/api/matieres/{matiere.id}',
            json={'nom': 'Programmation Python Avancée', 'coefficient': 2.5},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['nom'] == 'Programmation Python Avancée'
        assert data['coefficient'] == 2.5

    def test_delete_matiere(self, client, db_session):
        """Test: Supprimer une matière"""
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        matiere = Matiere(code='PROG201', nom='Python', coefficient=2.0)
        db_session.add_all([admin, matiere])
        db_session.commit()

        matiere_id = matiere.id

        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        response = client.delete(f'/api/matieres/{matiere_id}',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        matiere_deleted = db_session.query(Matiere).filter_by(id=matiere_id).first()
        assert matiere_deleted is None
