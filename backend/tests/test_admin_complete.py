"""
Tests complets pour l'API admin étendue
"""
import pytest
from datetime import datetime, date
from app import create_app, db
from app.models.user import User, UserRole
from app.models.niveau import Niveau
from app.models.matiere import Matiere
from app.models.classe import Classe
from app.models.ai_config import AIModelConfig
from app.models.qcm import QCM
from app.models.session_examen import SessionExamen
from app.models.resultat import Resultat
from flask_jwt_extended import create_access_token


@pytest.fixture
def app():
    """Crée l'application de test"""
    import os
    
    # Utiliser PostgreSQL pour les tests (si disponible) ou SQLite en fallback
    if 'DATABASE_URL' not in os.environ or 'sqlite' in os.environ.get('DATABASE_URL', ''):
        # Configurer PostgreSQL de test
        os.environ['DATABASE_URL'] = 'postgresql://root:root@localhost:5432/systeme_intelligent'
    
    app = create_app()
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    # Utiliser des transactions pour isoler les tests
    app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = False
    
    with app.app_context():
        yield app
        
        # Nettoyer les données de test après TOUS les tests
        try:
            from app.models.user import User, UserRole
            from app.models.ai_config import AIModelConfig
            from app.models.niveau import Niveau
            from app.models.matiere import Matiere
            from app.models.classe import Classe
            
            # Nettoyer les utilisateurs de test
            User.query.filter(User.email.like('%@test.com')).delete()
            
            # Nettoyer les configs IA de test
            AIModelConfig.query.filter(AIModelConfig.nom.like('Test%')).delete()
            AIModelConfig.query.filter(AIModelConfig.nom.like('Model%')).delete()
            
            # Nettoyer les données de fixtures
            Niveau.query.filter(Niveau.code.like('TEST-%')).delete()
            Matiere.query.filter(Matiere.code.like('TEST-%')).delete()
            Classe.query.filter(Classe.code.like('TEST-%')).delete()
            
            db.session.commit()
        except Exception as e:
            print(f"Erreur lors du nettoyage: {e}")
            db.session.rollback()
        
        db.session.remove()


@pytest.fixture
def client(app):
    """Client de test"""
    return app.test_client()


@pytest.fixture
def admin_user(app):
    """Crée ou récupère un utilisateur admin"""
    with app.app_context():
        # Essayer de récupérer l'admin existant
        admin = User.query.filter_by(email='admin@test.com').first()
        
        if not admin:
            # Créer un nouvel admin si n'existe pas
            admin = User(
                email='admin@test.com',
                name='Admin Test',
                role=UserRole.ADMIN,
                email_verified=True
            )
            admin.set_password('admin123456')
            db.session.add(admin)
            db.session.commit()
        
        admin_id = admin.id
        return admin_id


@pytest.fixture
def admin_token(app, admin_user):
    """Token JWT pour l'admin"""
    with app.app_context():
        return create_access_token(identity=admin_user)


@pytest.fixture
def niveau(app):
    """Crée ou récupère un niveau de test"""
    with app.app_context():
        import uuid
        code = f'TEST-{str(uuid.uuid4())[:8]}'
        
        niveau = Niveau(
            code=code,
            nom='Niveau Test',
            cycle='licence',
            ordre=1,
            actif=True
        )
        db.session.add(niveau)
        db.session.commit()
        niveau_id = niveau.id
        return niveau_id


@pytest.fixture
def matiere(app):
    """Crée ou récupère une matière de test"""
    with app.app_context():
        import uuid
        code = f'TEST-{str(uuid.uuid4())[:8]}'
        
        matiere = Matiere(
            code=code,
            nom='Matière Test',
            coefficient=2.0,
            actif=True
        )
        db.session.add(matiere)
        db.session.commit()
        matiere_id = matiere.id
        return matiere_id


@pytest.fixture
def classe(app, niveau):
    """Crée ou récupère une classe de test"""
    with app.app_context():
        import uuid
        code = f'TEST-{str(uuid.uuid4())[:8]}'
        
        classe = Classe(
            code=code,
            nom='Classe Test',
            niveau_id=niveau,
            annee_scolaire='2024-2025',
            actif=True
        )
        db.session.add(classe)
        db.session.commit()
        classe_id = classe.id
        return classe_id


# ========================
# Tests Étudiants
# ========================

