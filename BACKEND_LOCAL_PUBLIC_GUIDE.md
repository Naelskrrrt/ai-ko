# Déployer le Backend sur votre PC avec Adresse Publique

## 🎯 Concept

Héberger le backend Flask sur votre PC et le rendre accessible publiquement via un **tunnel** sécurisé.

**Avantages :**
- ✅ **100% Gratuit**
- ✅ **Ressources illimitées** (votre PC)
- ✅ **Pas de sleep/hibernation**
- ✅ **Contrôle total**
- ✅ **Pas de limite de RAM/CPU**

**Inconvénients :**
- ⚠️ PC doit rester allumé 24/7
- ⚠️ Dépend de votre connexion Internet
- ⚠️ Performance variable selon votre bande passante

---

## 🌐 Solutions de Tunneling

### **Option 1 : Ngrok (Recommandé - Le plus simple)**

#### 🆓 Plan Gratuit
- ✅ **Illimité** en temps
- ✅ 1 tunnel simultané
- ✅ HTTPS automatique
- ⚠️ URL change à chaque redémarrage (ex: `https://abc123.ngrok.io`)
- ✅ 40 connexions/minute

#### 💎 Plan Payant ($8/mois)
- ✅ **URL fixe** personnalisée (ex: `https://ai-ko.ngrok.io`)
- ✅ Tunnels multiples
- ✅ Pas de limite de connexions
- ✅ Authentification IP

#### Installation & Configuration

**1. Télécharger Ngrok**
```bash
# Windows
https://ngrok.com/download

# Ou via Chocolatey
choco install ngrok

# Linux/Mac
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**2. Créer un compte et obtenir le token**
- Allez sur https://dashboard.ngrok.com/signup
- Copiez votre auth token

**3. Configurer Ngrok**
```bash
ngrok config add-authtoken VOTRE_TOKEN_ICI
```

**4. Créer un fichier de configuration**

Créez `ngrok.yml` dans votre dossier backend :

```yaml
# ngrok.yml
version: "2"
authtoken: VOTRE_TOKEN_ICI

tunnels:
  backend:
    proto: http
    addr: 5000
    # Pour plan payant, décommentez :
    # hostname: ai-ko.ngrok.io
    inspect: true
    bind_tls: true
```

**5. Démarrer le backend avec Ngrok**

**Script Windows (`start-backend-public.ps1`) :**
```powershell
# Démarrer le backend Flask
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python run.py"

# Attendre que Flask démarre
Start-Sleep -Seconds 3

# Démarrer Ngrok
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok start backend --config ngrok.yml"

Write-Host "Backend et Ngrok démarrés!"
Write-Host "Ouvrez http://127.0.0.1:4040 pour voir l'URL publique Ngrok"
```

**Script Linux/Mac (`start-backend-public.sh`) :**
```bash
#!/bin/bash

# Démarrer le backend Flask en arrière-plan
cd backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!

# Attendre que Flask démarre
sleep 3

# Démarrer Ngrok
ngrok start backend --config ngrok.yml &
NGROK_PID=$!

echo "Backend démarré (PID: $BACKEND_PID)"
echo "Ngrok démarré (PID: $NGROK_PID)"
echo "Ouvrez http://127.0.0.1:4040 pour voir l'URL publique"
echo ""
echo "Pour arrêter : kill $BACKEND_PID $NGROK_PID"
```

**6. Obtenir l'URL publique**

Ouvrez http://127.0.0.1:4040 dans votre navigateur.

Vous verrez quelque chose comme :
```
Forwarding: https://abc123.ngrok.io -> http://localhost:5000
```

**7. Configurer Vercel avec l'URL Ngrok**

Dans Vercel, mettez à jour les variables d'environnement :
```bash
BACKEND_INTERNAL_URL=https://abc123.ngrok.io
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```

**8. Mettre à jour le backend CORS**

Dans `backend/.env` :
```bash
CORS_ORIGINS=http://localhost:3000,https://frontend-xxx.vercel.app,https://abc123.ngrok.io
```

---

### **Option 2 : Cloudflare Tunnel (Gratuit, URL fixe)**

#### Avantages
- ✅ **100% Gratuit**
- ✅ **URL fixe** (ex: `ai-ko.yourdomain.workers.dev`)
- ✅ Pas de limite de bande passante
- ✅ Protection DDoS Cloudflare
- ✅ Tunnels multiples

#### Inconvénients
- ⚠️ Configuration plus complexe
- ⚠️ Nécessite un compte Cloudflare

#### Installation & Configuration

**1. Télécharger Cloudflared**

```bash
# Windows
https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Mac
brew install cloudflare/cloudflare/cloudflared
```

**2. Authentifier**
```bash
cloudflared tunnel login
```

**3. Créer un tunnel**
```bash
cloudflared tunnel create ai-ko-backend
```

**4. Créer le fichier de configuration**

`config.yml` :
```yaml
tunnel: ai-ko-backend
credentials-file: /path/to/.cloudflared/UUID.json

