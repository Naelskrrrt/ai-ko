# Dépannage - Accès via ngrok

## Problème : Impossible d'accéder à une URL ngrok depuis internet

### 1. Page d'avertissement ngrok (Plan gratuit)

**Symptôme** : Vous voyez une page d'avertissement ngrok au lieu de votre application.

**Solution** : C'est normal avec le plan gratuit. Cliquez sur le bouton "Visit Site" ou "Continue" pour accéder à votre application.

### 2. Routes protégées nécessitent une authentification

**Symptôme** : Vous êtes redirigé vers `/login` ou voyez un message "Vérification des permissions...".

**Cause** : Les routes `/admin/*` nécessitent :
- Être connecté (avoir un token d'authentification)
- Avoir le rôle `admin`

**Solutions** :

#### Option A : Se connecter d'abord

1. Accédez à la page de login via ngrok :
   ```
   https://mousey-vowelly-cleopatra.ngrok-free.dev/login
   ```

2. Connectez-vous avec un compte admin

3. Ensuite, accédez à `/admin/users`

#### Option B : Vérifier les cookies

Les cookies d'authentification doivent être partagés entre les pages. Vérifiez :

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Application" > "Cookies"
3. Vérifiez qu'un cookie `auth_token` existe

### 3. Vérifier que ngrok est toujours actif

**Symptôme** : Erreur de connexion ou timeout.

**Vérification** :
```bash
# Vérifier que ngrok tourne toujours
# Le terminal où vous avez lancé ngrok doit être ouvert
```

**Solution** : Si ngrok s'est arrêté, relancez-le :
```bash
cd frontend
pnpm run ngrok:frontend
# Ou
.\start-ngrok-frontend.ps1
```

**Note** : Les URLs ngrok gratuites changent à chaque redémarrage. Vous devrez mettre à jour vos configurations.

### 4. Vérifier que le frontend est démarré

**Symptôme** : Page blanche ou erreur 502.

**Vérification** :
```bash
# Vérifier que le frontend tourne sur localhost:3000
curl http://localhost:3000
```

**Solution** : Si le frontend n'est pas démarré :
```bash
cd frontend
pnpm run dev
```

### 5. Problème de CORS

**Symptôme** : Erreurs CORS dans la console du navigateur.

**Solution** : Vérifiez que l'URL ngrok est dans `CORS_ORIGINS` du backend :

```env
# Dans .env à la racine
CORS_ORIGINS=http://localhost:3000,https://mousey-vowelly-cleopatra.ngrok-free.dev
```

Puis redémarrez le backend.

## Workflow recommandé pour accéder à /admin/users

1. **Démarrer le frontend** :
   ```bash
   cd frontend
   pnpm run dev
   ```

2. **Démarrer ngrok** (dans un autre terminal) :
   ```bash
   cd frontend
   pnpm run ngrok:frontend
   # Notez l'URL ngrok générée
   ```

3. **Accéder à la page de login** :
   ```
   https://votre-url-ngrok.ngrok-free.app/login
   ```

4. **Accepter l'avertissement ngrok** (si présent)

5. **Se connecter** avec un compte admin

6. **Accéder à /admin/users** :
   ```
   https://votre-url-ngrok.ngrok-free.app/admin/users
   ```

## Vérifications rapides

```bash
# 1. Vérifier que le frontend répond
curl http://localhost:3000

# 2. Vérifier que ngrok répond
curl https://mousey-vowelly-cleopatra.ngrok-free.dev/

# 3. Vérifier les logs du frontend
# Regardez le terminal où tourne `pnpm run dev`

# 4. Vérifier les logs ngrok
# Regardez le terminal où tourne ngrok
```

## Notes importantes

- **URLs ngrok gratuites** : Elles changent à chaque redémarrage de ngrok
- **Authentification** : Les routes admin nécessitent toujours une authentification, même via ngrok
- **Cookies** : Les cookies doivent être partagés entre toutes les pages du même domaine ngrok
- **HTTPS** : Ngrok utilise HTTPS, ce qui est bon pour la sécurité




