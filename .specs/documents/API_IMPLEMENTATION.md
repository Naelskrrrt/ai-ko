# Documentation Complète des APIs - AI-KO

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Endpoints API](#endpoints-api)
4. [Tâches Celery](#tâches-celery)
5. [Tests](#tests)
6. [Installation et Configuration](#installation-et-configuration)
7. [Utilisation](#utilisation)

---

## Vue d'ensemble

Cette documentation couvre l'implémentation complète des APIs pour le système AI-KO, incluant:

- ✅ **API de gestion des QCM** (CRUD complet)
- ✅ **API de génération de quiz avec IA** (depuis texte ou documents)
- ✅ **API de correction automatique** (avec similarité sémantique)
- ✅ **Tâches Celery asynchrones** pour les opérations longues
- ✅ **Documentation OpenAPI/Swagger** automatique
- ✅ **Tests unitaires et e2e** complets

---

## Architecture

### Stack Technologique

- **Backend**: Flask 3.1.0 avec Flask-RESTX
- **ORM**: SQLAlchemy 2.0.36
- **Base de données**: PostgreSQL 15+ (SQLite pour dev/tests)
- **Cache/Queue**: Redis 7+ avec Celery 5.4.0
- **IA/ML**: Hugging Face Transformers (T5, BERT)
- **Tests**: Pytest

### Patterns Architecturaux

Le projet suit une **Clean Architecture** avec séparation des couches:

```
app/
├── api/              # Routes et endpoints (Controllers)
│   ├── qcm.py       # Endpoints QCM
│   ├── correction.py # Endpoints correction
│   └── docs.py      # Documentation Swagger
├── services/        # Logique métier (Services)
│   ├── qcm_service.py
│   └── question_service.py
├── repositories/    # Accès aux données (Repositories)
│   ├── qcm_repository.py
│   └── question_repository.py
├── models/          # Modèles de données (Entities)
│   ├── qcm.py
│   └── question.py
└── tasks/           # Tâches Celery asynchrones
    ├── quiz_generation.py
    ├── correction.py
    └── reports.py
```

---

## Endpoints API

### 1. API QCM (`/api/qcm`)

#### 1.1 Liste des QCMs

**GET** `/api/qcm`

Query parameters:
- `skip` (int, optionnel): Nombre d'éléments à sauter (pagination)
- `limit` (int, optionnel): Nombre d'éléments à retourner (max 100)
- `status` (string, optionnel): Filtrer par statut (`draft`, `published`, `archived`)
- `matiere` (string, optionnel): Filtrer par matière

Réponse:
```json
{
  "data": [
    {
      "id": "uuid",
      "titre": "QCM de Mathématiques",
      "description": "Description...",
      "duree": 60,
      "matiere": "Mathématiques",
      "status": "published",
      "createurId": "user-uuid",
      "nombreQuestions": 10,
      "createdAt": "2025-01-21T10:00:00",
      "updatedAt": "2025-01-21T10:00:00"
    }
  ],
  "total": 50,
  "skip": 0,
  "limit": 100
}
```

#### 1.2 Créer un QCM

**POST** `/api/qcm`

Body:
```json
{
  "titre": "Nouveau QCM",
  "description": "Description du QCM",
  "duree": 30,
  "matiere": "Informatique",
  "status": "draft"
}
```

Réponse: `201 Created`

#### 1.3 Récupérer un QCM

**GET** `/api/qcm/{qcm_id}`

Réponse: `200 OK` avec les détails du QCM

#### 1.4 Mettre à jour un QCM

**PUT** `/api/qcm/{qcm_id}`

Body:
```json
{
  "titre": "Titre modifié",
  "description": "Nouvelle description",
  "duree": 45
}
```

Réponse: `200 OK`

#### 1.5 Supprimer un QCM

**DELETE** `/api/qcm/{qcm_id}`

Réponse: `200 OK`

#### 1.6 Publier un QCM

**PATCH** `/api/qcm/{qcm_id}/publish`

Change le statut du QCM en `published`.

Réponse: `200 OK`

#### 1.7 Récupérer les questions d'un QCM

**GET** `/api/qcm/{qcm_id}/questions`

Réponse:
```json
{
  "qcm_id": "uuid",
  "questions": [
    {
      "id": "uuid",
      "enonce": "Quelle est la capitale de la France?",
      "typeQuestion": "qcm",
      "options": [
        {"id": "a", "texte": "Paris", "estCorrecte": true},
        {"id": "b", "texte": "Lyon", "estCorrecte": false}
      ],
      "points": 1
    }
  ],
  "total": 10
}
```

#### 1.8 Générer un QCM depuis du texte

**POST** `/api/qcm/generate/text`

Body:
```json
{
  "titre": "QCM Généré",
  "text": "Texte source pour la génération...",
  "num_questions": 5,
  "matiere": "Biologie",
  "duree": 30
}
```

Réponse: `202 Accepted`
```json
{
  "task_id": "celery-task-uuid",
  "status": "PENDING",
  "qcm_id": "qcm-uuid",
  "message": "Génération en cours..."
}
```

#### 1.9 Générer un QCM depuis un document

**POST** `/api/qcm/generate/document`

Body:
```json
{
  "titre": "QCM depuis PDF",
  "file_content": "base64-encoded-file",
  "file_type": "pdf",
  "num_questions": 5,
  "matiere": "Histoire"
}
```

Réponse: `202 Accepted` (même format que génération depuis texte)

#### 1.10 Vérifier le statut d'une tâche

**GET** `/api/qcm/tasks/{task_id}`

Réponse:
```json
{
  "task_id": "uuid",
  "status": "SUCCESS",
  "result": {
    "status": "success",
    "qcm_id": "uuid",
    "num_questions": 5,
    "message": "5 questions générées avec succès"
  }
}
```

Statuts possibles: `PENDING`, `PROGRESS`, `SUCCESS`, `FAILURE`

---

### 2. API Correction (`/api/correction`)

#### 2.1 Soumettre une réponse

**POST** `/api/correction/submit`

Body:
```json
{
  "question_id": "uuid",
  "answer": "a"
}
```

Réponse: `202 Accepted`
```json
{
  "task_id": "celery-task-uuid",
  "status": "PENDING",
  "message": "Correction en cours..."
}
```

#### 2.2 Soumettre toutes les réponses d'un QCM

**POST** `/api/correction/batch`

Body:
```json
{
  "qcm_id": "uuid",
  "answers": {
    "question-uuid-1": "a",
    "question-uuid-2": "b",
    "question-uuid-3": "Réponse textuelle"
  }
}
```

Réponse: `202 Accepted`

#### 2.3 Vérifier le statut d'une correction

**GET** `/api/correction/tasks/{task_id}`

Réponse pour une correction réussie:
```json
{
  "task_id": "uuid",
  "status": "SUCCESS",
  "result": {
    "status": "success",
    "qcm_id": "uuid",
    "total_questions": 10,
    "questions_answered": 10,
    "results": [
      {
        "question_id": "uuid",
        "is_correct": true,
        "score": 1.0,
        "feedback": "Bonne réponse!",
        "max_points": 1,
        "points_earned": 1.0
      }
    ],
    "total_score": 8.5,
    "total_points": 10,
    "score_percentage": 85.0,
    "global_feedback": "Bon travail! Quelques points à revoir."
  }
}
```

---

## Tâches Celery

### 1. Génération de Quiz

#### `generate_quiz_from_text`

Génère un QCM à partir de texte brut.

**Paramètres:**
- `qcm_id` (str): ID du QCM à remplir
- `text` (str): Texte source
- `num_questions` (int): Nombre de questions à générer

**Fonctionnement:**
1. Charge le modèle T5 pour la génération de texte
2. Segmente le texte en chunks
3. Génère des questions pour chaque chunk
4. Génère des options de réponse (1 correcte + distracteurs)
5. Sauvegarde les questions dans la base de données

**Modèles IA utilisés:**
- **T5-base** pour la génération de questions et réponses

#### `generate_quiz_from_document`

Génère un QCM à partir d'un document PDF ou DOCX.

**Paramètres:**
- `qcm_id` (str): ID du QCM à remplir
- `file_bytes` (bytes): Contenu du fichier
- `file_type` (str): Type de fichier (`pdf` ou `docx`)
- `num_questions` (int): Nombre de questions

**Fonctionnement:**
1. Extrait le texte du document (PyPDF2 ou python-docx)
2. Délègue à `generate_quiz_from_text`

---

### 2. Correction Automatique

#### `correct_student_answer`

Corrige une réponse individuelle.

**Paramètres:**
- `question_id` (str): ID de la question
- `student_answer` (str): Réponse de l'étudiant

**Algorithme de correction:**

**Pour les QCM:**
- Comparaison exacte avec la réponse correcte
- Score: 1.0 (correct) ou 0.0 (incorrect)

**Pour les questions ouvertes:**
1. **Similarité sémantique** (BERT embeddings + cosinus)
   - Transforme les textes en embeddings
   - Calcule la similarité cosinus
   - Poids: 70%

2. **Analyse des mots-clés**
   - Extrait les mots-clés importants
   - Compare avec les mots-clés attendus
   - Poids: 30%

3. **Score final pondéré:**
   ```
   score_final = (similarité_sémantique × 0.7) + (score_mots_clés × 0.3)
   ```

4. **Seuil d'acceptation:** 0.6 (60%)

**Feedback personnalisé:**
- Score ≥ 0.9: "Excellente réponse!"
- Score ≥ 0.75: "Bonne réponse. Quelques détails à améliorer."
- Score ≥ 0.6: "Réponse acceptable, mais éléments manquants."
- Score < 0.6: "Réponse insuffisante."

#### `batch_correct_answers`

Corrige toutes les réponses d'un QCM.

**Paramètres:**
- `qcm_id` (str): ID du QCM
- `student_answers` (dict): Dictionnaire {question_id: answer}

**Résultat:**
- Corrections individuelles pour chaque question
- Score total et pourcentage
- Feedback global basé sur le score

---

## Tests

### Tests Unitaires

#### Tests API QCM (`tests/test_api_qcm.py`)

- ✅ Liste des QCMs
- ✅ Création de QCM
- ✅ Validation des données (titre, durée, etc.)
- ✅ Récupération par ID
- ✅ Mise à jour
- ✅ Suppression
- ✅ Publication
- ✅ Génération depuis texte
- ✅ Pagination et filtres

#### Tests API Correction (`tests/test_api_correction.py`)

- ✅ Soumission de réponse
- ✅ Correction batch
- ✅ Validation des données
- ✅ Calcul de similarité sémantique
- ✅ Extraction de mots-clés
- ✅ Scoring des réponses ouvertes

### Tests E2E (`tests/test_e2e_quiz_flow.py`)

- ✅ Flux complet de génération de quiz
- ✅ Flux complet de correction
- ✅ Parcours enseignant (créer, modifier, publier)
- ✅ Parcours étudiant (passer un quiz, recevoir résultats)
- ✅ Cycle de vie complet d'un QCM

### Exécution des Tests

```bash
# Installer les dépendances de test
pip install -r requirements-dev.txt

# Lancer tous les tests
pytest

# Lancer avec couverture
pytest --cov=app --cov-report=html

# Lancer uniquement les tests unitaires
pytest tests/test_api_*.py

# Lancer uniquement les tests e2e
pytest tests/test_e2e_*.py

# Lancer un test spécifique
pytest tests/test_api_qcm.py::TestQCMAPI::test_create_qcm -v
```

---

## Installation et Configuration

### 1. Installation des Dépendances

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configuration de l'Environnement

Créer un fichier `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_ko
# ou pour SQLite en développement:
# DATABASE_URL=sqlite:///app.db

# Redis & Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Flask
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# Hugging Face
HF_API_TOKEN=your-huggingface-token
HF_TEXT_GENERATION_MODEL=t5-base
HF_BERT_MODEL=bert-base-uncased

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3. Initialiser la Base de Données

```bash
# Créer les tables
flask db upgrade

# Créer un utilisateur admin (optionnel)
python create_admin.py
```

### 4. Démarrer les Services

**Terminal 1 - Backend Flask:**
```bash
python run.py
# ou avec Gunicorn en production:
gunicorn --bind 0.0.0.0:5000 --workers 4 run:app
```

**Terminal 2 - Celery Worker:**
```bash
celery -A celery_app.celery worker --loglevel=info
```

**Terminal 3 - Celery Beat (optionnel, pour tâches planifiées):**
```bash
celery -A celery_app.celery beat --loglevel=info
```

---

## Utilisation

### 1. Accéder à la Documentation Swagger

Ouvrir dans le navigateur:
```
http://localhost:5000/api/docs/swagger/
```

La documentation interactive Swagger permet de:
- Explorer tous les endpoints
- Tester les API directement
- Voir les modèles de données
- Comprendre les codes de réponse

### 2. Authentification

Toutes les API (sauf `/health`) nécessitent une authentification JWT.

**Obtenir un token:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Utiliser le token:**

```bash
curl -X GET http://localhost:5000/api/qcm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Exemple Complet: Générer un QCM

**Étape 1: Créer et générer le QCM**

```bash
curl -X POST http://localhost:5000/api/qcm/generate/text \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "QCM sur la Photosynthèse",
    "text": "La photosynthèse est le processus par lequel les plantes...",
    "num_questions": 5,
    "matiere": "Biologie",
    "duree": 20
  }'
```

Réponse:
```json
{
  "task_id": "abc-123-def",
  "qcm_id": "qcm-uuid",
  "status": "PENDING"
}
```

**Étape 2: Vérifier le statut**

```bash
curl -X GET http://localhost:5000/api/qcm/tasks/abc-123-def \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Étape 3: Récupérer le QCM avec les questions**

```bash
curl -X GET http://localhost:5000/api/qcm/qcm-uuid/questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Exemple Complet: Corriger un QCM

**Soumettre les réponses:**

```bash
curl -X POST http://localhost:5000/api/correction/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qcm_id": "qcm-uuid",
    "answers": {
      "question-1-uuid": "a",
      "question-2-uuid": "b",
      "question-3-uuid": "Ma réponse textuelle"
    }
  }'
```

**Vérifier le résultat:**

```bash
curl -X GET http://localhost:5000/api/correction/tasks/task-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Métriques de Performance

### Temps de Traitement Estimés

- **Génération de quiz (5 questions):** 30-60 secondes
- **Correction QCM (1 réponse):** < 1 seconde
- **Correction question ouverte (1 réponse):** 2-5 secondes
- **Correction batch (10 questions):** 5-15 secondes

### Optimisations Implémentées

1. **Cache des modèles IA** - Les modèles sont chargés une seule fois en mémoire
2. **Traitement asynchrone** - Toutes les opérations longues sont gérées par Celery
3. **Pagination** - Limite le nombre de résultats retournés
4. **Indexation base de données** - Index sur les champs fréquemment utilisés

---

## Limitations Connues

1. **Modèles IA:**
   - T5-base peut générer des questions de qualité variable
   - Fine-tuning recommandé pour améliorer la précision
   - BERT pour similarité sémantique nécessite GPU pour de meilleures performances

2. **Documents:**
   - PDF complexes (images, tableaux) peuvent avoir une extraction de texte limitée
   - Taille maximale de document: 10 MB recommandé

3. **Langues:**
   - Optimisé pour le français
   - Support multilingue limité

---

## Prochaines Améliorations

- [ ] Support de plus de types de questions (appariement, ordre, etc.)
- [ ] Export PDF des résultats
- [ ] Intégration Moodle
- [ ] Fine-tuning des modèles T5
- [ ] Support multilingue complet
- [ ] Dashboard de statistiques avancées
- [ ] API de gestion des résultats et évaluations

---

## Support

Pour toute question ou problème:
- **Documentation:** Ce fichier et `/api/docs/swagger/`
- **Issues:** Créer une issue sur GitHub
- **Email:** tech@ai-ko.com

---

**Version:** 1.0
**Date:** Janvier 2025
**Auteur:** Équipe AI-KO
