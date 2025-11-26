"""
Tests e2e pour les flux complets de génération et correction de quiz
"""
import pytest
import time


class TestQuizGenerationFlow:
    """Tests e2e pour le flux complet de génération de quiz"""

    def test_complete_quiz_generation_flow(self, client, user_token):
        """
        Test e2e: Flux complet de génération de quiz
        1. Créer un QCM vide
        2. Lancer la génération de questions
        3. Vérifier le statut de la tâche
        4. Récupérer le QCM avec les questions générées
        """
        # Étape 1: Générer un QCM depuis du texte
        generation_data = {
            'titre': 'QCM E2E Test',
            'text': '''
                La photosynthèse est le processus par lequel les plantes vertes
                transforment la lumière du soleil en énergie chimique. Ce processus
                se déroule principalement dans les chloroplastes des cellules végétales.
                La chlorophylle, un pigment vert, joue un rôle crucial dans la capture
                de la lumière solaire. L'équation générale de la photosynthèse est :
                6CO2 + 6H2O + lumière → C6H12O6 + 6O2
            ''',
            'num_questions': 3,
            'matiere': 'Biologie',
            'duree': 15
        }

        response = client.post(
            '/api/qcm/generate/text',
            headers={'Authorization': f'Bearer {user_token}'},
            json=generation_data
        )

        assert response.status_code == 202
        data = response.get_json()
        task_id = data['task_id']
        qcm_id = data['qcm_id']

        # Étape 2: Vérifier le QCM créé
        response = client.get(
            f'/api/qcm/{qcm_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        qcm_data = response.get_json()
        assert qcm_data['titre'] == 'QCM E2E Test'
        assert qcm_data['matiere'] == 'Biologie'

        # Étape 3: Vérifier le statut de la tâche (en simulation)
        # Note: En test, la tâche Celery ne sera pas exécutée réellement
        # Dans un test d'intégration réel, vous attendriez la fin de la tâche
        response = client.get(
            f'/api/qcm/tasks/{task_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        task_data = response.get_json()
        assert task_data['task_id'] == task_id
        assert 'status' in task_data

    def test_complete_correction_flow(self, client, user_token, sample_qcm, sample_question):
        """
        Test e2e: Flux complet de correction
        1. Soumettre des réponses pour un QCM
        2. Vérifier le statut de la correction
        3. Récupérer les résultats
        """
        # Étape 1: Soumettre des réponses en batch
        batch_data = {
            'qcm_id': sample_qcm.id,
            'answers': {
                sample_question.id: 'a'  # Réponse correcte
            }
        }

        response = client.post(
            '/api/correction/batch',
            headers={'Authorization': f'Bearer {user_token}'},
            json=batch_data
        )

        assert response.status_code == 202
        data = response.get_json()
        task_id = data['task_id']

        # Étape 2: Vérifier le statut de la tâche
        response = client.get(
            f'/api/correction/tasks/{task_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        task_data = response.get_json()
        assert task_data['task_id'] == task_id


class TestUserQuizJourney:
    """Tests e2e pour le parcours complet d'un utilisateur"""

    def test_teacher_creates_and_publishes_quiz(self, client, user_token):
        """
        Test e2e: Un enseignant crée et publie un QCM
        1. Créer un QCM
        2. Ajouter des questions (via génération)
        3. Publier le QCM
        4. Vérifier que le QCM est publié
        """
        # Étape 1: Créer un QCM
        qcm_data = {
            'titre': 'QCM Histoire',
            'description': 'Quiz sur la Révolution française',
            'duree': 30,
            'matiere': 'Histoire',
            'status': 'draft'
        }

        response = client.post(
            '/api/qcm',
            headers={'Authorization': f'Bearer {user_token}'},
            json=qcm_data
        )

        assert response.status_code == 201
        qcm = response.get_json()
        qcm_id = qcm['id']

        # Étape 2: Vérifier que le QCM est en draft
        assert qcm['status'] == 'draft'

        # Étape 3: Publier le QCM
        response = client.patch(
            f'/api/qcm/{qcm_id}/publish',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        published_qcm = response.get_json()
        assert published_qcm['status'] == 'published'

        # Étape 4: Vérifier que le QCM est bien publié
        response = client.get(
            f'/api/qcm/{qcm_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        final_qcm = response.get_json()
        assert final_qcm['status'] == 'published'

    def test_student_takes_quiz_and_gets_results(self, client, user_token, sample_qcm, sample_question):
        """
        Test e2e: Un étudiant passe un QCM et reçoit ses résultats
        1. Récupérer le QCM
        2. Récupérer les questions
        3. Soumettre les réponses
        4. Attendre les résultats
        """
        # Étape 1: Récupérer le QCM
        response = client.get(
            f'/api/qcm/{sample_qcm.id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        qcm = response.get_json()

        # Étape 2: Récupérer les questions
        response = client.get(
            f'/api/qcm/{sample_qcm.id}/questions',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        questions_data = response.get_json()
        questions = questions_data['questions']
        assert len(questions) > 0

        # Étape 3: Soumettre les réponses
        answers = {
            sample_question.id: 'a'  # Réponse correcte
        }

        response = client.post(
            '/api/correction/batch',
            headers={'Authorization': f'Bearer {user_token}'},
            json={
                'qcm_id': sample_qcm.id,
                'answers': answers
            }
        )

        assert response.status_code == 202
        correction_data = response.get_json()
        task_id = correction_data['task_id']

        # Étape 4: Vérifier le statut de la correction
        response = client.get(
            f'/api/correction/tasks/{task_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200


class TestQuizLifecycle:
    """Tests e2e pour le cycle de vie complet d'un QCM"""

    def test_full_quiz_lifecycle(self, client, user_token):
        """
        Test e2e: Cycle de vie complet d'un QCM
        1. Création
        2. Modification
        3. Publication
        4. Archivage
        5. Suppression
        """
        # Étape 1: Création
        qcm_data = {
            'titre': 'QCM Lifecycle Test',
            'description': 'Test du cycle de vie',
            'status': 'draft'
        }

        response = client.post(
            '/api/qcm',
            headers={'Authorization': f'Bearer {user_token}'},
            json=qcm_data
        )

        assert response.status_code == 201
        qcm = response.get_json()
        qcm_id = qcm['id']

        # Étape 2: Modification
        update_data = {
            'titre': 'QCM Lifecycle Test (Modifié)',
            'duree': 45
        }

        response = client.put(
            f'/api/qcm/{qcm_id}',
            headers={'Authorization': f'Bearer {user_token}'},
            json=update_data
        )

        assert response.status_code == 200
        updated_qcm = response.get_json()
        assert updated_qcm['titre'] == update_data['titre']
        assert updated_qcm['duree'] == 45

        # Étape 3: Publication
        response = client.patch(
            f'/api/qcm/{qcm_id}/publish',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        published_qcm = response.get_json()
        assert published_qcm['status'] == 'published'

        # Étape 4: Archivage
        archive_data = {
            'status': 'archived'
        }

        response = client.put(
            f'/api/qcm/{qcm_id}',
            headers={'Authorization': f'Bearer {user_token}'},
            json=archive_data
        )

        assert response.status_code == 200
        archived_qcm = response.get_json()
        assert archived_qcm['status'] == 'archived'

        # Étape 5: Suppression
        response = client.delete(
            f'/api/qcm/{qcm_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200

        # Vérifier que le QCM est bien supprimé
        response = client.get(
            f'/api/qcm/{qcm_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 404