ingress:
  - hostname: ai-ko-backend.yourdomain.workers.dev
    service: http://localhost:5000
  - service: http_status:404
```

**5. Configurer le DNS**
```bash
cloudflared tunnel route dns ai-ko-backend ai-ko-backend.yourdomain.workers.dev
```

**6. Démarrer le tunnel**
```bash
cloudflared tunnel run ai-ko-backend
```

**7. Script de démarrage automatique**

**Windows (Service) :**
```powershell
cloudflared service install
cloudflared service start
```

**Linux (Systemd) :**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

### **Option 3 : LocalTunnel (Le plus simple, mais moins stable)**

#### Installation
```bash
npm install -g localtunnel
```

#### Utilisation
```bash
# Démarrer le backend
cd backend
source venv/bin/activate
python run.py

# Dans un autre terminal
lt --port 5000 --subdomain ai-ko-backend
```

**URL générée :** `https://ai-ko-backend.loca.lt`

⚠️ **Attention :** Moins stable que Ngrok, peut se déconnecter

---

### **Option 4 : Serveo (SSH Tunnel)**

#### Utilisation (aucune installation)
```bash
# Une seule commande !
ssh -R 80:localhost:5000 serveo.net
```

**URL générée :** `https://randomname.serveo.net`

---

## 🚀 Solution Recommandée : Ngrok

### Configuration Complète

#### 1. Structure des fichiers

```
backend/
├── .env
├── ngrok.yml
├── start-backend-public.ps1  (Windows)
├── start-backend-public.sh   (Linux/Mac)
└── run.py
```

#### 2. Fichier `ngrok.yml`

```yaml
version: "2"
authtoken: VOTRE_NGROK_TOKEN

tunnels:
  backend:
    proto: http
    addr: 5000
    inspect: true
    bind_tls: true
    # Logs
    log_level: info
    log_format: json
```

#### 3. Script de démarrage automatique Windows

**`backend/start-backend-public.ps1` :**
```powershell
# Configuration
$BACKEND_DIR = $PSScriptRoot
$VENV_PYTHON = "$BACKEND_DIR\venv\Scripts\python.exe"
$NGROK_CONFIG = "$BACKEND_DIR\ngrok.yml"

Write-Host "🚀 Démarrage du backend AI-KO avec Ngrok..." -ForegroundColor Green
Write-Host ""

# Vérifier que le venv existe
if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "❌ Erreur : venv non trouvé. Exécutez d'abord : python -m venv venv" -ForegroundColor Red
    exit 1
}

# Vérifier que ngrok est installé
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Erreur : ngrok n'est pas installé. Téléchargez-le sur https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

# Démarrer Flask
Write-Host "📦 Démarrage du serveur Flask..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$BACKEND_DIR'; .\venv\Scripts\Activate.ps1; python run.py"

# Attendre que Flask démarre
Write-Host "⏳ Attente du démarrage de Flask (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Démarrer Ngrok
Write-Host "🌐 Démarrage du tunnel Ngrok..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "ngrok start backend --config '$NGROK_CONFIG'"

# Attendre que Ngrok démarre
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Backend et Ngrok démarrés avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Dashboard Ngrok : http://127.0.0.1:4040" -ForegroundColor Yellow
Write-Host "🔗 Copiez l'URL publique depuis le dashboard Ngrok" -ForegroundColor Yellow
Write-Host ""
Write-Host "Puis mettez à jour Vercel avec cette URL :" -ForegroundColor Cyan
Write-Host "  BACKEND_INTERNAL_URL=https://votre-url.ngrok.io" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_API_URL=https://votre-url.ngrok.io" -ForegroundColor White
Write-Host ""

# Ouvrir le dashboard Ngrok
Start-Process "http://127.0.0.1:4040"
```

#### 4. Script Linux/Mac

**`backend/start-backend-public.sh` :**
```bash
#!/bin/bash

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"
NGROK_CONFIG="$BACKEND_DIR/ngrok.yml"

echo "🚀 Démarrage du backend AI-KO avec Ngrok..."
echo ""

# Vérifier venv
if [ ! -f "$VENV_PYTHON" ]; then
    echo "❌ Erreur : venv non trouvé. Exécutez : python -m venv venv"
    exit 1
fi

# Vérifier ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ Erreur : ngrok non installé. Installez-le : https://ngrok.com/download"
    exit 1
fi

# Démarrer Flask
echo "📦 Démarrage du serveur Flask..."
cd "$BACKEND_DIR"
source venv/bin/activate
python run.py &
BACKEND_PID=$!

# Attendre Flask
echo "⏳ Attente du démarrage de Flask (5 secondes)..."
sleep 5

# Démarrer Ngrok
echo "🌐 Démarrage du tunnel Ngrok..."
ngrok start backend --config "$NGROK_CONFIG" &
NGROK_PID=$!

sleep 3

echo ""
echo "✅ Backend et Ngrok démarrés!"
echo ""
echo "📊 Dashboard Ngrok : http://127.0.0.1:4040"
echo "🔗 Copiez l'URL publique depuis le dashboard"
echo ""
echo "PIDs : Backend=$BACKEND_PID, Ngrok=$NGROK_PID"
echo ""
echo "Pour arrêter : kill $BACKEND_PID $NGROK_PID"
echo ""

# Ouvrir le dashboard (si xdg-open disponible)
if command -v xdg-open &> /dev/null; then
    xdg-open http://127.0.0.1:4040
fi
```

