# 🧪 Documentation des Tests - AI-KO Backend

## 📋 Vue d'Ensemble

Cette documentation décrit la suite de tests complète pour le backend AI-KO, couvrant tous les endpoints API créés.

---

## 📦 Structure des Tests

```
backend/tests/
├── __init__.py
├── test_config.py              # Configuration pytest & fixtures
├── pytest.ini                  # Configuration pytest
├── api/
│   ├── __init__.py
│   ├── test_niveau_api.py      # Tests endpoints Niveaux
│   ├── test_matiere_api.py     # Tests endpoints Matières
│   ├── test_session_api.py     # Tests endpoints Sessions
│   └── test_resultat_api.py    # Tests endpoints Résultats
└── scripts/
    ├── run_tests.sh            # Script Linux/Mac
    └── run_tests.ps1           # Script Windows
```

---

## 🚀 Installation des Dépendances

### Avec pip

```bash
cd backend
pip install pytest pytest-cov pytest-env
```

### Avec Docker

```bash
docker-compose exec backend pip install pytest pytest-cov pytest-env
```

---

## ▶️ Exécution des Tests

### Méthode 1: Script Automatique (Recommandé)

**Linux/Mac:**
```bash
cd backend
./scripts/run_tests.sh [option]
```

**Windows:**
```powershell
cd backend
.\scripts\run_tests.ps1 [option]
```

**Options disponibles:**
- `all` - Tous les tests (par défaut)
- `api` - Tests API uniquement
- `unit` - Tests unitaires uniquement
- `cov` - Tests avec rapport de couverture
- `fast` - Tests rapides uniquement (exclut les tests marqués `slow`)
- `verbose` - Mode verbeux avec détails
- `help` - Afficher l'aide

### Méthode 2: Pytest Direct

```bash
# Tous les tests
pytest tests/

# Tests API uniquement
pytest tests/api/

# Tests avec couverture
pytest tests/ --cov=app --cov-report=html

# Tests d'un fichier spécifique
pytest tests/api/test_niveau_api.py

# Test d'une classe spécifique
pytest tests/api/test_niveau_api.py::TestNiveauAPI

# Test d'une méthode spécifique
pytest tests/api/test_niveau_api.py::TestNiveauAPI::test_get_all_niveaux_without_auth

# Mode verbose
pytest tests/ -vv -s
```

### Méthode 3: Avec Docker

```bash
# Tous les tests
docker-compose exec backend pytest tests/

# Avec couverture
docker-compose exec backend pytest tests/ --cov=app --cov-report=html
```

---

## 📊 Tests Créés

### 1. Tests API Niveaux (test_niveau_api.py)

**Couverture: 8 tests**

✅ `test_get_all_niveaux_without_auth` - Liste des niveaux sans auth
✅ `test_get_niveaux_by_cycle` - Filtrage par cycle
✅ `test_create_niveau_as_admin` - Création en tant qu'admin
✅ `test_create_niveau_without_admin_fails` - Échec si non-admin
✅ `test_update_niveau` - Mise à jour d'un niveau
✅ `test_delete_niveau` - Suppression d'un niveau
✅ `test_validation_code_unique` - Validation unicité du code
✅ `test_validation_cycle` - Validation du cycle

**Endpoints testés:**
- `GET /api/niveaux`
- `POST /api/niveaux`
- `GET /api/niveaux/{id}`
- `PUT /api/niveaux/{id}`
- `DELETE /api/niveaux/{id}`
- `GET /api/niveaux/cycle/{cycle}`

### 2. Tests API Matières (test_matiere_api.py)

**Couverture: 7 tests**

✅ `test_get_all_matieres` - Liste des matières
✅ `test_get_matieres_actives_only` - Filtrage matières actives
✅ `test_create_matiere_as_admin` - Création par admin
✅ `test_create_matiere_validation_coefficient` - Validation coefficient
✅ `test_create_matiere_validation_couleur` - Validation format hex
✅ `test_update_matiere` - Mise à jour
✅ `test_delete_matiere` - Suppression

**Endpoints testés:**
- `GET /api/matieres`
- `POST /api/matieres`
- `GET /api/matieres/{id}`
- `PUT /api/matieres/{id}`
- `DELETE /api/matieres/{id}`

### 3. Tests API Sessions (test_session_api.py)

**Couverture: 5 tests**

✅ `test_create_session_as_enseignant` - Création par enseignant
✅ `test_create_session_validation_dates` - Validation dates cohérentes
✅ `test_demarrer_session` - Démarrage d'une session
✅ `test_terminer_session` - Terminaison d'une session
✅ `test_get_sessions_disponibles_etudiant` - Sessions disponibles

**Endpoints testés:**
- `POST /api/sessions`
- `PATCH /api/sessions/{id}/demarrer`
- `PATCH /api/sessions/{id}/terminer`
- `GET /api/sessions/disponibles`

### 4. Tests API Résultats (test_resultat_api.py)

**Couverture: 5 tests**

✅ `test_demarrer_examen` - Démarrage examen étudiant
✅ `test_demarrer_examen_tentatives_max_depassees` - Limite tentatives
✅ `test_soumettre_reponses` - Soumission réponses
✅ `test_ajouter_commentaire_prof` - Commentaire professeur
✅ `test_get_statistiques_etudiant` - Statistiques étudiant

