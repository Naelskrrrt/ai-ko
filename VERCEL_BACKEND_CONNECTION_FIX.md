# Fix Connexion Backend depuis Vercel

## 🔍 Problème Actuel

```
error: "Backend connection error"
message: "fetch failed"
```

Vercel ne peut pas se connecter au backend Flask sur `http://147.93.90.223:5000`

## 🎯 Causes Possibles

1. **CORS mal configuré** → Backend refuse les requêtes de Vercel
2. **Firewall bloqué** → Port 5000 non ouvert sur le VPS
3. **Backend écoute sur localhost** → Pas accessible depuis l'extérieur
4. **Backend arrêté** → Service Flask non démarré

## ✅ Solutions à Appliquer

### **1. Configuration CORS Backend (CRITIQUE)**

Éditez le fichier `backend/.env` sur votre VPS :

```bash
# backend/.env

# Ajouter l'URL Vercel aux origines CORS
CORS_ORIGINS=http://localhost:3000,https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app,https://frontend-kappa-eight-79.vercel.app

# Autres variables importantes
SECRET_KEY=votre-secret-key-ici
JWT_SECRET_KEY=votre-jwt-secret-ici
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_ko

# Google OAuth
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GOOGLE_REDIRECT_URI=https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/auth/callback/google
```

**Puis redémarrez le backend :**

```bash
# Si systemd
sudo systemctl restart ai-ko-backend

# Ou manuellement
cd backend
source venv/bin/activate
python run.py
```

### **2. Vérifier que le Backend Écoute sur 0.0.0.0**

Le fichier `backend/run.py` doit contenir (ligne 48-53) :

```python
app.run(
    host='0.0.0.0',  # ✅ Accessible depuis l'extérieur
    port=int(os.getenv('PORT', 5000)),
    debug=debug_mode
)
```

**Si c'est `host='localhost'` ou `host='127.0.0.1'`**, changez pour `'0.0.0.0'`

### **3. Ouvrir le Port 5000 dans le Firewall**

#### Ubuntu/Debian (ufw)

```bash
sudo ufw allow 5000/tcp
sudo ufw status
```

#### CentOS/RHEL (firewalld)

```bash
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

### **4. Tester la Connectivité**

#### Depuis votre machine locale

```bash
# Test 1: Health check
curl http://147.93.90.223:5000/api/health

# Devrait retourner :
# {"status": "healthy"}

# Test 2: OAuth endpoint
curl http://147.93.90.223:5000/api/auth/oauth/google

# Devrait retourner :
# {"auth_url": "https://accounts.google.com/..."}
```

#### Depuis Vercel (après déploiement)

1. Déployez le frontend avec les nouveaux fichiers
2. Ouvrez : `https://frontend-xxx.vercel.app/api/test-backend`
3. Vous devriez voir :

```json
{
  "backendUrl": "http://147.93.90.223:5000",
  "allTestsPassed": true,
  "tests": [
    {
      "name": "Health Check",
      "status": 200,
      "success": true
    },
    {
      "name": "OAuth Google",
      "status": 200,
      "success": true
    }
  ]
}
```

## 📦 Fichiers Créés

1. ✅ `frontend/src/app/api/auth/oauth/google/route.ts` - Route proxy OAuth
2. ✅ `frontend/src/app/api/test-backend/route.ts` - Endpoint de test connectivité
3. ✅ `backend/CORS_FIX_VERCEL.md` - Documentation détaillée backend
4. ✅ `frontend/OAUTH_FIX_VERCEL.md` - Documentation OAuth
5. ✅ `VERCEL_BACKEND_CONNECTION_FIX.md` - Ce document

## 🚀 Étapes de Déploiement

### 1. Configurer le Backend

```bash
# SSH vers votre VPS
ssh user@147.93.90.223

# Éditer .env
cd /path/to/backend
nano .env

# Ajouter/modifier CORS_ORIGINS
CORS_ORIGINS=http://localhost:3000,https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app,https://frontend-kappa-eight-79.vercel.app

# Sauvegarder et redémarrer
sudo systemctl restart ai-ko-backend

# Vérifier les logs
sudo journalctl -u ai-ko-backend -f
```

### 2. Tester le Backend

```bash
# Depuis votre machine locale
curl http://147.93.90.223:5000/api/health
curl http://147.93.90.223:5000/api/auth/oauth/google
```

Si les deux commandes répondent → Backend OK ✅

### 3. Déployer le Frontend

```bash
cd frontend

# Option A: Via Git (auto-deploy)
git add .
git commit -m "fix: add OAuth proxy route and backend connectivity tests"
git push origin main

# Option B: Via CLI Vercel
vercel --prod
```

### 4. Tester depuis Vercel

Ouvrez : `https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/test-backend`

Vous devriez voir tous les tests réussis.

### 5. Tester OAuth Complet

1. Ouvrez : `https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/login`
2. Cliquez sur "Continuer avec Google"
3. Devrait rediriger vers Google OAuth
4. Autoriser l'application
5. Devrait rediriger vers votre dashboard

## 🐛 Troubleshooting

### Si le test backend échoue toujours

1. **Vérifier que le backend est démarré :**

```bash
sudo systemctl status ai-ko-backend
# ou
ps aux | grep python | grep run.py
```

2. **Vérifier les logs backend :**

```bash
sudo journalctl -u ai-ko-backend -n 50
# ou
tail -f backend/backend.log
```

3. **Vérifier netstat :**

```bash
sudo netstat -tulpn | grep 5000
# Devrait montrer : 0.0.0.0:5000 (et pas 127.0.0.1:5000)
```

4. **Tester depuis le VPS lui-même :**

```bash
curl http://localhost:5000/api/health
curl http://127.0.0.1:5000/api/health
```

### Si OAuth échoue avec "redirect_uri_mismatch"

1. Allez sur https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre projet OAuth
3. Vérifiez que les URIs de redirection contiennent EXACTEMENT :
   ```
   https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/auth/callback/google
   ```
4. Attendez 5 minutes pour la propagation

## 📊 Checklist Complète

### Backend (VPS)

- [ ] Fichier `.env` mis à jour avec `CORS_ORIGINS`
- [ ] Backend redémarré
- [ ] `run.py` utilise `host='0.0.0.0'`
- [ ] Port 5000 ouvert dans firewall
- [ ] `curl http://147.93.90.223:5000/api/health` → 200 OK
- [ ] `curl http://147.93.90.223:5000/api/auth/oauth/google` → 200 OK

### Frontend (Vercel)

- [ ] Fichier `api/auth/oauth/google/route.ts` créé
- [ ] Fichier `api/test-backend/route.ts` créé
- [ ] Variables d'environnement Vercel configurées
- [ ] Code commité et pushé
- [ ] Déploiement Vercel terminé
- [ ] `/api/test-backend` retourne `allTestsPassed: true`
- [ ] Bouton Google OAuth redirige correctement

### Google Cloud Console

- [ ] URI de redirection ajoutée
- [ ] Origine JavaScript ajoutée
- [ ] Changements propagés (attendre 5 min)

## 🎯 Une Fois Tout Configuré

Vous pourrez vous connecter avec Google OAuth depuis :
- https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/login
- https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/register

Le flux sera :
1. Clic sur "Continuer avec Google"
2. Redirection vers Google
3. Autorisation
4. Callback vers votre app
5. Connexion automatique et redirection vers dashboard

---

**Status :** Configuration backend requise
**Priorité :** Critique
**Temps estimé :** 10-15 minutes



