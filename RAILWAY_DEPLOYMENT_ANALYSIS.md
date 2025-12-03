# Railway pour Backend AI-KO - Analyse Complète

## 📊 Analyse des Besoins du Backend

### Dépendances Critiques
```python
torch>=2.6.0              # ~800 MB
transformers==4.47.1      # ~400 MB
flask-socketio==5.3.5
celery==5.4.0
redis==5.2.1
psycopg2-binary==2.9.10
```

**Taille totale estimée :** ~1.5-2 GB avec toutes les dépendances

### Ressources Requises
- **RAM :** 512 MB minimum, 1-2 GB recommandé (pour PyTorch/Transformers)
- **CPU :** Modéré (génération IA peut être intensive)
- **Stockage :** 2-3 GB pour code + dépendances
- **Base de données :** PostgreSQL nécessaire

---

## 🚂 Railway - Offre Gratuite vs Payante

### 🆓 Plan Gratuit (Trial)

**Crédits :**
- 🎁 **$5 de crédits gratuits** (one-time)
- ⏱️ **500 heures d'exécution** par mois (~$10 valeur)
- 💳 **Carte de crédit requise** (pour vérification)

**Limites :**
- ⚠️ **512 MB RAM** par service (peut être insuffisant pour PyTorch)
- ✅ 1 vCPU partagé
- ✅ 1 GB de stockage éphémère
- ✅ Base de données PostgreSQL incluse (500 MB)
- ✅ Variables d'environnement illimitées
- ✅ Déploiements illimités
- ✅ HTTPS automatique
- ⏰ **Pas de sleep/hibernation** (contrairement à Heroku)

**Coût estimé mensuel :**
```
Ressources utilisées avec votre backend :
- RAM : 512 MB minimum → ~$3-5/mois
- CPU : Usage modéré → ~$2-3/mois
- PostgreSQL : 500 MB → Gratuit
- Bande passante : Normale → ~$1/mois

Total estimé : $6-9/mois (crédits gratuits = 0.5-1 mois)
```

### 💎 Plan Developer ($5/mois)

- ✅ **$5 de crédits inclus par mois**
- ✅ Meilleure priorité CPU
- ✅ Support prioritaire
- ✅ Métriques avancées

### 💼 Plan Hobby ($10/mois)

- ✅ **$10 de crédits inclus par mois**
- ✅ 8 GB RAM par service
- ✅ 2 vCPUs
- ✅ PostgreSQL : 1 GB
- ✅ Bande passante : 100 GB/mois

---

## ⚠️ Problèmes Potentiels avec Railway

### 1. **RAM Insuffisante (512 MB)**

PyTorch + Transformers peuvent nécessiter **1-2 GB RAM** au démarrage.

**Solutions :**
- 🔧 Utiliser l'API Hugging Face Inference (déjà configuré) ✅
- 🔧 Ne PAS charger les modèles localement
- 🔧 Supprimer `torch` des requirements si possible
- ❌ Le plan gratuit risque de crasher au démarrage

### 2. **Temps de Build Long**

Installation de PyTorch/Transformers = **5-15 minutes** de build.

**Solutions :**
- ✅ Railway met en cache les dépendances
- ✅ Utiliser des images Docker pré-construites

### 3. **Coût après Crédits Gratuits**

Après les $5 initiaux, vous paierez **$6-9/mois** pour usage continu.

---

## ✅ Alternatives Gratuites

### 🐳 **Render.com** (Meilleur choix gratuit)

**Plan Free :**
- ✅ **512 MB RAM** (similaire)
- ✅ **0.1 vCPU**
- ✅ PostgreSQL gratuit (1 GB, 90 jours)
- ⏰ **Sleep après 15 min d'inactivité** (réveil = 30-60s)
- ✅ **Vraiment gratuit** (pas de carte de crédit)
- ✅ HTTPS automatique
- ✅ Logs illimités

**Verdict :** Meilleur pour MVP/tests, mais avec sleep

### ☁️ **Fly.io**

**Plan Free :**
- ✅ **256 MB RAM** par VM (3 VMs max)
- ✅ 3 GB de stockage persistant
- ✅ PostgreSQL gratuit (1 GB)
- ✅ **Pas de sleep**
- ❌ Carte de crédit requise

**Verdict :** Très bon, mais RAM limitée

### 🚀 **Koyeb**

**Plan Free :**
- ✅ **512 MB RAM**
- ✅ 2 GB de stockage
- ⏰ **Sleep après 1h d'inactivité**
- ✅ PostgreSQL externe (Neon, Supabase)
- ❌ Build time limité

### 🌊 **Vercel** (Option API Routes)

**Limitations :**
- ❌ Pas de serveur persistent (serverless seulement)
- ❌ Max 10s d'exécution par requête
- ❌ Pas de WebSocket/Celery
- ❌ **Ne convient PAS** pour votre backend Flask

---

## 🎯 Recommandations selon Budget

### **Scénario 1 : Budget $0 (Vraiment gratuit)**

**✅ Solution : Render.com Free Tier**

**Avantages :**
- Vraiment gratuit, pas de carte
- PostgreSQL inclus
- Facile à configurer

**Inconvénients :**
- Sleep après 15 min (premier appel = 30-60s)
- 512 MB RAM (limite pour PyTorch)

