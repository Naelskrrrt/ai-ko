# 🚂 Déploiement Backend AI-KO sur Railway

## 📋 Prérequis

1. Un compte Railway : https://railway.app
2. Le repo GitHub connecté : `https://github.com/Naelskrrrt/ai-ko.git`

## 💰 Tarification Railway

| Plan | Prix | Ressources | Recommandation |
|------|------|------------|----------------|
| **Trial** | Gratuit | $5 de crédits (une seule fois) | Pour tester |
| **Hobby** | $5/mois | $5 de crédits inclus | ✅ Recommandé |
| **Pro** | $20/mois | Usage illimité | Pour production |

> ⚠️ **Note importante** : Le backend utilise PyTorch/Transformers qui consomment beaucoup de RAM. Le plan Hobby devrait suffire pour un usage modéré.

## 🚀 Déploiement Étape par Étape

### Étape 1 : Créer un projet Railway

1. Allez sur https://railway.app/new
2. Cliquez sur **"Deploy from GitHub repo"**
3. Connectez votre compte GitHub si ce n'est pas fait
4. Sélectionnez le repo `Naelskrrrt/ai-ko`

### Étape 2 : Configurer le service

1. Dans les paramètres du service, définissez :
   - **Root Directory** : `backend`
   - **Watch Paths** : `backend/**`

2. Railway détectera automatiquement Python et utilisera `nixpacks.toml`

### Étape 3 : Ajouter PostgreSQL

1. Dans votre projet, cliquez sur **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway créera automatiquement la variable `DATABASE_URL`

### Étape 4 : Configurer les Variables d'Environnement

Ajoutez ces variables dans **Settings** → **Variables** :

```env
# Flask
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire

# Base de données (automatique si PostgreSQL ajouté)
# DATABASE_URL est auto-générée par Railway

# Hugging Face (pour l'IA)
HF_TOKEN=hf_votre_token_huggingface
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# JWT
JWT_SECRET_KEY=votre-jwt-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GOOGLE_REDIRECT_URI=https://votre-frontend.vercel.app/api/auth/callback/google

# CORS - Frontend Vercel
CORS_ORIGINS=https://votre-frontend.vercel.app,http://localhost:3000

# Redis (optionnel - pour Celery)
# REDIS_URL=redis://...
```

### Étape 5 : Générer un domaine public

1. Allez dans **Settings** → **Networking**
2. Cliquez sur **"Generate Domain"**
3. Vous obtiendrez une URL comme : `https://ai-ko-backend-production.up.railway.app`

### Étape 6 : Mettre à jour le Frontend Vercel

Mettez à jour les variables d'environnement sur Vercel :

```env
NEXT_PUBLIC_API_URL=https://ai-ko-backend-production.up.railway.app
BACKEND_INTERNAL_URL=https://ai-ko-backend-production.up.railway.app
```

## 🔧 Configuration des fichiers

Les fichiers suivants ont été créés pour Railway :

### `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["python312", "gcc", "postgresql"]

[phases.install]
cmds = ["pip install -r requirements.txt", "pip install gunicorn"]

[start]
cmd = "gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --preload run:app"

[variables]
PYTHONUNBUFFERED = "1"
FLASK_ENV = "production"
```

### `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --preload run:app",
    "healthcheckPath": "/api/health"
  }
}
```

### `Procfile`
```
web: gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --preload run:app
```

## 📊 Optimisations pour Railway

### Réduire l'utilisation de RAM

Si vous rencontrez des problèmes de mémoire avec PyTorch/Transformers :

1. **Utiliser l'API Hugging Face** au lieu du modèle local (déjà configuré)
2. **Réduire les workers** : `--workers 1` au lieu de 2
3. **Désactiver le preload** si nécessaire

### Modifier la commande de démarrage

Dans Railway Dashboard → Settings → Deploy → Start Command :

```bash
gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 180 run:app
```

## 🔍 Vérification du Déploiement

### Tester l'endpoint health

```bash
curl https://votre-app.up.railway.app/api/health
```

Réponse attendue :
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

### Vérifier les logs

Dans Railway Dashboard → Deployments → Logs

## ⚠️ Limitations du Plan Hobby

- **RAM** : ~512 MB (peut être insuffisant pour PyTorch local)
- **CPU** : Partagé
- **Sleep** : Les apps peuvent dormir après inactivité

### Solution recommandée

Utiliser l'**API Hugging Face Inference** (déjà configurée dans le code) au lieu de charger les modèles localement. Cela réduit drastiquement l'utilisation de RAM.

## 🐛 Dépannage

### Erreur "Out of Memory"

1. Réduire les workers à 1
2. Vérifier que `HF_TOKEN` est configuré (utilise l'API au lieu du modèle local)

### Erreur de connexion à la base de données

1. Vérifier que PostgreSQL est ajouté au projet
2. La variable `DATABASE_URL` doit être auto-générée

### Build échoue

1. Vérifier les logs de build
2. S'assurer que `requirements.txt` est correct
3. Le root directory doit être `backend`

## 📞 Support

- Documentation Railway : https://docs.railway.app
- Discord Railway : https://discord.gg/railway



