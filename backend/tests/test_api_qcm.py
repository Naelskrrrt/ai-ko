"""
Tests unitaires pour les API QCM
"""
import pytest
import json


class TestQCMAPI:
    """Tests pour les endpoints QCM"""

    def test_list_qcms(self, client, user_token, sample_qcm):
        """Test: Liste des QCMs"""
        response = client.get(
            '/api/qcm',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        assert isinstance(data['data'], list)

    def test_create_qcm(self, client, user_token):
        """Test: Création d'un QCM"""
        qcm_data = {
            'titre': 'Nouveau QCM',
            'description': 'Description du nouveau QCM',
            'duree': 30,
            'matiere': 'Informatique',
            'status': 'draft'
        }

        response = client.post(
            '/api/qcm',
            headers={'Authorization': f'Bearer {user_token}'},
            json=qcm_data
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data['titre'] == qcm_data['titre']
        assert data['description'] == qcm_data['description']
        assert data['status'] == 'draft'

    def test_create_qcm_invalid_titre(self, client, user_token):
        """Test: Création d'un QCM avec titre invalide"""
        qcm_data = {
            'titre': 'AB',  # Trop court (min 3 caractères)
            'description': 'Description',
            'status': 'draft'
        }

        response = client.post(
            '/api/qcm',
            headers={'Authorization': f'Bearer {user_token}'},
            json=qcm_data
        )

        assert response.status_code == 400

    def test_get_qcm_by_id(self, client, user_token, sample_qcm):
        """Test: Récupération d'un QCM par ID"""
        response = client.get(
            f'/api/qcm/{sample_qcm.id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == sample_qcm.id
        assert data['titre'] == sample_qcm.titre

    def test_get_qcm_not_found(self, client, user_token):
        """Test: Récupération d'un QCM inexistant"""
        response = client.get(
            '/api/qcm/invalid-id',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 404

    def test_update_qcm(self, client, user_token, sample_qcm):
        """Test: Mise à jour d'un QCM"""
        update_data = {
            'titre': 'QCM Mis à Jour',
            'description': 'Nouvelle description'
        }

        response = client.put(
            f'/api/qcm/{sample_qcm.id}',
            headers={'Authorization': f'Bearer {user_token}'},
            json=update_data
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['titre'] == update_data['titre']
        assert data['description'] == update_data['description']

    def test_delete_qcm(self, client, user_token, sample_qcm):
        """Test: Suppression d'un QCM"""
        response = client.delete(
            f'/api/qcm/{sample_qcm.id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200

        # Vérifier que le QCM est bien supprimé
        response = client.get(
            f'/api/qcm/{sample_qcm.id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )
        assert response.status_code == 404

    def test_publish_qcm(self, client, user_token, sample_qcm):
        """Test: Publication d'un QCM"""
        response = client.patch(
            f'/api/qcm/{sample_qcm.id}/publish',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'published'

    def test_get_qcm_questions(self, client, user_token, sample_qcm, sample_question):
        """Test: Récupération des questions d'un QCM"""
        response = client.get(
            f'/api/qcm/{sample_qcm.id}/questions',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'questions' in data
        assert isinstance(data['questions'], list)
        assert len(data['questions']) > 0

    def test_generate_from_text(self, client, user_token):
        """Test: Génération de QCM depuis texte"""
        generation_data = {
            'titre': 'QCM Généré',
            'text': 'La France est un pays d\'Europe. Paris est sa capitale. Elle compte environ 67 millions d\'habitants.',
            'num_questions': 3,
            'matiere': 'Géographie'
        }

        response = client.post(
            '/api/qcm/generate/text',
            headers={'Authorization': f'Bearer {user_token}'},
            json=generation_data
        )

        assert response.status_code == 202
        data = response.get_json()
        assert 'task_id' in data
        assert 'qcm_id' in data
        assert data['status'] == 'PENDING'

    def test_unauthorized_access(self, client):
        """Test: Accès non autorisé"""
        response = client.get('/api/qcm')
        assert response.status_code == 401

    def test_filter_qcms_by_status(self, client, user_token, sample_qcm):
        """Test: Filtrage des QCMs par statut"""
        response = client.get(
            '/api/qcm?status=draft',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert all(qcm['status'] == 'draft' for qcm in data['data'])

    def test_pagination(self, client, user_token):
        """Test: Pagination des QCMs"""
        response = client.get(
            '/api/qcm?skip=0&limit=5',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        assert 'total' in data
        assert 'skip' in data
        assert 'limit' in data


class TestTaskStatusAPI:
    """Tests pour les endpoints de statut des tâches"""

    def test_get_task_status_pending(self, client, user_token):
        """Test: Récupération du statut d'une tâche en attente"""
        # Créer une tâche fictive
        task_id = 'fake-task-id'

        response = client.get(
            f'/api/qcm/tasks/{task_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        # La tâche devrait exister mais être en PENDING
        assert response.status_code == 200
        data = response.get_json()
        assert data['task_id'] == task_id
        assert data['status'] in ['PENDING', 'FAILURE']
