# Refonte du Modèle de Données - Enseignants et Étudiants

## 📋 Vue d'Ensemble

Cette refonte sépare complètement les modèles **Enseignant** et **Étudiant** du modèle **User**, tout en introduisant les concepts d'**Établissement**, **Mention** et **Parcours** pour une modélisation plus riche et flexible du système éducatif.

## 🎯 Objectifs de la Refonte

1. **Séparation claire** : User (authentification) vs Enseignant/Étudiant (profils métier)
2. **Flexibilité** : Un user peut théoriquement être enseignant ET étudiant
3. **Richesse académique** : Intégration des parcours, mentions et établissements
4. **Scalabilité** : Structure évolutive pour de futures fonctionnalités

## 🏗️ Nouvelle Architecture

### Modèle User Simplifié

Le modèle `User` devient uniquement un modèle d'**authentification** :
- ✅ Conserve : id, email, name, password_hash, role, google_id, avatar, email_verified
- ✅ Coordonnées générales : telephone, adresse, date_naissance
- ❌ Supprime : numero_etudiant, numero_enseignant, relations M2M

### Nouveaux Modèles

#### 1. Etablissement
Représente une institution d'enseignement (université, école, institut).

**Champs principaux :**
- `code`, `nom`, `nom_court`, `type_etablissement`
- Coordonnées : `adresse`, `ville`, `pays`, `telephone`, `email`, `site_web`
- UI : `logo`, `couleur_primaire`

**Relations :**
- `mentions` (One-to-Many)
- `enseignants` (One-to-Many)
- `etudiants` (One-to-Many)

#### 2. Mention
Représente une spécialisation académique (ex: Informatique, Mathématiques).

**Champs principaux :**
- `code`, `nom`, `description`
- `etablissement_id` (FK → Etablissement)
- UI : `couleur`, `icone`

**Relations :**
- `etablissement` (Many-to-One)
- `parcours` (One-to-Many)
- `enseignants` (Many-to-Many)

#### 3. Parcours
Représente un chemin d'études spécifique (ex: Intelligence Artificielle, Développement Web).

**Champs principaux :**
- `code`, `nom`, `description`
- `mention_id` (FK → Mention)
- `duree_annees`

**Relations :**
- `mention` (Many-to-One)
- `enseignants` (Many-to-Many)

#### 4. Enseignant
Profil métier pour les enseignants/professeurs.

**Champs principaux :**
- `user_id` (FK unique → User)
- `numero_enseignant` (unique)
- `grade`, `specialite`, `departement`, `bureau`
- `etablissement_id` (FK → Etablissement)
- `date_embauche`

**Relations :**
- `user` (One-to-One)
- `etablissement` (Many-to-One)
- `matieres` (Many-to-Many via enseignant_matieres)
- `niveaux` (Many-to-Many via enseignant_niveaux)
- `parcours` (Many-to-Many via enseignant_parcours)
- `mentions` (Many-to-Many via enseignant_mentions)

#### 5. Etudiant
Profil métier pour les étudiants.

**Champs principaux :**
- `user_id` (FK unique → User)
- `numero_etudiant` (unique)
- `annee_admission`
- `etablissement_id` (FK → Etablissement)
- `mention_id` (FK → Mention) - UNE seule mention active
- `parcours_id` (FK → Parcours) - UN seul parcours actif
- `niveau_id` (FK → Niveau) - UN seul niveau actif

**Relations :**
- `user` (One-to-One)
- `etablissement` (Many-to-One)
- `mention` (Many-to-One)
- `parcours` (Many-to-One)
- `niveau` (Many-to-One)
- `matieres` (Many-to-Many via etudiant_matieres_v2)
- `classes` (Many-to-Many via etudiant_classes_v2)

## 📊 Diagramme ERD

```
USER (auth)
  ↓ 1:1
  ├── ENSEIGNANT
  │     ├── → ETABLISSEMENT
  │     └── ←→ MATIERES, NIVEAUX, PARCOURS, MENTIONS (M2M)
  │
  └── ETUDIANT
        ├── → ETABLISSEMENT
        ├── → MENTION (1:1)
        ├── → PARCOURS (1:1)
        ├── → NIVEAU (1:1)
        └── ←→ MATIERES, CLASSES (M2M)

ETABLISSEMENT
  ├── → MENTIONS (1:N)
  ├── → ENSEIGNANTS (1:N)
  └── → ETUDIANTS (1:N)

MENTION
  ├── → ETABLISSEMENT (N:1)
  └── → PARCOURS (1:N)
```

