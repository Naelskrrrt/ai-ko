# Guide de Démarrage Rapide - Espace Administration

## 🚀 Démarrage en 3 Étapes

### 1️⃣ Backend

```bash
# Aller dans le dossier backend
cd backend

# Appliquer les migrations (crée les tables qcms et questions)
flask db upgrade

# Lancer le serveur backend
python run.py
```

Le backend sera accessible sur **http://localhost:5000**

### 2️⃣ Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les nouvelles dépendances (@radix-ui/react-switch)
npm install
# ou si vous utilisez pnpm
pnpm install

# Lancer le dev server
npm run dev
# ou
pnpm dev
```

Le frontend sera accessible sur **http://localhost:3000**

### 3️⃣ Connexion Admin

1. Ouvrez votre navigateur: **http://localhost:3000**
2. Connectez-vous avec un compte **admin**
3. Naviguez vers **http://localhost:3000/admin**

## 📍 Routes Disponibles

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard avec métriques et statistiques |
| `/admin/users` | Liste de tous les utilisateurs |
| `/admin/users/new` | Créer un nouvel utilisateur |
| `/admin/users/{id}` | Éditer un utilisateur |
| `/admin/qcm` | Liste de tous les QCM |
| `/admin/qcm/new` | Créer un nouveau QCM |
| `/admin/qcm/{id}` | Éditer un QCM |
| `/admin/questions` | Liste de toutes les questions |
| `/admin/statistics` | Statistiques détaillées |

## 🔑 Créer un Compte Admin (si nécessaire)

Si vous n'avez pas encore de compte admin, vous pouvez:

### Option 1: Via l'interface admin
1. Créez un compte normal via `/register`
2. Connectez-vous avec un compte admin existant
3. Allez dans `/admin/users`
4. Trouvez le compte créé et changez son rôle en "admin"

### Option 2: Via la base de données
```sql
-- Connectez-vous à PostgreSQL
psql -U smart_user -d systeme_intelligent

-- Changer le rôle d'un utilisateur
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```

### Option 3: Via Python shell
```bash
cd backend
python

