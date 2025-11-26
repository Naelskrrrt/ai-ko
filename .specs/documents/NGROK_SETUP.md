# Configuration NGROK

Ce guide explique comment utiliser ngrok pour exposer votre application sur internet.

## 📦 Installation

### Option 1: Installation via pnpm (recommandé)

```bash
cd frontend
pnpm install
```

ngrok sera installé comme dépendance de développement et accessible via:
- `pnpm run ngrok:frontend` (pour le frontend)
- `pnpm run ngrok:backend` (pour le backend)

### Option 2: Installation globale (Recommandé pour Windows)

**⚠️ Important sur Windows** : Utilisez `npm` et non `pnpm` pour l'installation globale, car pnpm peut installer un binaire Linux incompatible.

```bash
# Installation via npm (recommandé)
npm install -g ngrok

# ⚠️ Évitez pnpm pour l'installation globale sur Windows
# pnpm install -g ngrok  # Peut installer un binaire Linux
```

Après l'installation, configurez votre token :
```bash
ngrok config add-authtoken VOTRE_TOKEN_ICI
```

## 🚀 Utilisation

### Méthode 1: Scripts PowerShell (Windows)

#### Exposer le Frontend (port 3000)
```powershell
.\start-ngrok-frontend.ps1
```

#### Exposer le Backend (port 5000)
```powershell
.\start-ngrok-backend.ps1
```

### Méthode 2: Scripts Bash (Linux/WSL/Mac)

#### Exposer le Frontend (port 3000)
```bash
chmod +x start-ngrok-frontend.sh
./start-ngrok-frontend.sh
```

#### Exposer le Backend (port 5000)
```bash
chmod +x start-ngrok-backend.sh
./start-ngrok-backend.sh
```

### Méthode 3: Via pnpm avec scripts Node.js (depuis le dossier frontend)

**Important**: Configurez d'abord `NGROK_AUTHTOKEN` dans votre `.env` ou `frontend/.env.local`

```bash
cd frontend

# Exposer le frontend
pnpm run ngrok:frontend

# Exposer le backend
pnpm run ngrok:backend
```

Ces scripts utilisent `@ngrok/ngrok` (bibliothèque Node.js) et nécessitent un token d'authentification.

### Méthode 4: Commande directe

```bash
# Frontend
ngrok http 3000

# Backend
ngrok http 5000
```

## 🔑 Configuration avec Token (Recommandé)

Pour utiliser ngrok avec `@ngrok/ngrok`, vous devez configurer un token d'authentification:

1. Créez un compte gratuit sur https://dashboard.ngrok.com
2. Obtenez votre authtoken sur https://dashboard.ngrok.com/get-started/your-authtoken
3. Ajoutez-le dans votre fichier `.env` à la racine ou `frontend/.env.local`:

```env
NGROK_AUTHTOKEN=votre_token_ngrok_ici
```

**Note**: Les scripts Node.js utilisent automatiquement cette variable d'environnement.

### Alternative: Installation globale de ngrok CLI

Si vous préférez utiliser le CLI ngrok traditionnel:

```bash
# Installation globale
npm install -g ngrok

# Configuration du token
ngrok config add-authtoken VOTRE_TOKEN_ICI
```

Ensuite, vous pouvez utiliser directement:
```bash
ngrok http 3000  # pour le frontend
ngrok http 5000  # pour le backend
```

## 📋 URLs générées

Une fois ngrok démarré, vous verrez quelque chose comme:

```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

Cette URL `https://abc123.ngrok-free.app` est accessible depuis n'importe où sur internet.

## ⚠️ Points importants

### Pour le Frontend
1. Assurez-vous que le frontend Next.js est démarré sur le port 3000:
   ```bash
   cd frontend
   pnpm run dev
   ```

2. **Configuration des variables d'environnement** :
   
   Si vous utilisez ngrok pour exposer le backend, vous devez mettre à jour la variable `NEXT_PUBLIC_API_URL` dans votre fichier `.env.local` (frontend) ou `.env` (racine).
   
   **Étapes** :
   
   a. Créez ou modifiez le fichier `frontend/.env.local` :
   ```bash
   cd frontend
   # Créez le fichier .env.local
   echo "NEXT_PUBLIC_API_URL=https://votre-url-ngrok-backend.ngrok-free.app" > .env.local
   ```
   
   Ou créez-le manuellement avec le contenu suivant :
   ```env
   NEXT_PUBLIC_API_URL=https://votre-url-ngrok-backend.ngrok-free.app
   ```
   
   b. Modifiez `NEXT_PUBLIC_API_URL` avec l'URL ngrok de votre backend :
   ```env
   NEXT_PUBLIC_API_URL=https://votre-url-ngrok-backend.ngrok-free.app
   ```
   
   c. Redémarrez le serveur de développement Next.js pour que les changements prennent effet :
   ```bash
   # Arrêtez le serveur (Ctrl+C) et relancez-le
   pnpm run dev
   ```

### Pour le Backend
1. Assurez-vous que le backend Flask est démarré sur le port 5000:
   ```bash
   cd backend
   python run.py
   ```

2. **Configuration CORS** :
   
   Si vous exposez le frontend via ngrok, vous devez configurer CORS pour accepter les requêtes depuis l'URL ngrok du frontend.
   
   Modifiez le fichier `.env` à la racine du projet :
   ```env
   CORS_ORIGINS=http://localhost:3000,https://votre-url-ngrok-frontend.ngrok-free.app
   ```
   
   Ou si vous utilisez un fichier de configuration Flask, ajoutez l'URL ngrok du frontend à la liste des origines autorisées.