## 🚀 Implémentation Réalisée

### Backend (Python/Flask)

#### ✅ Phase 1 : Modèles de Données
- **5 nouveaux modèles SQLAlchemy** créés :
  - `backend/app/models/etablissement.py`
  - `backend/app/models/mention.py`
  - `backend/app/models/parcours.py`
  - `backend/app/models/enseignant.py`
  - `backend/app/models/etudiant.py`
- **6 tables d'association** ajoutées dans `backend/app/models/associations.py` :
  - `enseignant_matieres`, `enseignant_niveaux`, `enseignant_parcours`, `enseignant_mentions`
  - `etudiant_matieres_v2`, `etudiant_classes_v2`
- **Modèle User simplifié** dans `backend/app/models/user.py`

#### ✅ Phase 2 : Repositories
- **5 repositories** créés avec méthodes CRUD et recherche :
  - `backend/app/repositories/etablissement_repository.py`
  - `backend/app/repositories/mention_repository.py`
  - `backend/app/repositories/parcours_repository.py`
  - `backend/app/repositories/enseignant_repository.py`
  - `backend/app/repositories/etudiant_repository.py`

#### ✅ Phase 3 : Services
- **5 services** créés avec logique métier et validations :
  - `backend/app/services/etablissement_service.py`
  - `backend/app/services/mention_service.py`
  - `backend/app/services/parcours_service.py`
  - `backend/app/services/enseignant_service.py`
  - `backend/app/services/etudiant_service.py`

#### ✅ Phase 4 : API Routes (Flask-RESTX)
- **5 fichiers API** créés avec documentation Swagger complète :
  - `backend/app/api/etablissement.py`
  - `backend/app/api/mention.py`
  - `backend/app/api/parcours.py`
  - `backend/app/api/enseignant.py`
  - `backend/app/api/etudiant.py`
- **Enregistrement des namespaces** dans `backend/app/api/docs.py`

#### ✅ Phase 5 : Migration de Base de Données
- **Migration Alembic** : `backend/migrations/versions/007_refonte_enseignant_etudiant.py`
- **Script de migration des données** : `backend/scripts/migrate_user_to_enseignant_etudiant.py`

### Frontend (TypeScript/Next.js)

#### ✅ Phase 6 : Types TypeScript
- **5 fichiers de types** créés :
  - `frontend/src/shared/types/etablissement.types.ts`
  - `frontend/src/shared/types/mention.types.ts`
  - `frontend/src/shared/types/parcours.types.ts`
  - `frontend/src/shared/types/enseignant.types.ts`
  - `frontend/src/shared/types/etudiant.types.ts`

#### ✅ Phase 7 : Services API
- **5 services API** créés avec axios :
  - `frontend/src/shared/services/api/etablissement.service.ts`
  - `frontend/src/shared/services/api/mention.service.ts`
  - `frontend/src/shared/services/api/parcours.service.ts`
  - `frontend/src/shared/services/api/enseignant.service.ts`
  - `frontend/src/shared/services/api/etudiant.service.ts`

## 📖 Endpoints API Disponibles

### Etablissements (`/api/etablissements`)
- `GET /api/etablissements` - Liste tous les établissements
- `POST /api/etablissements` - Créer (admin)
- `GET /api/etablissements/{id}` - Détails
- `PUT /api/etablissements/{id}` - Modifier (admin)
- `DELETE /api/etablissements/{id}` - Supprimer (admin)
- `GET /api/etablissements/type/{type}` - Par type

### Mentions (`/api/mentions`)
- `GET /api/mentions` - Liste toutes les mentions
- `POST /api/mentions` - Créer (admin)
- `GET /api/mentions/{id}` - Détails
- `PUT /api/mentions/{id}` - Modifier (admin)
- `DELETE /api/mentions/{id}` - Supprimer (admin)
- `GET /api/mentions/etablissement/{id}` - Par établissement

### Parcours (`/api/parcours`)
- `GET /api/parcours` - Liste tous les parcours
- `POST /api/parcours` - Créer (admin)
- `GET /api/parcours/{id}` - Détails
- `PUT /api/parcours/{id}` - Modifier (admin)
- `DELETE /api/parcours/{id}` - Supprimer (admin)
- `GET /api/parcours/mention/{id}` - Par mention

