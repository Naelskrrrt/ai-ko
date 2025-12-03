# 🚀 Démarrage Rapide - Backend Public avec Ngrok

## 📋 Prérequis

1. **Python 3.9+** installé
2. **Environnement virtuel** créé (`venv`)
3. **Dépendances** installées (`requirements.txt`)
4. **Compte Ngrok gratuit** : https://dashboard.ngrok.com/signup

---

## ⚡ Installation Ngrok (5 minutes)

### Windows

```powershell
# Option 1 : Chocolatey (recommandé)
choco install ngrok

# Option 2 : Téléchargement manuel
# https://ngrok.com/download
```

### Linux

```bash
# Snap (Ubuntu/Debian)
sudo snap install ngrok

# Ou téléchargement manuel
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### Mac

```bash
brew install ngrok/ngrok/ngrok
```

---

## 🔑 Configuration Ngrok (2 minutes)

1. **Créez un compte gratuit** : https://dashboard.ngrok.com/signup

2. **Copiez votre token** : https://dashboard.ngrok.com/get-started/your-authtoken

3. **Configurez le token** :

```bash
ngrok config add-authtoken VOTRE_TOKEN_ICI
```

4. **Créez `ngrok.yml`** dans le dossier `backend/` :

```bash
# Copiez l'exemple
cp ngrok.yml.example ngrok.yml

# Éditez et remplacez VOTRE_TOKEN
nano ngrok.yml  # ou notepad ngrok.yml sur Windows
```

---

## 🚀 Démarrage (1 commande)

### Windows

```powershell
cd backend
.\start-backend-public.ps1
```

### Linux/Mac

```bash
cd backend
chmod +x start-backend-public.sh  # Une seule fois
./start-backend-public.sh
```

**C'est tout ! Le script va :**
1. ✅ Démarrer Flask sur http://localhost:5000
2. ✅ Démarrer Ngrok tunnel
3. ✅ Ouvrir le dashboard Ngrok : http://127.0.0.1:4040

---

## 📊 Récupérer l'URL Publique

Le dashboard Ngrok s'ouvre automatiquement : **http://127.0.0.1:4040**

Vous verrez quelque chose comme :

```
Session Status: online
Forwarding:     https://abc123.ngrok.io -> http://localhost:5000
```

**Copiez l'URL** : `https://abc123.ngrok.io`

---

## 🌐 Configurer Vercel

### Option 1 : Via Dashboard

1. Allez sur https://vercel.com/votre-username/frontend/settings/environment-variables
2. Modifiez :
   - `BACKEND_INTERNAL_URL` = `https://abc123.ngrok.io`
   - `NEXT_PUBLIC_API_URL` = `https://abc123.ngrok.io`
3. Sauvegardez
4. Redéployez : Settings → Deployments → Redeploy

### Option 2 : Via CLI

```bash
cd frontend

# Mettre à jour les variables (remplacez l'URL)
echo "https://abc123.ngrok.io" | vercel env add BACKEND_INTERNAL_URL production --force
echo "https://abc123.ngrok.io" | vercel env add NEXT_PUBLIC_API_URL production --force

# Redéployer
vercel --prod
```

---

## ✅ Tester

### 1. Test local

```bash
curl http://localhost:5000/api/health
# Devrait retourner : {"status": "healthy"}
```

### 2. Test public (Ngrok)

```bash
curl https://abc123.ngrok.io/api/health
# Devrait retourner : {"status": "healthy"}
```

### 3. Test depuis Vercel

Ouvrez : `https://frontend-xxx.vercel.app/api/test-backend`

Devrait montrer :
```json
{
  "allTestsPassed": true,
  "tests": [...]
}
```

### 4. Test OAuth Google

