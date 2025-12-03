# Fix CORS pour Vercel - Configuration Backend

## 🐛 Problème

L'erreur "Backend connection error" / "fetch failed" indique que Vercel ne peut pas se connecter au backend Flask, probablement à cause de :

1. **CORS** : Le backend n'autorise que `http://localhost:3000`
2. **Firewall** : Le port 5000 est bloqué
3. **Backend éteint** : Le serveur Flask n'est pas démarré

## ✅ Solution 1 : Configuration CORS

### Fichier `.env` du backend

Ajoutez l'URL Vercel à la liste des origines autorisées :

```bash
# backend/.env

# CORS - Autoriser le frontend Vercel
CORS_ORIGINS=http://localhost:3000,https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app,https://frontend-kappa-eight-79.vercel.app,https://*.vercel.app

# Autres variables
SECRET_KEY=votre-secret-key
JWT_SECRET_KEY=votre-jwt-secret
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_ko

# Google OAuth
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_REDIRECT_URI=https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/auth/callback/google
```

### Redémarrer le Backend

```bash
# Si systemd
sudo systemctl restart ai-ko-backend

# Ou manuellement
cd backend
source venv/bin/activate
python run.py
```

## ✅ Solution 2 : Vérifier que le Backend Écoute sur 0.0.0.0

### Vérifier `run.py`

Le fichier `backend/run.py` doit contenir :

```python
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',  # ← Important : écouter sur toutes les interfaces
        port=int(os.getenv('PORT', 5000)),
        debug=debug_mode
    )
```

✅ **Bon** : `host='0.0.0.0'` → Accessible depuis l'extérieur
❌ **Mauvais** : `host='localhost'` ou `host='127.0.0.1'` → Accessible seulement localement

## ✅ Solution 3 : Ouvrir le Port dans le Firewall

### Sur Ubuntu/Debian (ufw)

```bash
# Autoriser le port 5000
sudo ufw allow 5000/tcp

# Vérifier
sudo ufw status
```

### Sur CentOS/RHEL (firewalld)

```bash
# Autoriser le port 5000
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload

# Vérifier
sudo firewall-cmd --list-ports
```

## ✅ Solution 4 : Tester la Connectivité depuis l'Extérieur

### Depuis votre machine locale

```bash
# Tester si le backend est accessible
curl http://147.93.90.223:5000/api/health

# Devrait retourner :
# {"status": "healthy"}
```

### Tester l'endpoint OAuth

```bash
curl http://147.93.90.223:5000/api/auth/oauth/google

# Devrait retourner :
# {"auth_url": "https://accounts.google.com/..."}
```

## 🔧 Solution Temporaire : Utiliser HTTPS avec Nginx

Si vous avez Nginx configuré, utilisez l'URL HTTPS au lieu de HTTP :

### Variables d'environnement Vercel

```bash
# Au lieu de :
BACKEND_INTERNAL_URL=http://147.93.90.223:5000

# Utiliser :
BACKEND_INTERNAL_URL=https://votre-domaine.com
NEXT_PUBLIC_API_URL=https://votre-domaine.com
```

## 📝 Checklist de Vérification

- [ ] Variable `CORS_ORIGINS` mise à jour dans `backend/.env`
- [ ] Backend redémarré après modification
- [ ] `run.py` utilise `host='0.0.0.0'`
- [ ] Port 5000 ouvert dans le firewall
- [ ] Backend accessible depuis l'extérieur : `curl http://147.93.90.223:5000/api/health`
- [ ] Endpoint OAuth répond : `curl http://147.93.90.223:5000/api/auth/oauth/google`
- [ ] Variables Vercel à jour
- [ ] Frontend redéployé sur Vercel

## 🐛 Debugging Avancé

### Logs Backend

```bash
# Voir les logs en temps réel
sudo journalctl -u ai-ko-backend -f

# Ou si vous utilisez screen/tmux
# Voir la session du serveur
```

### Logs Vercel

1. Allez sur https://vercel.com/naelskrrrts-projects/frontend
2. Cliquez sur "Logs"
3. Cherchez `[OAuth Proxy]` pour voir les logs de connexion

### Test depuis Vercel Functions

Créez un endpoint de test :

```typescript
// frontend/src/app/api/test-backend/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://147.93.90.223:5000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: "GET",
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      backendUrl: BACKEND_URL,
      backendResponse: data,
      status: response.status,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      backendUrl: BACKEND_URL,
      error: error.message,
    }, { status: 500 });
  }
}
```

Puis testez : `https://frontend-xxx.vercel.app/api/test-backend`

## 🚀 Configuration Production Recommandée

### Utiliser un Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/ai-ko

server {
    listen 80;
    server_name api.ai-ko.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://frontend-xxx.vercel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}
```

Puis utiliser :
```bash
BACKEND_INTERNAL_URL=http://api.ai-ko.com
```

---

**Status :** Configuration requise
**Impact :** Critique - OAuth ne fonctionnera pas sans cette config



