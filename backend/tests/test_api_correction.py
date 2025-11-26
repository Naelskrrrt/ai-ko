"""
Tests unitaires pour les API de correction automatique
"""
import pytest


class TestCorrectionAPI:
    """Tests pour les endpoints de correction"""

    def test_submit_answer(self, client, user_token, sample_question):
        """Test: Soumission d'une réponse pour correction"""
        answer_data = {
            'question_id': sample_question.id,
            'answer': 'a'  # Réponse correcte (Paris)
        }

        response = client.post(
            '/api/correction/submit',
            headers={'Authorization': f'Bearer {user_token}'},
            json=answer_data
        )

        assert response.status_code == 202
        data = response.get_json()
        assert 'task_id' in data
        assert data['status'] == 'PENDING'

    def test_submit_answer_missing_data(self, client, user_token):
        """Test: Soumission d'une réponse avec données manquantes"""
        answer_data = {
            'question_id': 'some-id'
            # Manque 'answer'
        }

        response = client.post(
            '/api/correction/submit',
            headers={'Authorization': f'Bearer {user_token}'},
            json=answer_data
        )

        assert response.status_code == 400

    def test_batch_submit(self, client, user_token, sample_qcm, sample_question):
        """Test: Soumission batch de réponses"""
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
        assert 'task_id' in data
        assert data['status'] == 'PENDING'
        assert data['qcm_id'] == sample_qcm.id

    def test_batch_submit_invalid_answers_format(self, client, user_token, sample_qcm):
        """Test: Soumission batch avec format invalide"""
        batch_data = {
            'qcm_id': sample_qcm.id,
            'answers': 'invalid-format'  # Devrait être un dict
        }

        response = client.post(
            '/api/correction/batch',
            headers={'Authorization': f'Bearer {user_token}'},
            json=batch_data
        )

        assert response.status_code == 400

    def test_get_correction_task_status(self, client, user_token):
        """Test: Récupération du statut d'une tâche de correction"""
        task_id = 'fake-task-id'

        response = client.get(
            f'/api/correction/tasks/{task_id}',
            headers={'Authorization': f'Bearer {user_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'task_id' in data
        assert 'status' in data

    def test_unauthorized_submit(self, client, sample_question):
        """Test: Soumission sans authentification"""
        answer_data = {
            'question_id': sample_question.id,
            'answer': 'a'
        }

        response = client.post(
            '/api/correction/submit',
            json=answer_data
        )

        assert response.status_code == 401


class TestCorrectionTasks:
    """Tests pour les tâches Celery de correction"""

    def test_correct_qcm_answer_correct(self, app, sample_question):
        """Test: Correction d'une réponse QCM correcte"""
        from app.tasks.correction import correct_qcm_answer

        with app.app_context():
            result = correct_qcm_answer(sample_question, 'a')

            assert result['is_correct'] is True
            assert result['score'] == 1.0
            assert 'Bonne réponse' in result['feedback']

    def test_correct_qcm_answer_incorrect(self, app, sample_question):
        """Test: Correction d'une réponse QCM incorrecte"""
        from app.tasks.correction import correct_qcm_answer

        with app.app_context():
            result = correct_qcm_answer(sample_question, 'b')

            assert result['is_correct'] is False
            assert result['score'] == 0.0
            assert 'incorrecte' in result['feedback'].lower()

    def test_calculate_semantic_similarity(self, app):
        """Test: Calcul de similarité sémantique"""
        from app.tasks.correction import calculate_semantic_similarity

        text1 = "Paris est la capitale de la France"
        text2 = "La capitale française est Paris"

        # Ces textes devraient avoir une similarité élevée
        similarity = calculate_semantic_similarity(text1, text2)

        assert 0 <= similarity <= 1
        # On s'attend à une similarité raisonnable (> 0.3) pour des textes similaires
        assert similarity > 0.3

    def test_extract_keywords(self, app):
        """Test: Extraction de mots-clés"""
        from app.tasks.correction import extract_keywords

        text = "Paris est la capitale de la France et compte 2 millions d'habitants"

        keywords = extract_keywords(text)

        assert isinstance(keywords, set)
        assert 'paris' in keywords
        assert 'capitale' in keywords
        assert 'france' in keywords
        # Les mots vides ne devraient pas être inclus
        assert 'est' not in keywords
        assert 'la' not in keywords

    def test_calculate_keyword_score(self, app):
        """Test: Calcul du score de mots-clés"""
        from app.tasks.correction import calculate_keyword_score

        student_answer = "Paris est la capitale de la France"
        correct_answer = "La capitale française est Paris"

        score = calculate_keyword_score(student_answer, correct_answer)

        assert 0 <= score <= 1
        # Les deux textes parlent de Paris et capitale, le score devrait être > 0
        assert score > 0

    def test_correct_open_answer_high_quality(self, app, db_session):
        """Test: Correction d'une réponse ouverte de qualité"""
        from app.tasks.correction import correct_open_answer
        from app.models.question import Question

        with app.app_context():
            # Créer une question ouverte
            question = Question(
                enonce='Quelle est la capitale de la France?',
                type_question='texte_libre',
                points=2,
                reponse_correcte='Paris est la capitale de la France',
                qcm_id='dummy-id'
            )

            result = correct_open_answer(question, 'La capitale de la France est Paris')

            assert result['score'] > 0.6  # Devrait être acceptée
            assert 'semantic_score' in result
            assert 'keyword_score' in result

    def test_correct_open_answer_low_quality(self, app):
        """Test: Correction d'une réponse ouverte de mauvaise qualité"""
        from app.tasks.correction import correct_open_answer
        from app.models.question import Question

        with app.app_context():
            question = Question(
                enonce='Quelle est la capitale de la France?',
                type_question='texte_libre',
                points=2,
                reponse_correcte='Paris est la capitale de la France',
                qcm_id='dummy-id'
            )

            result = correct_open_answer(question, 'Je ne sais pas')

            assert result['score'] < 0.6  # Devrait être rejetée
            assert result['is_correct'] is False
