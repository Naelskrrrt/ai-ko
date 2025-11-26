# Guide de Test des API

Ce guide explique comment tester toutes les API de manière complète et automatique.

## 🚀 Démarrage Rapide

### Sur Linux/Mac

```bash
cd backend
./run_api_tests.sh
```

### Sur Windows

```powershell
cd backend
.\run_api_tests.ps1
```

### Ou directement avec Python

```bash
cd backend
python test_all_api.py
```

## 📋 Prérequis

1. **Serveur backend en cours d'exécution**
   - Le serveur doit être accessible sur `http://localhost:5000`
   - Vérifiez avec: `curl http://localhost:5000/health`

2. **Base de données initialisée**
   - Les migrations doivent être appliquées
   - Exécutez: `flask db upgrade`

3. **Utilisateurs de test**
   - Le script créera automatiquement les utilisateurs nécessaires:
     - `admin@test.com` / `admin123` (rôle: admin)
     - `enseignant@test.com` / `enseignant123` (rôle: enseignant)
     - `etudiant@test.com` / `etudiant123` (rôle: étudiant)

## 🧪 Endpoints Testés

### Santé
- ✅ `GET /health` - Health check simple
- ✅ `GET /health/detailed` - Health check détaillé
- ✅ `GET /health/ready` - Readiness check
- ✅ `GET /health/live` - Liveness check

### Authentification
- ✅ `POST /api/auth/register` - Inscription
- ✅ `POST /api/auth/login` - Connexion
- ✅ `GET /api/auth/me` - Profil utilisateur
- ✅ `POST /api/auth/logout` - Déconnexion

### Niveaux
- ✅ `GET /api/niveaux` - Liste tous les niveaux
- ✅ `GET /api/niveaux/cycle/{cycle}` - Niveaux par cycle
- ✅ `POST /api/niveaux` - Création (admin)
- ✅ `GET /api/niveaux/{id}` - Détails
- ✅ `PUT /api/niveaux/{id}` - Mise à jour (admin)
- ✅ `DELETE /api/niveaux/{id}` - Suppression (admin)

### Matières
- ✅ `GET /api/matieres` - Liste toutes les matières
- ✅ `POST /api/matieres` - Création (admin)
- ✅ `GET /api/matieres/{id}` - Détails
- ✅ `PUT /api/matieres/{id}` - Mise à jour (admin)
- ✅ `DELETE /api/matieres/{id}` - Suppression (admin)

### Classes
- ✅ `GET /api/classes` - Liste toutes les classes
- ✅ `POST /api/classes` - Création (admin/enseignant)
- ✅ `GET /api/classes/{id}` - Détails
- ✅ `GET /api/classes/niveau/{niveau_id}` - Classes par niveau
- ✅ `PUT /api/classes/{id}` - Mise à jour (admin/enseignant)
- ✅ `DELETE /api/classes/{id}` - Suppression (admin/enseignant)

### QCM
- ✅ `GET /api/qcm` - Liste tous les QCM
- ✅ `POST /api/qcm` - Création
- ✅ `GET /api/qcm/{id}` - Détails
- ✅ `PUT /api/qcm/{id}` - Mise à jour
- ✅ `PATCH /api/qcm/{id}/publish` - Publication
- ✅ `GET /api/qcm/{id}/questions` - Questions d'un QCM
- ✅ `DELETE /api/qcm/{id}` - Suppression

### Sessions d'Examen
- ✅ `GET /api/sessions` - Liste toutes les sessions
- ✅ `POST /api/sessions` - Création (admin/enseignant)
- ✅ `GET /api/sessions/{id}` - Détails
- ✅ `PATCH /api/sessions/{id}/demarrer` - Démarrage
- ✅ `PATCH /api/sessions/{id}/terminer` - Terminaison
- ✅ `GET /api/sessions/disponibles` - Sessions disponibles (étudiant)
- ✅ `DELETE /api/sessions/{id}` - Suppression

### Résultats
- ✅ `GET /api/resultats` - Liste tous les résultats (admin/enseignant)
- ✅ `GET /api/resultats/{id}` - Détails
- ✅ `POST /api/resultats/demarrer` - Démarrage d'examen (étudiant)
- ✅ `POST /api/resultats/{id}/soumettre` - Soumission des réponses
- ✅ `GET /api/resultats/etudiant/{id}` - Résultats d'un étudiant

### Administration
- ✅ `GET /api/admin/users` - Liste des utilisateurs
- ✅ `GET /api/admin/qcm` - Liste des QCM
- ✅ `GET /api/admin/questions` - Liste des questions
- ✅ `GET /api/admin/statistics/dashboard` - Statistiques dashboard
- ✅ `GET /api/admin/statistics/metrics` - Métriques
- ✅ `GET /api/admin/statistics/users-by-role` - Stats par rôle
- ✅ `GET /api/admin/statistics/qcms-by-status` - Stats par statut

### Correction
- ✅ `POST /api/correction/submit` - Soumission d'une réponse
- ✅ `POST /api/correction/batch` - Soumission batch

## 📊 Rapport des Tests

Après l'exécution, un rapport JSON est généré avec:
- Résumé (total, passés, échoués, taux de réussite)
- Détails de chaque test
- Erreurs rencontrées

Le fichier est nommé: `test_report_YYYYMMDD_HHMMSS.json`

## 🔧 Options

```bash
python test_all_api.py --help
```

Options disponibles:
- `--url URL` - URL de base de l'API (défaut: http://localhost:5000)
- `--skip-cleanup` - Ne pas nettoyer les ressources créées

## 🐛 Dépannage

### Erreur de connexion

```
❌ Impossible de se connecter à http://localhost:5000
```

**Solution:** Vérifiez que le serveur backend est en cours d'exécution:
```bash
python run.py
# ou
docker-compose up backend
```

### Erreur d'authentification

```
❌ Impossible d'obtenir un token admin
```

**Solution:** Vérifiez que la base de données est initialisée:
```bash
flask db upgrade
```

### Erreur 500 (Internal Server Error)

Vérifiez les logs du serveur backend pour plus de détails.

## 📝 Notes

- Les ressources créées pendant les tests sont automatiquement nettoyées
- Les tests sont idempotents (peuvent être exécutés plusieurs fois)
- Les utilisateurs de test sont créés automatiquement s'ils n'existent pas
- Les tests vérifient les permissions (admin, enseignant, étudiant)

## 🎯 Prochaines Étapes

Après avoir exécuté les tests:

1. **Examiner le rapport JSON** pour les détails
2. **Corriger les erreurs** identifiées
3. **Réexécuter les tests** pour vérifier les corrections
4. **Intégrer dans CI/CD** pour des tests automatiques

## 📚 Documentation Complémentaire

- [Documentation API Swagger](http://localhost:5000/api/docs/swagger/)
- [Guide de développement](../BACKEND_SETUP.md)
- [Documentation des tests](../TESTS_DOCUMENTATION.md)





