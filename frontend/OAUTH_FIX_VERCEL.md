# Fix OAuth Google sur Vercel - Résolu ✅

**Date:** 2 Décembre 2025

## 🐛 Problème Identifié

L'erreur 500 sur `/api/auth/oauth/google` était causée par l'absence d'une route API Next.js pour proxifier les requêtes OAuth vers le backend Flask.

**Requêtes échouées :**
```
GET https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/auth/oauth/google
→ HTTP 500 (route inexistante)
```

## ✅ Solution Implémentée

### Fichier créé : `frontend/src/app/api/auth/oauth/google/route.ts`

Cette route API Next.js agit comme un proxy entre le frontend Vercel et le backend Flask :

```typescript
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function GET(request: NextRequest) {
  // Appelle le backend Flask pour obtenir l'URL OAuth Google
  const response = await fetch(`${BACKEND_URL}/api/auth/oauth/google`);
  const data = await response.json();
  return NextResponse.json(data);
}
```

## 📊 Architecture OAuth Complète

```
[Utilisateur clique "Se connecter avec Google"]
         ↓
[Frontend Vercel] GET /api/auth/oauth/google
         ↓
[Route Proxy Next.js] → [Backend Flask] /api/auth/oauth/google
         ↓
[Backend retourne] { auth_url: "https://accounts.google.com/..." }
         ↓
[Frontend redirige] → Google OAuth
         ↓
[Google redirige] → /api/auth/callback/google?code=xxx
         ↓
[Route Callback Next.js] → [Backend Flask] /api/auth/oauth/google/callback
         ↓
[Backend valide & crée token JWT]
         ↓
[Frontend redirige] → Dashboard utilisateur
```

## 🔧 Variables d'Environnement Requises sur Vercel

### Frontend (Vercel)
```bash
BACKEND_INTERNAL_URL=http://147.93.90.223:5000
NEXT_PUBLIC_API_URL=http://147.93.90.223:5000
```

### Backend (Flask - VPS)
```bash
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GOOGLE_REDIRECT_URI=https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/auth/callback/google
```

## 🔐 Configuration Google Cloud Console

Allez sur : https://console.cloud.google.com/apis/credentials

### 1. URIs de redirection autorisées
Ajoutez :
```
https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/auth/callback/google
```

### 2. Origines JavaScript autorisées
Ajoutez :
```
https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app
```

## 🚀 Déploiement

### Option 1 : Via Git (Automatique)
```bash
cd frontend
git add .
git commit -m "fix: add OAuth Google proxy route"
git push origin main
```
→ Vercel redéploie automatiquement

### Option 2 : Via CLI Vercel
```bash
cd frontend
vercel --prod
```

## ✅ Tests Post-Déploiement

### 1. Tester la route proxy
```bash
curl https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/api/auth/oauth/google
```

**Réponse attendue :**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

### 2. Tester le flux complet
1. Ouvrir : https://frontend-b8ppxbmo2-naelskrrrts-projects.vercel.app/login
2. Cliquer sur "Continuer avec Google"
3. Vérifier la redirection vers Google
4. Autoriser l'application
5. Vérifier la redirection vers le dashboard

## 📝 Logs de Débogage

Les logs suivants apparaîtront dans Vercel :

```
[OAuth Proxy] Calling backend: http://147.93.90.223:5000/api/auth/oauth/google
[OAuth Proxy] Backend response status: 200
[OAuth Proxy] Backend data: { auth_url: "..." }
```

En cas d'erreur :
```
[OAuth Proxy] Backend error: ...
[OAuth Proxy] Error: ...
```

## 🔍 Troubleshooting

### Erreur : "Backend connection error"
**Cause :** Le backend Flask n'est pas accessible depuis Vercel

**Solution :**
1. Vérifier que le backend est démarré : `systemctl status ai-ko-backend`
2. Vérifier le firewall VPS : port 5000 ouvert
3. Tester : `curl http://147.93.90.223:5000/api/health`

### Erreur : "Google OAuth non configuré"
**Cause :** Variables d'environnement manquantes sur le backend

**Solution :**
1. Vérifier le fichier `.env` du backend
2. Vérifier que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis
3. Redémarrer le backend : `systemctl restart ai-ko-backend`

### Erreur : "redirect_uri_mismatch"
**Cause :** L'URI de redirection ne correspond pas à celle configurée dans Google Cloud

**Solution :**
1. Vérifier la console Google Cloud
2. S'assurer que l'URL Vercel exacte est dans les URIs autorisées
3. Attendre 5 minutes pour la propagation des changements Google

## 📚 Fichiers Modifiés

- ✅ `frontend/src/app/api/auth/oauth/google/route.ts` (créé)
- ✅ `frontend/OAUTH_FIX_VERCEL.md` (créé - ce document)

## 🎯 Prochaines Étapes

1. Commit et push des changements
2. Vérifier le déploiement Vercel
3. Tester le flux OAuth complet
4. Configurer Google Cloud Console si nécessaire
5. Mettre à jour les variables d'environnement backend si nécessaire

---

**Status:** ✅ Implémentation complète
**Déploiement requis:** Oui
**Tests requis:** Oui