>>> from app import create_app, db
>>> from app.models.user import User, UserRole
>>> app = create_app()
>>> with app.app_context():
...     user = User.query.filter_by(email='votre@email.com').first()
...     if user:
...         user.role = UserRole.ADMIN
...         db.session.commit()
...         print(f"User {user.email} is now admin")
```

## 📊 Tester les Fonctionnalités

### Dashboard
- Visitez `/admin`
- Vous verrez:
  - 4 cards avec métriques (Total Users, Total QCM, Total Questions, Actifs)
  - Répartition des utilisateurs par rôle
  - Répartition des QCM par statut
  - Liste des derniers utilisateurs inscrits
  - Liste des derniers QCM créés

### Gestion Utilisateurs
- Visitez `/admin/users`
- Testez:
  - Recherche par nom/email
  - Filtrage par rôle (admin/enseignant/etudiant)
  - Filtrage par statut (actif/inactif)
  - Éditer un utilisateur
  - Changer le rôle d'un utilisateur
  - Activer/désactiver un utilisateur
  - Créer un nouvel utilisateur (`/admin/users/new`)

### Gestion QCM
- Visitez `/admin/qcm`
- Testez:
  - Recherche par titre
  - Filtrage par statut (brouillon/publié/archivé)
  - Filtrage par matière
  - Créer un nouveau QCM (`/admin/qcm/new`)
  - Éditer un QCM existant
  - Supprimer un QCM (supprime aussi ses questions - cascade)

### Gestion Questions
- Visitez `/admin/questions`
- Testez:
  - Recherche par énoncé
  - Filtrage par type (qcm/vrai_faux/texte_libre)
  - Voir les détails des questions
  - Supprimer une question

### Statistiques
- Visitez `/admin/statistics`
- Vous verrez:
  - Métriques principales avec pourcentages
  - Répartition détaillée avec barres de progression
  - Métriques calculées (Questions/QCM, Taux actifs)
  - Indicateurs de santé du système

## 🧪 Tester les Validations

### Utilisateur
- Essayez de créer un utilisateur avec:
  - Email invalide → Erreur
  - Nom < 2 caractères → Erreur
  - Mot de passe < 8 caractères → Erreur
  - Email déjà utilisé → Erreur

### QCM
- Essayez de créer un QCM avec:
  - Titre < 3 caractères → Erreur
  - Titre > 255 caractères → Erreur
  - Durée < 1 ou > 999 minutes → Erreur

### Permissions
- Essayez de:
  - Supprimer votre propre compte → Erreur
  - Changer votre propre rôle → Erreur
  - Modifier/supprimer un QCM d'un autre utilisateur sans être admin → Erreur

## 🔍 Vérifier les API

Toutes les routes API sont accessibles via `/api/admin/*`:

```bash
# Obtenir les statistiques (nécessite authentification admin)
curl -X GET http://localhost:5000/api/admin/statistics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Obtenir la liste des utilisateurs
curl -X GET "http://localhost:5000/api/admin/users?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Obtenir la liste des QCM
curl -X GET "http://localhost:5000/api/admin/qcm?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Obtenir la liste des questions
curl -X GET "http://localhost:5000/api/admin/questions?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Debugging

### Backend

```bash
# Vérifier les logs du serveur backend
# Les erreurs apparaîtront dans le terminal où vous avez lancé python run.py

# Vérifier les migrations
flask db current
flask db history

# Vérifier les tables créées
psql -U smart_user -d systeme_intelligent
\dt  # Liste les tables
\d qcms  # Détails table qcms
\d questions  # Détails table questions
```

### Frontend

```bash
# Vérifier les logs du dev server
# Les erreurs apparaîtront dans le terminal où vous avez lancé npm run dev

# Vérifier la console du navigateur
# F12 → Console (pour voir les erreurs JavaScript/API)

# Vérifier Network
# F12 → Network (pour voir les requêtes API et leurs réponses)
```

## 📦 Structure Base de Données

Après `flask db upgrade`, vous aurez ces nouvelles tables:

```
qcms
├── id (UUID)
├── titre (VARCHAR 255)
├── description (TEXT)
├── duree (INTEGER)
├── matiere (VARCHAR 100)
├── status (VARCHAR 20)
├── createur_id (VARCHAR 36) → FK users.id
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

questions
├── id (UUID)
├── enonce (TEXT)
├── type_question (VARCHAR 20)
├── options (TEXT - JSON)
├── reponse_correcte (TEXT)
├── points (INTEGER)
├── explication (TEXT)
├── qcm_id (VARCHAR 36) → FK qcms.id (CASCADE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## ⚠️ Problèmes Courants

### 1. Erreur "Table doesn't exist"
```bash
# Solution: Appliquer les migrations
cd backend
flask db upgrade
```

### 2. Erreur "Module not found: @radix-ui/react-switch"
```bash
# Solution: Installer les dépendances
cd frontend
npm install
```

### 3. Erreur 403 Forbidden sur routes admin
**Cause:** Vous n'êtes pas connecté avec un compte admin

**Solution:**
1. Créez un compte admin (voir section "Créer un Compte Admin")
2. Reconnectez-vous
3. Vérifiez que le token contient le bon rôle

### 4. Page blanche sur /admin
**Solution:**
1. Ouvrez la console (F12)
2. Vérifiez s'il y a des erreurs JavaScript
3. Vérifiez que le backend est bien lancé
4. Vérifiez que vous êtes authentifié

## ✅ Checklist de Vérification

- [ ] Backend lancé sur port 5000
- [ ] Frontend lancé sur port 3000
- [ ] Migrations appliquées (`flask db upgrade`)
- [ ] Dépendances frontend installées (`npm install`)
- [ ] Compte admin créé et connecté
- [ ] Dashboard admin accessible (`/admin`)
- [ ] Toutes les pages admin accessibles
- [ ] Statistiques affichées correctement
- [ ] Création/édition/suppression fonctionnent

## 🎉 Succès!

Si tout fonctionne, vous devriez voir:

1. **Dashboard** avec 4 métriques + graphiques
2. **Gestion utilisateurs** complète avec filtres
3. **Gestion QCM** avec statuts et matières
4. **Gestion questions** avec types
5. **Statistiques détaillées** avec indicateurs

Félicitations! L'espace administration est maintenant pleinement opérationnel! 🚀
