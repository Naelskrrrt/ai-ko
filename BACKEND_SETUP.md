# Configuration Backend - Endpoints Système Éducatif

## ✅ Implémentation Complète

Tous les endpoints backend ont été créés pour le système de gestion d'examens universitaires.

## 📁 Structure Créée

### Repositories (`/backend/app/repositories/`)
- ✅ `niveau_repository.py` - Gestion des niveaux universitaires
- ✅ `matiere_repository.py` - Gestion des matières
- ✅ `classe_repository.py` - Gestion des classes
- ✅ `session_examen_repository.py` - Gestion des sessions d'examen
- ✅ `resultat_repository.py` - Gestion des résultats

### Services (`/backend/app/services/`)
- ✅ `niveau_service.py` - Logique métier niveaux
- ✅ `matiere_service.py` - Logique métier matières
- ✅ `classe_service.py` - Logique métier classes
- ✅ `session_examen_service.py` - Logique métier sessions
- ✅ `resultat_service.py` - Logique métier résultats

### Endpoints API (`/backend/app/api/`)
- ✅ `niveau.py` - API REST Niveaux
- ✅ `matiere.py` - API REST Matières
- ✅ `classe.py` - API REST Classes
- ✅ `session_examen.py` - API REST Sessions d'Examen
- ✅ `resultat.py` - API REST Résultats

### Scripts (`/backend/scripts/`)
- ✅ `seed_niveaux_matieres.py` - Enrichissement de la BDD (6 niveaux + 25 matières)

## 🔗 Endpoints Disponibles

### Niveaux (`/api/niveaux`)
- `GET /api/niveaux` - Liste tous les niveaux
- `POST /api/niveaux` - Crée un niveau (admin)
- `GET /api/niveaux/{id}` - Détails d'un niveau
- `PUT /api/niveaux/{id}` - Met à jour un niveau (admin)
- `DELETE /api/niveaux/{id}` - Supprime un niveau (admin)
- `GET /api/niveaux/cycle/{cycle}` - Niveaux par cycle

### Matières (`/api/matieres`)
- `GET /api/matieres` - Liste toutes les matières
- `POST /api/matieres` - Crée une matière (admin)
- `GET /api/matieres/{id}` - Détails d'une matière
- `PUT /api/matieres/{id}` - Met à jour une matière (admin)
- `DELETE /api/matieres/{id}` - Supprime une matière (admin)

### Classes (`/api/classes`)
- `GET /api/classes` - Liste toutes les classes (pagination)
- `POST /api/classes` - Crée une classe (admin/enseignant)
- `GET /api/classes/{id}` - Détails d'une classe
- `PUT /api/classes/{id}` - Met à jour une classe (admin/enseignant)
- `DELETE /api/classes/{id}` - Supprime une classe (admin/enseignant)
- `GET /api/classes/niveau/{niveau_id}` - Classes par niveau

### Sessions d'Examen (`/api/sessions`)
- `GET /api/sessions` - Liste toutes les sessions (pagination + filtres)
- `POST /api/sessions` - Crée une session (admin/enseignant)
- `GET /api/sessions/{id}` - Détails d'une session
- `PUT /api/sessions/{id}` - Met à jour une session (admin/enseignant)
- `DELETE /api/sessions/{id}` - Supprime une session (admin/enseignant)
- `PATCH /api/sessions/{id}/demarrer` - Démarre une session
- `PATCH /api/sessions/{id}/terminer` - Termine une session
- `GET /api/sessions/disponibles` - Sessions disponibles pour l'étudiant

### Résultats (`/api/resultats`)
- `GET /api/resultats` - Liste tous les résultats (admin/enseignant)
- `GET /api/resultats/{id}` - Détails d'un résultat
- `POST /api/resultats/demarrer` - Démarre un examen (étudiant)
- `POST /api/resultats/{id}/soumettre` - Soumet les réponses (étudiant)
- `POST /api/resultats/{id}/commentaire` - Ajoute un commentaire (enseignant)
- `GET /api/resultats/etudiant/{id}` - Résultats d'un étudiant
- `GET /api/resultats/session/{id}/statistiques` - Stats d'une session
- `GET /api/resultats/etudiant/{id}/statistiques` - Stats d'un étudiant

## 📝 Documentation Swagger

Tous les endpoints sont documentés dans Swagger UI :
- **URL:** `http://localhost:5000/api/docs /swagger/`
- **Authentification:** Bearer Token (JWT)

## 🚀 Démarrage

### 1. Migrations de la base de données

```bash
# Avec Docker
docker-compose exec backend flask db upgrade

# Sans Docker
cd backend
flask db upgrade
```

### 2. Enrichissement de la base de données

```bash
# Avec Docker (Recommandé)
docker-compose exec backend python scripts/seed_niveaux_matieres.py

# Sans Docker
cd backend
python scripts/seed_niveaux_matieres.py
```

### 3. Vérification

Accédez à Swagger UI pour tester les endpoints :
```
http://localhost:5000/api/docs/swagger/
```

## 🔐 Authentification

Tous les endpoints nécessitent un token JWT (sauf les endpoints publics) :

```bash
# 1. Obtenir un token (login)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 2. Utiliser le token
curl -X GET http://localhost:5000/api/niveaux \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Données Pré-remplies

Le script `seed_niveaux_matieres.py` crée :
- **6 niveaux** : L1, L2, L3, M1, M2, Doctorat
- **25 matières** : Couvrant tous les domaines de l'informatique
  - Programmation (Python, Java, C++)
  - Algorithmique
  - Bases de données
  - Web (Frontend, Backend, Full-Stack)
  - IA & Machine Learning
  - Réseaux & Sécurité
  - Génie Logiciel
  - etc.

## 🔄 Flux d'Utilisation

### Pour un Enseignant
1. Se connecter (`/api/auth/login`)
2. Créer un QCM (`/api/qcm`)
3. Créer une session d'examen (`/api/sessions`)
4. Démarrer la session (`/api/sessions/{id}/demarrer`)
5. Consulter les résultats (`/api/resultats/session/{id}/statistiques`)

### Pour un Étudiant
1. Se connecter (`/api/auth/login`)
2. Consulter les sessions disponibles (`/api/sessions/disponibles`)
3. Démarrer un examen (`/api/resultats/demarrer`)
4. Soumettre les réponses (`/api/resultats/{id}/soumettre`)
5. Consulter ses résultats (`/api/resultats/etudiant/{id}`)

## 🎯 Prochaines Étapes

1. ✅ Backend complet implémenté
2. ⏳ Génération de quiz avec LLM (à faire ensemble)
3. ⏳ Correction automatique avec IA
4. ⏳ Frontend pour l'interface utilisateur

## 📚 Modèles de Données

Consultez `/specs/MODELISATION_MERISE.md` pour la documentation complète des modèles.

## 🐛 Troubleshooting

### Erreur de migration
```bash
# Recréer les migrations
docker-compose exec backend flask db stamp head
docker-compose exec backend flask db migrate -m "Système éducatif complet"
docker-compose exec backend flask db upgrade
```

### Problème d'import
Vérifiez que tous les modèles sont importés dans `app/models/__init__.py`

### Erreur 403 (Forbidden)
Vérifiez que l'utilisateur a le bon rôle (ADMIN, ENSEIGNANT, ETUDIANT)

## 📞 Support

Pour toute question, consultez :
- Documentation Swagger : `/api/docs/swagger/`
- Spécifications : `/.specs/`
- Issues : GitHub Issues
