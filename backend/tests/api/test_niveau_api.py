"""
Tests pour les endpoints API Niveau
"""
import pytest
from app.models.niveau import Niveau
from app.models.user import User, UserRole


class TestNiveauAPI:
    """Tests pour l'API des niveaux"""

    def test_get_all_niveaux_without_auth(self, client, db_session):
        """Test: Récupérer tous les niveaux sans authentification"""
        # Créer des niveaux de test
        niveau1 = Niveau(code='L1', nom='Licence 1', ordre=1, cycle='licence')
        niveau2 = Niveau(code='M1', nom='Master 1', ordre=4, cycle='master')
        db_session.add_all([niveau1, niveau2])
        db_session.commit()

        response = client.get('/api/niveaux')
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 2
        assert data[0]['code'] == 'L1'
        assert data[1]['code'] == 'M1'

    def test_get_niveaux_by_cycle(self, client, db_session):
        """Test: Filtrer les niveaux par cycle"""
        niveau1 = Niveau(code='L1', nom='Licence 1', ordre=1, cycle='licence')
        niveau2 = Niveau(code='L2', nom='Licence 2', ordre=2, cycle='licence')
        niveau3 = Niveau(code='M1', nom='Master 1', ordre=4, cycle='master')
        db_session.add_all([niveau1, niveau2, niveau3])
        db_session.commit()

        response = client.get('/api/niveaux/cycle/licence')
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 2
        assert all(n['cycle'] == 'licence' for n in data)

    def test_create_niveau_as_admin(self, client, db_session):
        """Test: Créer un niveau en tant qu'admin"""
        # Créer un admin
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        db_session.add(admin)
        db_session.commit()

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        # Créer un niveau
        response = client.post('/api/niveaux',
            json={
                'code': 'L3',
                'nom': 'Licence 3',
                'ordre': 3,
                'cycle': 'licence',
                'description': 'Troisième année de licence'
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data['code'] == 'L3'
        assert data['nom'] == 'Licence 3'

    def test_create_niveau_without_admin_fails(self, client, db_session):
        """Test: Créer un niveau sans être admin échoue"""
        # Créer un étudiant
        user = User(email='user@test.com', name='User', role=UserRole.ETUDIANT, email_verified=True)
        user.set_password('user123')
        db_session.add(user)
        db_session.commit()

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'user@test.com',
            'password': 'user123'
        })
        token = login_response.get_json()['token']

        # Tentative de création
        response = client.post('/api/niveaux',
            json={'code': 'L3', 'nom': 'Licence 3', 'ordre': 3, 'cycle': 'licence'},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 403

    def test_update_niveau(self, client, db_session):
        """Test: Mettre à jour un niveau"""
        # Créer un admin et un niveau
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        niveau = Niveau(code='L1', nom='Licence 1', ordre=1, cycle='licence')
        db_session.add_all([admin, niveau])
        db_session.commit()

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        # Mettre à jour
        response = client.put(f'/api/niveaux/{niveau.id}',
            json={'nom': 'Licence 1 Modifié'},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['nom'] == 'Licence 1 Modifié'

    def test_delete_niveau(self, client, db_session):
        """Test: Supprimer un niveau"""
        # Créer un admin et un niveau
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        niveau = Niveau(code='L1', nom='Licence 1', ordre=1, cycle='licence')
        db_session.add_all([admin, niveau])
        db_session.commit()

        niveau_id = niveau.id

        # Login
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        # Supprimer
        response = client.delete(f'/api/niveaux/{niveau_id}',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200

        # Vérifier que le niveau n'existe plus
        niveau_deleted = db_session.query(Niveau).filter_by(id=niveau_id).first()
        assert niveau_deleted is None

    def test_validation_code_unique(self, client, db_session):
        """Test: Le code doit être unique"""
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        niveau = Niveau(code='L1', nom='Licence 1', ordre=1, cycle='licence')
        db_session.add_all([admin, niveau])
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        # Tenter de créer un niveau avec le même code
        response = client.post('/api/niveaux',
            json={'code': 'L1', 'nom': 'Autre Licence 1', 'ordre': 2, 'cycle': 'licence'},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 400
        assert 'existe déjà' in response.get_json()['message']

    def test_validation_cycle(self, client, db_session):
        """Test: Le cycle doit être valide"""
        admin = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN, email_verified=True)
        admin.set_password('admin123')
        db_session.add(admin)
        db_session.commit()

        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        token = login_response.get_json()['token']

        # Cycle invalide
        response = client.post('/api/niveaux',
            json={'code': 'X1', 'nom': 'Niveau X', 'ordre': 1, 'cycle': 'invalid'},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 400
        assert 'Cycle invalide' in response.get_json()['message']
