# Configuration de l'Authentification AI-KO

## ✅ Ce qui a été implémenté

### Frontend

1. **Dépendances installées avec pnpm** :
   - Better-Auth (authentification moderne)
   - Tailwind CSS + shadcn/ui (composants UI)
   - React Hook Form + Zod (validation de formulaires)
   - Axios (requêtes HTTP)
   - SWR (data fetching)
   - Zustand (state management)

2. **Structure de dossiers créée** :
   ```
   frontend/
   ├── app/
   │   ├── (auth)/
   │   │   ├── login/page.tsx
   │   │   └── register/page.tsx
   │   ├── api/auth/
   │   │   └── callback/google/route.ts
   │   └── dashboard/page.tsx
   ├── features/auth/
   │   ├── components/
   │   │   ├── LoginForm.tsx
   │   │   └── RegisterForm.tsx
   │   ├── hooks/useAuth.ts
   │   └── actions/auth.actions.ts
   ├── shared/
   │   ├── components/ui/ (shadcn/ui)
   │   ├── services/api/auth.service.ts
   │   └── types/auth.types.ts
   └── core/
       ├── lib/auth.ts
       └── providers/AuthProvider.tsx
   ```

3. **Fonctionnalités** :
   - ✅ Inscription avec email/password
   - ✅ Connexion avec email/password
   - ✅ Connexion avec Google OAuth
   - ✅ Protection des routes (middleware)
   - ✅ Gestion des sessions (cookies JWT)
   - ✅ Validation des formulaires (Zod)
   - ✅ Interface utilisateur moderne (Tailwind + shadcn/ui)

### Backend

1. **Modèle User créé** (`backend/app/models/user.py`) :
   - Champs : id, email, name, password_hash
   - OAuth : google_id, avatar, email_verified
   - Méthodes : set_password, check_password, to_dict

2. **Endpoints API** (`backend/app/api/auth.py`) :
   - `POST /api/auth/register` - Inscription
   - `POST /api/auth/login` - Connexion
   - `POST /api/auth/logout` - Déconnexion
   - `GET /api/auth/me` - Profil utilisateur
   - `GET /api/auth/oauth/google` - Redirection Google OAuth
   - `POST /api/auth/oauth/google/callback` - Callback Google OAuth

3. **Sécurité** :
   - Hash des mots de passe avec bcrypt
   - Tokens JWT avec expiration (7 jours)
   - Cookies httpOnly pour les tokens
   - CORS configuré avec credentials

## 🚀 Démarrage

### 1. Configuration des variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Google OAuth (voir GOOGLE_OAUTH_SETUP.md)
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Better-Auth
BETTER_AUTH_SECRET=change_me_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

### 2. Migration de la base de données

```bash
# Créer la table users
docker-compose exec backend flask db upgrade
```

### 3. Démarrer les services

```bash
docker-compose up -d
```

### 4. Accéder à l'application

- **Page d'accueil** : http://localhost:3000
- **Connexion** : http://localhost:3000/login
- **Inscription** : http://localhost:3000/register
- **Dashboard** : http://localhost:3000/dashboard (protégé)

## 📝 Utilisation

### Inscription

1. Aller sur `/register`
2. Remplir le formulaire (nom, email, mot de passe)
3. Ou cliquer sur "Continuer avec Google"

### Connexion

1. Aller sur `/login`
2. Entrer email et mot de passe
3. Ou cliquer sur "Continuer avec Google"

### Google OAuth

Voir le fichier `GOOGLE_OAUTH_SETUP.md` pour la configuration complète.

## 🔒 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Les tokens JWT sont stockés dans des cookies httpOnly
- Les routes protégées nécessitent une authentification
- CORS configuré pour autoriser les credentials
- Validation des données côté client et serveur

## 🐛 Dépannage

### Erreur "Token manquant"

- Vérifiez que les cookies sont activés dans votre navigateur
- Vérifiez que CORS est correctement configuré
- Vérifiez que `withCredentials: true` est défini dans les requêtes axios

### Erreur "Utilisateur non trouvé"

- Vérifiez que la migration a été exécutée : `flask db upgrade`
- Vérifiez les logs du backend : `docker-compose logs backend`

### Google OAuth ne fonctionne pas

- Vérifiez que les credentials Google sont corrects dans `.env`
- Vérifiez que l'URI de redirection correspond dans Google Cloud Console
- Voir `GOOGLE_OAUTH_SETUP.md` pour plus de détails

## 📚 Documentation supplémentaire

- **Configuration Google OAuth** : `GOOGLE_OAUTH_SETUP.md`
- **Architecture** : `INFRASTRUCTURE.md`
- **Guide de démarrage** : `QUICKSTART.md`