#### 5. Rendre les scripts exécutables (Linux/Mac)
```bash
chmod +x backend/start-backend-public.sh
```

---

## 🔧 Configuration Backend pour Ngrok

### Mettre à jour `backend/.env`

```bash
# CORS - Autoriser toutes les origines Ngrok
CORS_ORIGINS=http://localhost:3000,https://*.ngrok.io,https://frontend-xxx.vercel.app

# Ou spécifique :
# CORS_ORIGINS=http://localhost:3000,https://abc123.ngrok.io,https://frontend-xxx.vercel.app

# Autres variables...
SECRET_KEY=votre-secret-key
JWT_SECRET_KEY=votre-jwt-secret
DATABASE_URL=sqlite:///app.db

# Google OAuth
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
# Mettre à jour avec l'URL Ngrok
GOOGLE_REDIRECT_URI=https://frontend-xxx.vercel.app/api/auth/callback/google
```

---

## 🌐 Workflow Complet

### 1. Démarrer le Backend Public

**Windows :**
```powershell
cd backend
.\start-backend-public.ps1
```

**Linux/Mac :**
```bash
cd backend
./start-backend-public.sh
```

### 2. Récupérer l'URL Ngrok

Ouvrez http://127.0.0.1:4040

Copiez l'URL, ex: `https://abc123.ngrok.io`

### 3. Mettre à Jour Vercel

```bash
# Via Dashboard Vercel
# Settings → Environment Variables → Edit

BACKEND_INTERNAL_URL=https://abc123.ngrok.io
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```

Ou via CLI :
```bash
echo "https://abc123.ngrok.io" | vercel env add BACKEND_INTERNAL_URL production
echo "https://abc123.ngrok.io" | vercel env add NEXT_PUBLIC_API_URL production
```

### 4. Redéployer Vercel

```bash
vercel --prod
```

### 5. Tester

```bash
# Test backend
curl https://abc123.ngrok.io/api/health

# Test depuis Vercel
https://frontend-xxx.vercel.app/api/test-backend
```

---

## ⚠️ Limitations et Solutions

### **Problème 1 : URL change à chaque redémarrage**

**Solution 1 (Gratuite) :**
- Créer un script qui met à jour automatiquement Vercel :

```bash
# update-vercel-backend.sh
#!/bin/bash

# Obtenir l'URL Ngrok via l'API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

echo "URL Ngrok : $NGROK_URL"

# Mettre à jour Vercel
echo "$NGROK_URL" | vercel env add BACKEND_INTERNAL_URL production --force
echo "$NGROK_URL" | vercel env add NEXT_PUBLIC_API_URL production --force

echo "Vercel mis à jour. Redéployez avec : vercel --prod"
```

**Solution 2 (Payante $8/mois) :**
- Ngrok Pro : URL fixe `https://ai-ko.ngrok.io`

### **Problème 2 : PC doit rester allumé**

**Solution :**
- Utiliser un vieux PC/Raspberry Pi comme serveur permanent
- Configurer l'alimentation pour ne jamais s'éteindre
- Utiliser Wake-on-LAN pour démarrer à distance

### **Problème 3 : Connexion Internet instable**

**Solution :**
- Ngrok se reconnecte automatiquement
- Surveiller avec le dashboard : http://127.0.0.1:4040
- Utiliser Cloudflare Tunnel (plus stable)

---

## 💰 Comparaison Coûts

| Solution | Coût | URL Fixe | Stabilité |
|----------|------|----------|-----------|
| **Ngrok Free** | $0 | ❌ (change) | ⭐⭐⭐⭐ |
| **Ngrok Pro** | $8/mois | ✅ | ⭐⭐⭐⭐⭐ |
| **Cloudflare Tunnel** | $0 | ✅ | ⭐⭐⭐⭐⭐ |
| **LocalTunnel** | $0 | ⚠️ (aléatoire) | ⭐⭐ |
| **Railway** | $0-10/mois | ✅ | ⭐⭐⭐⭐⭐ |
| **VPS** | $4-6/mois | ✅ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Ma Recommandation

### Pour MVP/Test (Gratuit)
**Ngrok Free + Script de mise à jour**
- Coût : $0
- Temps setup : 10 minutes
- Bon pour démo/test

### Pour Production Sérieuse
**Ngrok Pro ($8/mois)**
- URL fixe
- Plus stable
- Support technique

### Alternative Stable Gratuite
**Cloudflare Tunnel**
- Gratuit à vie
- URL fixe
- Très stable
- Setup plus complexe

---

**Voulez-vous que je crée tous les scripts de démarrage automatique pour votre backend avec Ngrok ?** 🚀



