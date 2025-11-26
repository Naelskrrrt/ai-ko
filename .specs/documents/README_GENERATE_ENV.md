# Scripts de génération automatique des fichiers .env

Ces scripts permettent de générer automatiquement les fichiers `.env` pour les environnements DEV et PROD, avec support des URLs personnalisées pour serveurs distants ou ngrok.

## 📋 Fichiers générés

Les scripts génèrent deux fichiers :

1. **`.env`** à la racine du projet (backend + configuration globale)
2. **`frontend/.env.local`** (configuration Next.js)

## 🚀 Utilisation

### PowerShell (Windows)

```powershell
# Environnement DEV (développement local)
.\scripts\generate-env.ps1 -Environment DEV

# Environnement PROD avec URL frontend uniquement
.\scripts\generate-env.ps1 -Environment PROD -FrontendUrl "https://example.com"

# Environnement PROD avec URLs frontend et backend séparées
.\scripts\generate-env.ps1 -Environment PROD -FrontendUrl "https://example.com" -BackendUrl "https://api.example.com"

# Environnement PROD avec ngrok
.\scripts\generate-env.ps1 -Environment PROD -FrontendUrl "https://abc123.ngrok-free.app"
```

### Bash (Linux/Mac/WSL)

```bash
# Environnement DEV (développement local)
./scripts/generate-env.sh DEV

# Environnement PROD avec URL frontend uniquement
./scripts/generate-env.sh PROD "https://example.com"

# Environnement PROD avec URLs frontend et backend séparées
./scripts/generate-env.sh PROD "https://example.com" "https://api.example.com"

# Environnement PROD avec ngrok
./scripts/generate-env.sh PROD "https://abc123.ngrok-free.app"
```

## 🔧 Différences DEV vs PROD

### DEV (Développement local)

- **URLs** : `http://localhost:3000` (frontend), `http://localhost:5000` (backend)
- **Flask** : `FLASK_ENV=development`, `FLASK_DEBUG=1`
- **Base de données** : SQLite (`sqlite:///backend/app.db`)
- **Node** : `NODE_ENV=development`
- **CORS** : `http://localhost:3000` uniquement

### PROD (Production/Serveur distant)

- **URLs** : Personnalisables via arguments (ex: `https://example.com` ou ngrok)
- **Flask** : `FLASK_ENV=production`, `FLASK_DEBUG` non défini
- **Base de données** : PostgreSQL par défaut (SQLite si non configuré)
- **Node** : `NODE_ENV=production`
- **CORS** : Inclut les URLs de production

## 🔐 Gestion des secrets

Les scripts génèrent automatiquement les secrets suivants s'ils n'existent pas déjà :

- `SECRET_KEY` (64 caractères)
- `JWT_SECRET_KEY` (64 caractères)
- `NEXTAUTH_SECRET` (64 caractères)
- `BETTER_AUTH_SECRET` (64 caractères)

**Important** : Les secrets existants dans votre `.env` actuel sont préservés. Seuls les nouveaux secrets sont générés.

## 📝 Variables préservées

Les scripts préservent automatiquement les valeurs existantes pour :

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `HF_API_TOKEN`
- Tous les secrets (SECRET_KEY, JWT_SECRET_KEY, etc.)

## 💾 Sauvegarde automatique

Avant de générer les nouveaux fichiers, les scripts créent automatiquement des backups :

- `.env.backup.YYYYMMDD-HHMMSS`
- `frontend/.env.local.backup.YYYYMMDD-HHMMSS`

## ⚙️ Configuration Google OAuth

Après avoir généré les fichiers pour PROD, n'oubliez pas de :

1. Configurer `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans `.env`
2. Ajouter l'URL de redirection dans [Google Cloud Console](https://console.cloud.google.com/) :
   ```
   https://votre-domaine.com/api/auth/callback/google
   ```

## 📦 Structure des templates

Les templates sont situés dans `scripts/env-templates/` :

- `dev.env.template` - Template racine pour DEV
- `prod.env.template` - Template racine pour PROD
- `frontend-dev.env.template` - Template frontend pour DEV
- `frontend-prod.env.template` - Template frontend pour PROD

Les placeholders utilisés dans les templates :

- `{{SECRET_KEY}}` - Clé secrète Flask
- `{{JWT_SECRET_KEY}}` - Clé secrète JWT
- `{{NEXTAUTH_SECRET}}` - Secret NextAuth
- `{{BETTER_AUTH_SECRET}}` - Secret Better Auth
- `{{GOOGLE_CLIENT_ID}}` - ID client Google OAuth
- `{{GOOGLE_CLIENT_SECRET}}` - Secret client Google OAuth
- `{{HF_API_TOKEN}}` - Token Hugging Face
- `{{FRONTEND_URL}}` - URL du frontend
- `{{CORS_ORIGINS}}` - Origines CORS autorisées
- `{{NEXT_PUBLIC_API_URL}}` - URL publique de l'API
- `{{BACKEND_INTERNAL_URL}}` - URL interne du backend

## 🔄 Exemples d'utilisation

### Migration vers un serveur de production

```bash
# Générer les fichiers pour production
./scripts/generate-env.sh PROD "https://mon-domaine.com" "https://api.mon-domaine.com"

# Vérifier les fichiers générés
cat .env
cat frontend/.env.local

# Modifier les valeurs spécifiques si nécessaire
nano .env
```

### Configuration avec ngrok

```powershell
# Démarrer ngrok et noter l'URL
# Exemple: https://abc123.ngrok-free.app

# Générer les fichiers avec l'URL ngrok
.\scripts\generate-env.ps1 -Environment PROD -FrontendUrl "https://abc123.ngrok-free.app"

# Mettre à jour Google OAuth avec la nouvelle URL
# https://abc123.ngrok-free.app/api/auth/callback/google
```

### Retour en développement

```bash
# Revenir à l'environnement de développement
./scripts/generate-env.sh DEV
```

## ⚠️ Notes importantes

1. **Backup automatique** : Les fichiers existants sont toujours sauvegardés avant modification
2. **Préservation des valeurs** : Les valeurs existantes (Google OAuth, secrets, etc.) sont préservées
3. **Redémarrage requis** : Après génération, redémarrez le backend et le frontend pour appliquer les changements
4. **URLs ngrok** : Si vous utilisez ngrok avec le plan gratuit, l'URL change à chaque redémarrage. Régénérez les fichiers .env avec la nouvelle URL.

## 🐛 Dépannage

### Erreur "Template non trouvé"

Vérifiez que les templates existent dans `scripts/env-templates/` :
```bash
ls scripts/env-templates/
```

### Erreur de permissions (Bash)

Rendez le script exécutable :
```bash
chmod +x scripts/generate-env.sh
```

### Secrets non générés

Les secrets sont générés uniquement s'ils n'existent pas déjà. Pour forcer la régénération, supprimez temporairement les valeurs dans `.env` avant de relancer le script.