1. Ouvrez : `https://frontend-xxx.vercel.app/login`
2. Cliquez sur "Continuer avec Google"
3. Devrait rediriger vers Google (pas d'erreur 500)

---

## 🛑 Arrêter les Services

### Linux/Mac

```bash
cd backend
./stop-backend-public.sh
```

### Windows

Fermez simplement les fenêtres PowerShell ouvertes par le script.

Ou manuellement :
```powershell
# Trouver les processus
Get-Process python, ngrok

# Arrêter
Stop-Process -Name python
Stop-Process -Name ngrok
```

---

## ⚠️ Important à Savoir

### URL Change à Chaque Redémarrage

Avec le plan **gratuit** Ngrok, l'URL change à chaque fois que vous redémarrez.

**Solutions :**

1. **Accepter et mettre à jour Vercel manuellement** (gratuit)
2. **Passer à Ngrok Pro** ($8/mois) pour URL fixe
3. **Utiliser Cloudflare Tunnel** (gratuit, URL fixe, setup plus complexe)

### Script Auto-Update (Optionnel)

Pour automatiser la mise à jour de Vercel quand l'URL Ngrok change :

```bash
# Installer jq (parser JSON)
# Windows: choco install jq
# Linux: sudo apt install jq
# Mac: brew install jq

# Créer update-vercel-url.sh
#!/bin/bash
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo "$NGROK_URL" | vercel env add BACKEND_INTERNAL_URL production --force
echo "$NGROK_URL" | vercel env add NEXT_PUBLIC_API_URL production --force
echo "✅ Vercel mis à jour avec $NGROK_URL"
echo "🔄 Redéployez : vercel --prod"
```

---

## 💡 Conseils

### Garder votre PC Allumé

Pour que le backend reste accessible :

1. **Désactiver la veille** :
   - Windows : Paramètres → Système → Alimentation → "Jamais"
   - Mac : Préférences Système → Économiseur d'énergie
   - Linux : `sudo systemctl mask sleep.target`

2. **Utiliser un vieux PC/Raspberry Pi** comme serveur dédié

3. **Configurer le démarrage automatique** au boot

### Surveiller les Connexions

Dashboard Ngrok : http://127.0.0.1:4040

Vous y verrez :
- ✅ Toutes les requêtes HTTP
- ✅ Temps de réponse
- ✅ Status codes
- ✅ Headers
- ✅ Body (request & response)

Très utile pour debugger !

---

## 🆘 Dépannage

### Erreur : "command not found: ngrok"

→ Ngrok n'est pas installé ou pas dans le PATH

**Solution :** Réinstallez ngrok ou ajoutez au PATH

### Erreur : "Failed to start tunnel"

→ Token invalide ou non configuré

**Solution :** 
```bash
ngrok config add-authtoken VOTRE_TOKEN
```

### Erreur : "bind: address already in use"

→ Le port 5000 est déjà utilisé

**Solution :**
```bash
# Trouver le processus
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Backend Flask ne démarre pas

→ Vérifiez les logs : `/tmp/backend-flask.log` (Linux/Mac)

**Solution :** Vérifiez :
- Venv activé ?
- Dépendances installées ?
- Fichier `.env` configuré ?

### Vercel : "Backend connection error"

→ Le backend n'est pas accessible depuis Vercel

**Checklist :**
1. ✅ Backend démarré ? `curl http://localhost:5000/api/health`
2. ✅ Ngrok actif ? Dashboard : http://127.0.0.1:4040
3. ✅ URL Ngrok mise à jour dans Vercel ?
4. ✅ Vercel redéployé après changement variables ?
5. ✅ CORS configuré ? `backend/.env` → `CORS_ORIGINS=...,https://*.ngrok.io`

---

## 📚 Ressources

- **Documentation Ngrok** : https://ngrok.com/docs
- **Dashboard Ngrok** : https://dashboard.ngrok.com
- **Support Ngrok** : https://ngrok.com/support
- **Guide Complet** : Voir `BACKEND_LOCAL_PUBLIC_GUIDE.md`

---

## 🎯 Récapitulatif

```bash
# 1. Installer Ngrok (une fois)
choco install ngrok  # ou brew/apt

# 2. Configurer token (une fois)
ngrok config add-authtoken VOTRE_TOKEN

# 3. Créer ngrok.yml (une fois)
cp ngrok.yml.example ngrok.yml
# Éditer et remplacer VOTRE_TOKEN

# 4. Démarrer (à chaque fois)
./start-backend-public.sh  # ou .ps1 sur Windows

# 5. Copier l'URL depuis http://127.0.0.1:4040

# 6. Mettre à jour Vercel avec cette URL

# 7. Redéployer Vercel
vercel --prod
```

**C'est tout ! Votre backend est maintenant accessible publiquement.** 🎉