## 🔧 Configuration Automatique des Variables d'Environnement

### Script de configuration automatique

Pour faciliter la configuration, des scripts sont disponibles pour mettre à jour automatiquement les variables d'environnement :

#### PowerShell (Windows)
```powershell
# Configuration avec URL backend ngrok uniquement
.\setup-ngrok-env.ps1 -BackendUrl "https://abc123.ngrok-free.app"

# Configuration avec URLs backend et frontend ngrok
.\setup-ngrok-env.ps1 -BackendUrl "https://abc123.ngrok-free.app" -FrontendUrl "https://xyz789.ngrok-free.app"
```

#### Bash (Linux/WSL/Mac)
```bash
# Rendre le script exécutable (première fois seulement)
chmod +x setup-ngrok-env.sh

# Configuration avec URL backend ngrok uniquement
./setup-ngrok-env.sh "https://abc123.ngrok-free.app"

# Configuration avec URLs backend et frontend ngrok
./setup-ngrok-env.sh "https://abc123.ngrok-free.app" "https://xyz789.ngrok-free.app"
```

Ces scripts vont :
- Créer ou mettre à jour `frontend/.env.local` avec `NEXT_PUBLIC_API_URL`
- Mettre à jour `.env` à la racine avec l'URL frontend dans `CORS_ORIGINS` (si fournie)

## 🔧 Configuration Manuelle des Variables d'Environnement

### Fichiers de configuration

Le projet utilise plusieurs fichiers de configuration selon l'environnement :

1. **Racine du projet** : `.env` (pour le backend et la configuration globale)
2. **Frontend** : `frontend/.env.local` (pour Next.js en développement)

### Variables importantes pour ngrok

#### Frontend (`frontend/.env.local`)
```env
# URL de l'API backend
# Local: http://localhost:5000
# Avec ngrok: https://votre-url-ngrok-backend.ngrok-free.app
NEXT_PUBLIC_API_URL=https://votre-url-ngrok-backend.ngrok-free.app
```

#### Backend (`.env` à la racine)
```env
# Origines CORS autorisées
# Ajoutez l'URL ngrok du frontend ici
CORS_ORIGINS=http://localhost:3000,https://votre-url-ngrok-frontend.ngrok-free.app
```

### Workflow complet avec ngrok

1. **Démarrer le backend** :
   ```bash
   cd backend
   python run.py
   ```

2. **Démarrer ngrok pour le backend** (dans un nouveau terminal) :
   ```bash
   .\start-ngrok-backend.ps1
   # Notez l'URL ngrok générée, par exemple: https://abc123.ngrok-free.app
   ```

3. **Configurer le frontend** :
   ```bash
   cd frontend
   # Créez .env.local si nécessaire
   echo "NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app" > .env.local
   ```

4. **Démarrer le frontend** :
   ```bash
   pnpm run dev
   ```

5. **Démarrer ngrok pour le frontend** (optionnel, dans un nouveau terminal) :
   ```bash
   .\start-ngrok-frontend.ps1
   # Notez l'URL ngrok générée pour le frontend
   ```

6. **Mettre à jour CORS du backend** (si vous exposez aussi le frontend) :
   ```env
   # Dans .env à la racine
   CORS_ORIGINS=http://localhost:3000,https://votre-url-ngrok-frontend.ngrok-free.app
   ```
   Redémarrez le backend pour que les changements prennent effet.

## 🔒 Sécurité

- Les URLs ngrok gratuites changent à chaque redémarrage
- Pour des URLs fixes, utilisez un compte ngrok payant
- Ne partagez pas vos URLs ngrok publiquement si elles contiennent des données sensibles
- Les tunnels gratuits ont des limitations de bande passante

## 🛠️ Dépannage

### Erreur "cannot execute binary file: Exec format error" (Windows)

Cette erreur survient quand un binaire Linux est installé sur Windows. Solutions :

1. **Désinstallez ngrok de pnpm global**:
   ```bash
   pnpm remove -g ngrok
   ```

2. **Installez via npm** (qui a de meilleurs binaires Windows):
   ```bash
   npm install -g ngrok
   ```

3. **Vérifiez l'installation**:
   ```bash
   ngrok version
   ```

### Erreur avec @ngrok/ngrok

Si vous obtenez une erreur avec les scripts Node.js:

1. **Vérifiez que NGROK_AUTHTOKEN est configuré**:
   ```bash
   # Dans .env ou frontend/.env.local
   NGROK_AUTHTOKEN=votre_token_ici
   ```

2. **Vérifiez l'installation**:
   ```bash
   cd frontend
   pnpm list @ngrok/ngrok
   ```

3. **Réinstallez si nécessaire**:
   ```bash
   cd frontend
   pnpm install @ngrok/ngrok --save-dev
   ```

4. **Alternative: Utilisez ngrok CLI globalement**:
   ```bash
   npm install -g ngrok  # Utilisez npm, pas pnpm
   ngrok config add-authtoken VOTRE_TOKEN_ICI
   ngrok http 3000  # ou 5000 pour le backend
   ```

### Port déjà utilisé
```bash
# Vérifiez quel processus utilise le port
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

### Erreur de connexion
- Vérifiez que votre serveur local est bien démarré
- Vérifiez que le port est correct (3000 pour frontend, 5000 pour backend)
- Vérifiez votre pare-feu

## 📚 Ressources

- Documentation ngrok: https://ngrok.com/docs
- Dashboard ngrok: https://dashboard.ngrok.com
- Guide de démarrage: https://ngrok.com/docs/getting-started

