# Démarrage Rapide - Frontend Admin

## Installation en 3 étapes

### 1. Installer les dépendances

```powershell
# Installer les dépendances frontend
cd frontend
pnpm install
cd ..

# Installer les dépendances backend (si pas déjà fait)
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# ou source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cd ..
```

### 2. Créer les utilisateurs de test

```powershell
cd backend
.\venv\Scripts\activate  # Windows
# ou source venv/bin/activate  # Linux/Mac

# Créer les utilisateurs de test (admin + profs + étudiants)
python create_test_users.py

cd ..
```

### 3. Démarrer les serveurs

**Option A: Script automatique (Windows)**

```powershell
.\start-admin-dev.ps1
```

**Option B: Manuel (2 terminaux)**

Terminal 1 - Backend:
```powershell
cd backend
.\venv\Scripts\activate  # Windows
# ou source venv/bin/activate  # Linux/Mac
python run.py
```

Terminal 2 - Frontend:
```powershell
cd frontend
pnpm dev
```

## Accès

- **Frontend:** http://localhost:3000
- **Admin:** http://localhost:3000/admin
- **Backend API:** http://localhost:5000

## Comptes de test

### Administrateur
- **Email:** admin@test.com
- **Mot de passe:** admin123

### Enseignants
- **Email:** prof1@test.com | **Mot de passe:** prof123
- **Email:** prof2@test.com | **Mot de passe:** prof123

### Étudiants
- **Email:** etudiant1@test.com | **Mot de passe:** etudiant123
- **Email:** etudiant2@test.com | **Mot de passe:** etudiant123
- **Email:** etudiant3@test.com | **Mot de passe:** etudiant123

## Test rapide de l'interface admin

1. **Connexion**
   - Aller sur http://localhost:3000/login
   - Se connecter avec `admin@test.com` / `admin123`
   - Vous serez redirigé vers `/admin`

2. **Dashboard Admin**
   - Vous voyez les statistiques globales
   - Cliquer sur "Gérer les utilisateurs"

3. **Gestion des utilisateurs**
   - Voir la liste des utilisateurs (6 au total)
   - Tester la recherche (taper "Marie")
   - Tester les filtres (Rôle: Étudiant)
   - Tester le tri (cliquer sur "Nom")
   - Tester la pagination
   - Créer un nouvel utilisateur
   - Éditer un utilisateur existant
   - Changer le rôle d'un utilisateur
   - Activer/Désactiver un utilisateur

## Fonctionnalités disponibles

### ✅ Authentification
- Login avec redirection par rôle
- Logout
- Protection des routes admin
- Dropdown utilisateur dans le header

### ✅ Layout Global
- Sidebar adaptative par rôle
- Header avec dropdown utilisateur
- Navigation fluide

### ✅ Gestion Utilisateurs (CRUD complet)
- Liste avec pagination (10, 25, 50, 100 par page)
- Recherche par nom ou email
- Filtres: Rôle, Status
- Tri: Nom, Email, Rôle, Date création
- Actions: Créer, Éditer, Supprimer, Changer rôle, Activer/Désactiver
- Modal de création/édition avec validation
- Toasts pour les notifications

### ✅ Dashboard Admin
- Statistiques globales
- Utilisateurs par rôle
- QCM par statut
- Derniers utilisateurs inscrits
- Derniers QCM créés

## Dépannage

### Erreur "Module not found: react-hook-form"
```powershell
cd frontend
pnpm install react-hook-form @hookform/resolvers zod
```

### Erreur "Cannot connect to backend"
- Vérifier que le backend est démarré sur http://localhost:5000
- Vérifier le fichier `frontend/.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:5000
  ```

### Erreur "No user found" lors du login
- Exécuter `python backend/create_test_users.py`

### Erreur 403 "Access denied" sur /admin
- Vérifier que l'utilisateur connecté a le rôle "admin"
- Se déconnecter et reconnecter avec admin@test.com

## Prochaines étapes

1. Tester toutes les fonctionnalités listées ci-dessus
2. Vérifier que les filtres fonctionnent correctement
3. Vérifier que le tri fonctionne sur toutes les colonnes
4. Vérifier que la pagination fonctionne
5. Créer, éditer et supprimer des utilisateurs
6. Vérifier que les toasts s'affichent correctement

## Structure du code

```
frontend/src/
├── app/
│   ├── (auth)/login/page.tsx          # Page de connexion
│   └── admin/
│       ├── layout.tsx                  # Layout admin (protection)
│       ├── page.tsx                    # Dashboard admin
│       └── users/page.tsx              # Gestion utilisateurs
├── components/layout/
│   ├── header.tsx                      # Header avec dropdown
│   ├── sidebar.tsx                     # Sidebar adaptative
│   └── dashboard-layout.tsx            # Layout dashboard
├── core/
│   ├── config/site.ts                  # Configuration navigation
│   └── providers/AuthProvider.tsx      # Contexte auth
└── shared/
    ├── hooks/useUsers.ts               # Hook SWR
    ├── services/api/admin.service.ts   # API service
    └── types/admin.types.ts            # Types TypeScript
```

## Documentation complète

Voir `FRONTEND_ADMIN_IMPLEMENTATION.md` pour la documentation complète avec:
- Liste complète des changements
- Tests détaillés
- Notes techniques
- Prochaines étapes

## Support

En cas de problème, vérifier:
1. Que toutes les dépendances sont installées
2. Que le backend est démarré
3. Que les utilisateurs de test sont créés
4. Les logs du navigateur (F12 → Console)
5. Les logs du terminal backend