class TestEtudiants:
    """Tests pour la gestion des étudiants"""
    
    def test_create_etudiant(self, client, admin_token, niveau, classe, matiere):
        """Test création d'un étudiant"""
        response = client.post(
            '/api/admin/etudiants',
            json={
                'email': 'etudiant@test.com',
                'name': 'Étudiant Test',
                'password': 'password123',
                'numeroEtudiant': 'E2024001',
                'telephone': '+33612345678',
                'dateNaissance': '2000-01-15',
                'niveauIds': [niveau],
                'classeIds': [classe],
                'matiereIds': [matiere],
                'anneeScolaire': '2024-2025'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        if response.status_code != 201:
            print(f"Error response: {response.get_json()}")
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.get_json()}"
        data = response.get_json()
        assert data['email'] == 'etudiant@test.com'
        assert data['role'] == 'etudiant'
        assert data['numeroEtudiant'] == 'E2024001'
    
    def test_create_etudiant_duplicate_email(self, client, admin_token):
        """Test création étudiant avec email déjà utilisé"""
        # Créer le premier étudiant
        client.post(
            '/api/admin/etudiants',
            json={
                'email': 'duplicate@test.com',
                'name': 'Premier',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        # Tenter de créer un second avec le même email
        response = client.post(
            '/api/admin/etudiants',
            json={
                'email': 'duplicate@test.com',
                'name': 'Second',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 400
        assert 'déjà utilisé' in response.get_json()['message']
    
    def test_get_etudiants(self, client, admin_token):
        """Test récupération de la liste des étudiants"""
        # Créer plusieurs étudiants
        for i in range(3):
            client.post(
                '/api/admin/etudiants',
                json={
                    'email': f'etudiant{i}@test.com',
                    'name': f'Étudiant {i}',
                    'password': 'password123'
                },
                headers={'Authorization': f'Bearer {admin_token}'}
            )
        
        response = client.get(
            '/api/admin/etudiants?page=1&per_page=10',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'etudiants' in data
        assert len(data['etudiants']) == 3
        assert data['pagination']['total'] == 3
    
    def test_get_etudiant_by_id(self, client, admin_token):
        """Test récupération d'un étudiant par ID"""
        # Créer un étudiant
        create_response = client.post(
            '/api/admin/etudiants',
            json={
                'email': 'etudiant@test.com',
                'name': 'Étudiant Test',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        etudiant_id = create_response.get_json()['id']
        
        # Récupérer l'étudiant
        response = client.get(
            f'/api/admin/etudiants/{etudiant_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == etudiant_id
        assert data['email'] == 'etudiant@test.com'
    
    def test_update_etudiant(self, client, admin_token):
        """Test mise à jour d'un étudiant"""
        # Créer un étudiant
        create_response = client.post(
            '/api/admin/etudiants',
            json={
                'email': 'etudiant@test.com',
                'name': 'Étudiant Original',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        etudiant_id = create_response.get_json()['id']
        
        # Mettre à jour
        response = client.put(
            f'/api/admin/etudiants/{etudiant_id}',
            json={
                'name': 'Étudiant Modifié',
                'telephone': '+33612345678'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['name'] == 'Étudiant Modifié'
        assert data['telephone'] == '+33612345678'
    
    def test_delete_etudiant(self, client, admin_token):
        """Test suppression d'un étudiant"""
        # Créer un étudiant
        create_response = client.post(
            '/api/admin/etudiants',
            json={
                'email': 'etudiant@test.com',
                'name': 'Étudiant Test',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        etudiant_id = create_response.get_json()['id']
        
        # Supprimer
        response = client.delete(
            f'/api/admin/etudiants/{etudiant_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        
        # Vérifier que l'étudiant n'existe plus
        get_response = client.get(
            f'/api/admin/etudiants/{etudiant_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert get_response.status_code == 404
    
    def test_assign_etudiant(self, client, admin_token, niveau, classe, matiere):
        """Test assignation de niveaux/classes/matières à un étudiant"""
        # Créer un étudiant
        create_response = client.post(
            '/api/admin/etudiants',
            json={
                'email': 'etudiant@test.com',
                'name': 'Étudiant Test',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        etudiant_id = create_response.get_json()['id']
        
        # Assigner
        response = client.post(
            f'/api/admin/etudiants/{etudiant_id}/assign',
            json={
                'niveauIds': [niveau],
                'classeIds': [classe],
                'matiereIds': [matiere],
                'anneeScolaire': '2024-2025'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data.get('niveaux', [])) > 0 or 'niveaux' in data


# ========================
# Tests Professeurs
# ========================

class TestProfesseurs:
    """Tests pour la gestion des professeurs"""
    
    def test_create_professeur(self, client, admin_token, matiere, niveau):
        """Test création d'un professeur"""
        response = client.post(
            '/api/admin/professeurs',
            json={
                'email': 'prof@test.com',
                'name': 'Professeur Test',
                'password': 'password123',
                'numeroEnseignant': 'P2024001',
                'telephone': '+33612345678',
                'matiereIds': [matiere],
                'niveauIds': [niveau],
                'anneeScolaire': '2024-2025'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['email'] == 'prof@test.com'
        assert data['role'] == 'enseignant'
    
    def test_get_professeurs(self, client, admin_token):
        """Test récupération de la liste des professeurs"""
        # Créer plusieurs professeurs
        for i in range(2):
            client.post(
                '/api/admin/professeurs',
                json={
                    'email': f'prof{i}@test.com',
                    'name': f'Professeur {i}',
                    'password': 'password123'
                },
                headers={'Authorization': f'Bearer {admin_token}'}
            )
        
        response = client.get(
            '/api/admin/professeurs',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['professeurs']) == 2
    
    def test_update_professeur(self, client, admin_token):
        """Test mise à jour d'un professeur"""
        # Créer un professeur
        create_response = client.post(
            '/api/admin/professeurs',
            json={
                'email': 'prof@test.com',
                'name': 'Professeur Original',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        prof_id = create_response.get_json()['id']
        
        # Mettre à jour
        response = client.put(
            f'/api/admin/professeurs/{prof_id}',
            json={'name': 'Professeur Modifié'},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        assert response.get_json()['name'] == 'Professeur Modifié'
    
    def test_delete_professeur(self, client, admin_token):
        """Test suppression d'un professeur"""
        # Créer un professeur
        create_response = client.post(
            '/api/admin/professeurs',
            json={
                'email': 'prof@test.com',
                'name': 'Professeur Test',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        prof_id = create_response.get_json()['id']
        
        # Supprimer
        response = client.delete(
            f'/api/admin/professeurs/{prof_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200


# ========================
# Tests Affectation Matières-Professeurs
# ========================

class TestMatieresProfesseurs:
    """Tests pour l'affectation de professeurs aux matières"""
    
    def test_assign_professeurs_to_matiere(self, client, admin_token, matiere):
        """Test affectation de professeurs à une matière"""
        # Créer des professeurs
        prof_ids = []
        for i in range(2):
            response = client.post(
                '/api/admin/professeurs',
                json={
                    'email': f'prof{i}@test.com',
                    'name': f'Professeur {i}',
                    'password': 'password123'
                },
                headers={'Authorization': f'Bearer {admin_token}'}
            )
            prof_ids.append(response.get_json()['id'])
        
        # Affecter les professeurs à la matière
        response = client.post(
            f'/api/admin/matieres/{matiere}/professeurs',
            json={
                'professeurIds': prof_ids,
                'anneeScolaire': '2024-2025'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['professeurs']) == 2
    
    def test_get_professeurs_by_matiere(self, client, admin_token, matiere):
        """Test récupération des professeurs d'une matière"""
        # Créer un professeur
        prof_response = client.post(
            '/api/admin/professeurs',
            json={
                'email': 'prof@test.com',
                'name': 'Professeur Test',
                'password': 'password123'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        prof_id = prof_response.get_json()['id']
        
        # Affecter
        client.post(
            f'/api/admin/matieres/{matiere}/professeurs',
            json={
                'professeurIds': [prof_id],
                'anneeScolaire': '2024-2025'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        # Récupérer
        response = client.get(
            f'/api/admin/matieres/{matiere}/professeurs',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['professeurs']) == 1


# ========================
# Tests Configuration IA
# ========================

class TestAIConfig:
    """Tests pour la gestion des configurations IA"""
    
    def test_create_ai_config(self, client, admin_token):
        """Test création d'une configuration IA"""
        response = client.post(
            '/api/admin/ai-configs',
            json={
                'nom': 'Test Model',
                'provider': 'huggingface',
                'modelId': 'test/model',
                'description': 'Test description',
                'maxTokens': 2048,
                'temperature': 0.7,
                'topP': 0.9,
                'timeoutSeconds': 60,
                'actif': True,
                'estDefaut': False,
                'ordrePriorite': 1
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['nom'] == 'Test Model'
        assert data['provider'] == 'huggingface'
    
    def test_get_all_configs(self, client, admin_token):
        """Test récupération de toutes les configurations"""
        # Créer deux configurations
        for i in range(2):
            client.post(
                '/api/admin/ai-configs',
                json={
                    'nom': f'Model {i}',
                    'provider': 'huggingface',
                    'modelId': f'test/model{i}',
                    'ordrePriorite': i
                },
                headers={'Authorization': f'Bearer {admin_token}'}
            )
        
        response = client.get(
            '/api/admin/ai-configs',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['configs']) == 2
    
    def test_set_default_config(self, client, admin_token):
        """Test définir une configuration comme défaut"""
        # Créer une configuration
        create_response = client.post(
            '/api/admin/ai-configs',
            json={
                'nom': 'Default Model',
                'provider': 'huggingface',
                'modelId': 'test/model',
                'estDefaut': False
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        config_id = create_response.get_json()['id']
        
        # Définir comme défaut
        response = client.post(
            f'/api/admin/ai-configs/{config_id}/set-default',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        assert response.get_json()['estDefaut'] == True
    
    def test_get_default_config(self, client, admin_token):
        """Test récupération de la configuration par défaut"""
        # Créer une configuration par défaut
        client.post(
            '/api/admin/ai-configs',
            json={
                'nom': 'Default Model',
                'provider': 'huggingface',
                'modelId': 'test/model',
                'estDefaut': True
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        response = client.get(
            '/api/admin/ai-configs/default',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        assert response.get_json()['estDefaut'] == True
    
    def test_update_ai_config(self, client, admin_token):
        """Test mise à jour d'une configuration"""
        # Créer une configuration
        create_response = client.post(
            '/api/admin/ai-configs',
            json={
                'nom': 'Original Model',
                'provider': 'huggingface',
                'modelId': 'test/model'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        config_id = create_response.get_json()['id']
        
        # Mettre à jour
        response = client.put(
            f'/api/admin/ai-configs/{config_id}',
            json={'nom': 'Updated Model'},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        assert response.get_json()['nom'] == 'Updated Model'
    
    def test_delete_ai_config(self, client, admin_token):
        """Test suppression d'une configuration"""
        # Créer une configuration
        create_response = client.post(
            '/api/admin/ai-configs',
            json={
                'nom': 'To Delete',
                'provider': 'huggingface',
                'modelId': 'test/model'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        config_id = create_response.get_json()['id']
        
        # Supprimer
        response = client.delete(
            f'/api/admin/ai-configs/{config_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
    
    def test_init_default_configs(self, client, admin_token):
        """Test initialisation des configurations par défaut"""
        response = client.post(
            '/api/admin/ai-configs/init-defaults',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['configs']) == 4  # Mistral, Llama, Phi-3, Qwen


# ========================
# Tests Sessions Admin
# ========================

class TestSessionsAdmin:
    """Tests pour la gestion admin des sessions"""
    
    def test_get_all_sessions_admin(self, client, admin_token, admin_user):
        """Test récupération de toutes les sessions par l'admin"""
        with client.application.app_context():
            # Créer un QCM
            qcm = QCM(
                titre='QCM Test',
                description='Test',
                createur_id=admin_user,
                status='published'
            )
            db.session.add(qcm)
            db.session.commit()
            
            # Créer une session
            session = SessionExamen(
                titre='Session Test',
                date_debut=datetime.utcnow(),
                date_fin=datetime.utcnow(),
                duree_minutes=60,
                qcm_id=qcm.id,
                createur_id=admin_user
            )
            db.session.add(session)
            db.session.commit()
        
        response = client.get(
            '/api/admin/sessions',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'sessions' in data
        assert len(data['sessions']) >= 1


# ========================
# Tests Résultats Admin
# ========================

class TestResultatsAdmin:
    """Tests pour la gestion admin des résultats"""
    
    def test_get_resultats_stats(self, client, admin_token):
        """Test récupération des statistiques globales"""
        response = client.get(
            '/api/admin/resultats/stats',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'total' in data
        assert 'termines' in data
        assert 'taux_reussite' in data


# ========================
# Tests Sécurité
# ========================

class TestSecurity:
    """Tests de sécurité"""
    
    def test_unauthorized_access(self, client):
        """Test accès sans token"""
        response = client.get('/api/admin/etudiants')
        assert response.status_code == 401
    
    def test_non_admin_access(self, client, app):
        """Test accès par un non-admin"""
        with app.app_context():
            import uuid
            email = f'student-{str(uuid.uuid4())[:8]}@test.com'
            
            # Créer un utilisateur étudiant
            student = User(
                email=email,
                name='Student',
                role=UserRole.ETUDIANT,
                email_verified=True
            )
            student.set_password('password123')
            db.session.add(student)
            db.session.commit()
            
            student_token = create_access_token(identity=student.id)
        
        response = client.get(
            '/api/admin/etudiants',
            headers={'Authorization': f'Bearer {student_token}'}
        )
        assert response.status_code == 403