### Enseignants (`/api/enseignants`)
- `GET /api/enseignants` - Liste (pagination)
- `POST /api/enseignants` - Créer (admin)
- `GET /api/enseignants/me` - Profil connecté
- `GET /api/enseignants/{id}` - Détails
- `PUT /api/enseignants/{id}` - Modifier (admin/self)
- `DELETE /api/enseignants/{id}` - Supprimer (admin)
- `GET /api/enseignants/{id}/matieres` - Matières
- `POST /api/enseignants/{id}/matieres/{matiere_id}` - Assigner matière
- `DELETE /api/enseignants/{id}/matieres/{matiere_id}` - Retirer matière
- `GET /api/enseignants/{id}/niveaux` - Niveaux
- `POST /api/enseignants/{id}/niveaux/{niveau_id}` - Assigner niveau
- `GET /api/enseignants/{id}/parcours` - Parcours
- `POST /api/enseignants/{id}/parcours/{parcours_id}` - Assigner parcours
- `GET /api/enseignants/{id}/mentions` - Mentions
- `GET /api/enseignants/etablissement/{id}` - Par établissement

### Étudiants (`/api/etudiants`)
- `GET /api/etudiants` - Liste (pagination)
- `POST /api/etudiants` - Créer (admin)
- `GET /api/etudiants/me` - Profil connecté
- `GET /api/etudiants/{id}` - Détails
- `PUT /api/etudiants/{id}` - Modifier (admin/self)
- `DELETE /api/etudiants/{id}` - Supprimer (admin)
- `GET /api/etudiants/{id}/matieres` - Matières
- `POST /api/etudiants/{id}/matieres/{matiere_id}` - Inscrire matière
- `DELETE /api/etudiants/{id}/matieres/{matiere_id}` - Désinscrire
- `GET /api/etudiants/{id}/classes` - Classes
- `POST /api/etudiants/{id}/classes/{classe_id}` - Assigner classe
- `GET /api/etudiants/mention/{id}` - Par mention
- `GET /api/etudiants/parcours/{id}` - Par parcours
- `GET /api/etudiants/niveau/{id}` - Par niveau

## 🔧 Migration des Données

### Étape 1 : Appliquer la migration Alembic

```bash
cd backend
flask db upgrade
```

Cette commande crée toutes les nouvelles tables dans la base de données.

### Étape 2 : Migrer les données existantes

```bash
cd backend
python scripts/migrate_user_to_enseignant_etudiant.py
```

Ce script :
1. Crée un établissement par défaut si aucun n'existe
2. Migre tous les Users avec role=ENSEIGNANT vers Enseignant
3. Migre tous les Users avec role=ETUDIANT vers Etudiant
4. Migre les relations Many-to-Many existantes
5. Valide la cohérence des données

## ✅ Avantages de Cette Architecture

1. **Séparation des responsabilités** : User pour l'auth, Enseignant/Etudiant pour le métier
2. **Flexibilité** : Un user peut avoir plusieurs profils
3. **Richesse** : Modélisation complète du système éducatif
4. **Maintenabilité** : Code mieux organisé et évolutif
5. **Traçabilité** : Historique clair des affectations
6. **Scalabilité** : Facile d'ajouter de nouveaux rôles

## 📝 Notes Importantes

- Les anciennes colonnes `numero_etudiant` et `numero_enseignant` de la table `users` sont conservées temporairement pour la migration
- Les anciennes tables d'association (`professeur_matieres`, `etudiant_niveaux`, etc.) restent en place pour la compatibilité
- La migration est réversible via `flask db downgrade`

## 🔄 Prochaines Étapes (Non Implémentées)

Les éléments suivants nécessiteraient plus de développement :
- ⏳ Pages d'administration frontend pour gérer les nouveaux modèles
- ⏳ Mise à jour des profils utilisateurs enseignant/étudiant
- ⏳ Tests unitaires et d'intégration complets
- ⏳ Suppression des anciennes colonnes/tables après validation

## 📞 Support

Pour toute question ou problème concernant la migration, consultez les logs du script de migration ou contactez l'équipe de développement.

---

**Date de création** : 2025-01-01  
**Version** : 1.0  
**Auteur** : AI-KO Development Team