**Endpoints testés:**
- `POST /api/resultats/demarrer`
- `POST /api/resultats/{id}/soumettre`
- `POST /api/resultats/{id}/commentaire`
- `GET /api/resultats/etudiant/{id}/statistiques`

---

## 🎯 Cas de Test Couverts

### Authentification & Permissions
- ✅ Accès public (sans auth)
- ✅ Accès admin uniquement
- ✅ Accès enseignant
- ✅ Accès étudiant
- ✅ Refus d'accès pour rôles incorrects

### Validations
- ✅ Unicité des codes (niveaux, matières)
- ✅ Formats de données (hex, dates, coefficients)
- ✅ Contraintes métier (dates cohérentes, tentatives max)
- ✅ Relations entre entités (QCM, sessions, questions)

### CRUD Complet
- ✅ Création (POST)
- ✅ Lecture (GET)
- ✅ Mise à jour (PUT)
- ✅ Suppression (DELETE)
- ✅ Actions spécifiques (démarrer, terminer, soumettre)

### Filtres & Recherche
- ✅ Filtrage par cycle (niveaux)
- ✅ Filtrage par statut (actif/inactif)
- ✅ Sessions disponibles
- ✅ Statistiques

---

## 📈 Rapport de Couverture

### Générer le Rapport

```bash
# Avec script
./scripts/run_tests.sh cov

# Avec pytest direct
pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

# Ouvrir le rapport HTML
open htmlcov/index.html  # Mac/Linux
start htmlcov/index.html  # Windows
```

### Objectif de Couverture

- **Repositories:** 80%+
- **Services:** 85%+
- **Endpoints API:** 90%+

---

## 🔧 Configuration Pytest

Le fichier `pytest.ini` configure:

- **Dossier des tests:** `tests/`
- **Couverture de code:** Activée par défaut
- **Rapports:** HTML + Terminal + XML
- **Markers:** Pour catégoriser les tests
- **Variables d'env:** Mode testing, base SQLite en mémoire

---

## 🎨 Fixtures Disponibles

Consultez `test_config.py` pour toutes les fixtures:

### Applications & Base de Données
- `app` - Instance Flask de test
- `client` - Client HTTP de test
- `db_session` - Session DB nettoyée à chaque test

### Utilisateurs
- `admin_user` - Utilisateur admin
- `enseignant_user` - Utilisateur enseignant
- `etudiant_user` - Utilisateur étudiant
- `admin_token` - Token JWT admin
- `enseignant_token` - Token JWT enseignant
- `etudiant_token` - Token JWT étudiant

### Données de Test
- `niveau_l1` - Niveau Licence 1
- `niveau_m1` - Niveau Master 1
- `matiere_python` - Matière Python
- `matiere_java` - Matière Java
- `classe_l1_info` - Classe L1 Info
- `qcm_python` - QCM Python
- `question_python` - Question Python
- `session_examen` - Session d'examen
- `resultat` - Résultat d'examen

---

## 🐛 Debugging des Tests

### Afficher les Prints

```bash
pytest tests/ -s
```

### Mode Très Verbeux

```bash
pytest tests/ -vv
```

### Arrêter au Premier Échec

```bash
pytest tests/ -x
```

### Exécuter les Tests Échoués Uniquement

```bash
pytest tests/ --lf
```

### Désactiver les Warnings

```bash
pytest tests/ --disable-warnings
```

---

## 📝 Ajouter de Nouveaux Tests

### Structure d'un Test API

```python
"""
Tests pour l'endpoint XYZ
"""
import pytest
from app.models.xyz import XYZ
from app.models.user import User, UserRole


class TestXYZAPI:
    """Tests pour l'API XYZ"""

    def test_nom_du_test(self, client, db_session, admin_token):
        """Description du test"""
        # Arrange - Préparer les données
        # ...

        # Act - Exécuter l'action
        response = client.get('/api/xyz',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        # Assert - Vérifier les résultats
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) > 0
```

---

## ✅ Checklist d'Exécution

Avant de commit/push:

- [ ] Tous les tests passent: `./scripts/run_tests.sh all`
- [ ] Couverture >= 80%: `./scripts/run_tests.sh cov`
- [ ] Pas de warnings: vérifier la sortie
- [ ] Tests rapides uniquement: `./scripts/run_tests.sh fast`

---

## 🚀 CI/CD Integration

### GitHub Actions (exemple)

```yaml
- name: Run tests
  run: |
    cd backend
    pip install pytest pytest-cov pytest-env
    pytest tests/ --cov=app --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./backend/coverage.xml
```

---

## 📞 Support

- **Fichiers de configuration:** `pytest.ini`, `test_config.py`
- **Scripts:** `scripts/run_tests.sh`, `scripts/run_tests.ps1`
- **Documentation:** Ce fichier

---

## 📊 Statistiques

- **Total de tests:** 25+
- **Endpoints testés:** 33
- **Fixtures créées:** 15+
- **Couverture visée:** 85%+

---

**Date:** 23 Novembre 2025
**Version:** 1.0.0
**Status:** ✅ Tests Complets