**Config recommandée :**
```bash
# Supprimer torch/transformers des requirements
# Utiliser UNIQUEMENT l'API Hugging Face Inference
# requirements-prod.txt (sans ML)
Flask==3.1.0
Flask-CORS==5.0.0
Flask-SQLAlchemy==3.1.1
psycopg2-binary==2.9.10
gunicorn==21.2.0
```

### **Scénario 2 : Budget ~$5-10/mois**

**✅ Solution : Railway Hobby Plan ($10/mois)**

**Avantages :**
- Pas de sleep
- 8 GB RAM (suffisant pour PyTorch)
- PostgreSQL 1 GB
- Très facile à utiliser
- Bons logs et monitoring

**Inconvénients :**
- Coût mensuel

### **Scénario 3 : Budget $0 temporairement**

**✅ Solution : Railway Trial + Render après**

1. **Mois 1 :** Railway avec crédits gratuits ($5)
2. **Mois 2+ :** Basculer sur Render Free (avec sleep)

### **Scénario 4 : Production Sérieuse**

**✅ Solution : Railway Hobby ou VPS**

**Railway Hobby ($10/mois) :**
- Simple, managed
- Bon monitoring
- Scalable facilement

**VPS (Contabo/Hetzner $4-6/mois) :**
- Plus de contrôle
- Meilleure performance
- Nécessite gestion système

---

## 🚀 Déploiement sur Railway - Guide Complet

### **Étape 1 : Préparation du Backend**

#### Créer `Procfile` (optionnel mais recommandé)

```bash
# backend/Procfile
web: gunicorn --bind 0.0.0.0:$PORT run:app --workers 2 --timeout 120
```

#### Créer `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn --bind 0.0.0.0:$PORT run:app --workers 2 --timeout 120",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

#### Ajouter gunicorn aux requirements

```bash
# backend/requirements-prod.txt (version optimisée)
Flask==3.1.0
Flask-CORS==5.0.0
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.7
Flask-JWT-Extended==4.7.1
psycopg2-binary==2.9.10
SQLAlchemy==2.0.36
gunicorn==21.2.0

# Pas besoin de torch/transformers si on utilise API Hugging Face
requests==2.32.3
PyPDF2==3.0.1
python-docx==1.1.2
marshmallow==3.23.2
python-dotenv==1.0.1
bcrypt==4.2.1
```

### **Étape 2 : Créer le Projet Railway**

1. Allez sur https://railway.app/
2. "Sign up" avec GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Sélectionnez votre repo `ai-ko`
5. Choisissez le dossier `backend/` comme root directory

### **Étape 3 : Configurer PostgreSQL**

1. Dans votre projet Railway, cliquez "New"
2. Sélectionnez "Database" → "PostgreSQL"
3. Railway créera automatiquement la variable `DATABASE_URL`

### **Étape 4 : Configurer les Variables d'Environnement**

Dans Railway Settings → Variables :

```bash
# Database (auto-configurée)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Flask
SECRET_KEY=<générer-secret-64-caractères>
JWT_SECRET_KEY=<générer-secret-64-caractères>
FLASK_ENV=production

# CORS
CORS_ORIGINS=http://localhost:3000,https://frontend-xxx.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=<votre-client-id>
GOOGLE_CLIENT_SECRET=<votre-client-secret>
GOOGLE_REDIRECT_URI=https://frontend-xxx.vercel.app/api/auth/callback/google

# Hugging Face
HF_API_TOKEN=<votre-token-hf>
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Port (Railway l'injecte automatiquement)
PORT=${{PORT}}
```

### **Étape 5 : Déployer**

Railway déploie automatiquement après chaque push Git.

**URL générée :** `https://votre-app.up.railway.app`

### **Étape 6 : Mettre à Jour Vercel**

Dans Vercel, mettez à jour :

```bash
BACKEND_INTERNAL_URL=https://votre-app.up.railway.app
NEXT_PUBLIC_API_URL=https://votre-app.up.railway.app
```

---

## 📊 Comparaison Finale

| Critère | Railway Free | Railway Hobby | Render Free | VPS |
|---------|--------------|---------------|-------------|-----|
| **Prix** | $5 crédits (1 mois) | $10/mois | Gratuit | $4-6/mois |
| **RAM** | 512 MB ⚠️ | 8 GB ✅ | 512 MB ⚠️ | 2-4 GB ✅ |
| **Sleep** | Non ✅ | Non ✅ | Oui (15 min) ⚠️ | Non ✅ |
| **PostgreSQL** | Oui ✅ | Oui ✅ | Oui (90j) ⚠️ | Manuel |
| **Setup** | Facile ✅ | Facile ✅ | Facile ✅ | Complexe ❌ |
| **Scalable** | Oui ✅ | Oui ✅ | Limité | Oui ✅ |

---

## 🎯 Ma Recommandation

### Pour MVP/Test (gratuit)
**Render.com Free** + **Supprimer PyTorch des requirements**
- Utiliser uniquement l'API Hugging Face (déjà configuré)
- Accepter le cold start de 30-60s

### Pour Production (payant)
**Railway Hobby ($10/mois)**
- Pas de sleep
- RAM suffisante
- Setup très simple
- Bon monitoring

### Alternative Budget
**VPS Contabo/Hetzner ($4-6/mois)**
- Plus de puissance
- Pas de limitations
- Nécessite gestion serveur

---

**Voulez-vous que je crée les fichiers de configuration Railway (`Procfile`, `railway.json`, `requirements-prod.txt`) pour votre backend ?** 🚂



