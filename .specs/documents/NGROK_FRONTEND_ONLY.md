# Configuration : Frontend sur ngrok, Backend en local

Ce guide explique comment exposer uniquement le frontend via ngrok tout en gardant le backend en local sur votre machine.

## ⚡ Démarrage rapide

1. **Backend local** : `cd backend && python run.py` (port 5000)
2. **Frontend** : `cd frontend && pnpm run dev` (port 3000)
3. **Configuration** : Créez `frontend/.env.local` avec :
   ```env
   BACKEND_INTERNAL_URL=http://localhost:5000
   NEXT_PUBLIC_API_URL=
   ```
4. **Modifiez les services** pour utiliser des URLs relatives (`/api`) au lieu d'URLs absolues
5. **Exposez via ngrok** : `ngrok http 3000`

**Note** : Les services actuels utilisent `NEXT_PUBLIC_API_URL` avec une valeur par défaut. Pour que ça fonctionne avec ngrok, vous devez soit modifier les services pour utiliser des URLs relatives, soit utiliser une détection automatique de l'URL (voir section "Configuration avancée").

## 🎯 Architecture

```
Internet → ngrok → Frontend Next.js (localhost:3000) → Backend Flask (localhost:5000)
```

Le frontend Next.js agit comme un proxy et transmet les requêtes API au backend local.

## ✅ Avantages

- ✅ Backend reste privé et sécurisé (non exposé sur internet)
- ✅ Pas besoin de configurer CORS pour ngrok
- ✅ Plus simple à configurer
- ✅ Le backend reste accessible uniquement depuis votre machine

## 📋 Configuration

### 1. Assurez-vous que le backend est démarré localement

```bash
cd backend
python run.py
```

Le backend doit être accessible sur `http://localhost:5000`

### 2. Configurez le frontend pour utiliser le proxy Next.js

Le frontend Next.js a déjà un proxy API route (`/api/[...path]`) qui fait le pont avec le backend.

**Important** : Configurez `BACKEND_INTERNAL_URL` pour que le proxy Next.js se connecte au backend local.

Créez ou modifiez `frontend/.env.local` :

```env
# URL interne pour le proxy Next.js (utilisé côté serveur)
# Cette URL est utilisée par le proxy Next.js pour se connecter au backend
BACKEND_INTERNAL_URL=http://localhost:5000

# URL publique de l'API (utilisée par le client)
# Laissez vide pour utiliser le proxy Next.js avec des URLs relatives
# OU utilisez l'URL du frontend (http://localhost:3000 en local, ou l'URL ngrok en production)
NEXT_PUBLIC_API_URL=
```

**Note importante** : Les services frontend utilisent actuellement `NEXT_PUBLIC_API_URL` avec une valeur par défaut de `http://localhost:5000`. Pour que les requêtes passent par le proxy Next.js :

- **Option A (Recommandée)** : Laissez `NEXT_PUBLIC_API_URL` vide. Les services utiliseront alors `http://localhost:5000` en local, ce qui fonctionnera car vous êtes sur la même machine. Mais pour les utilisateurs externes via ngrok, cela ne fonctionnera pas directement.

- **Option B** : Modifiez les services pour utiliser des URLs relatives (`/api/...`) quand `NEXT_PUBLIC_API_URL` n'est pas défini. Cela nécessite une modification du code.

- **Option C (Simple)** : Configurez `NEXT_PUBLIC_API_URL` pour pointer vers le frontend lui-même. Les requêtes iront vers le frontend qui les proxyfiera vers le backend.

Pour l'option C, configurez :

```env
# En développement local
NEXT_PUBLIC_API_URL=http://localhost:3000

# OU si vous voulez que ça fonctionne aussi via ngrok, utilisez une détection dynamique
# (mais cela nécessite une modification du code des services)
```

### 3. Solution simple : Utiliser le proxy Next.js automatiquement

**Bonne nouvelle** : Le proxy Next.js route `/api/[...path]` existe déjà et fonctionne. Cependant, les services frontend font actuellement des requêtes directes vers le backend.

**Solution la plus simple** : Configurez `NEXT_PUBLIC_API_URL` pour qu'il pointe vers le frontend lui-même. Les requêtes iront vers le frontend qui les proxyfiera automatiquement vers le backend.

Dans `frontend/.env.local` :

```env
# Backend interne (pour le proxy Next.js)
BACKEND_INTERNAL_URL=http://localhost:5000

# URL publique : pointe vers le frontend (qui proxyfie vers le backend)
# En local
NEXT_PUBLIC_API_URL=http://localhost:3000

# OU pour que ça fonctionne aussi via ngrok, laissez vide et utilisez une détection
# (voir section "Configuration avancée" ci-dessous)
```

**Comment ça fonctionne** :
1. Le client fait une requête vers `http://localhost:3000/api/...`
2. Next.js intercepte la requête via le proxy route `/api/[...path]`
3. Le proxy Next.js fait une requête vers `BACKEND_INTERNAL_URL` (http://localhost:5000)
4. Le backend répond au proxy Next.js
5. Le proxy Next.js renvoie la réponse au client

**Note** : Cette configuration fonctionne en local. Pour ngrok, vous devrez peut-être ajuster (voir section "Configuration avancée").

### 4. Démarrez le frontend

```bash
cd frontend
pnpm run dev
```

### 5. Exposez le frontend via ngrok

```bash
# Depuis la racine du projet
.\start-ngrok-frontend.ps1

# Ou directement
ngrok http 3000
```

Vous obtiendrez une URL comme : `https://abc123.ngrok-free.app`

### 6. Testez

1. Accédez à l'URL ngrok depuis n'importe où : `https://abc123.ngrok-free.app`
2. Le frontend devrait se charger
3. Les requêtes API passeront par le proxy Next.js vers le backend local

## 🔧 Configuration CORS (si nécessaire)

Si vous avez des problèmes CORS, assurez-vous que le backend autorise les requêtes depuis `localhost:3000` :

Dans `.env` à la racine :

```env
CORS_ORIGINS=http://localhost:3000
```

**Note** : Normalement, vous n'avez pas besoin d'ajouter l'URL ngrok dans CORS car les requêtes API passent par le proxy Next.js (côté serveur), pas directement depuis le navigateur vers le backend.

## 🐛 Dépannage

### Les requêtes API ne fonctionnent pas

1. **Vérifiez que le backend est démarré** :
   ```bash
   curl http://localhost:5000/health
   ```

2. **Vérifiez que BACKEND_INTERNAL_URL est configuré** :
   ```bash
   # Dans frontend/.env.local
   BACKEND_INTERNAL_URL=http://localhost:5000
   ```

3. **Vérifiez les logs du frontend** pour voir si le proxy fonctionne

### Erreur "Backend connection error"

- Vérifiez que le backend est accessible sur `http://localhost:5000`
- Vérifiez que `BACKEND_INTERNAL_URL` est correctement configuré
- Vérifiez les logs du backend pour voir si les requêtes arrivent

### Les requêtes vont directement au backend au lieu du proxy

Si vos services frontend font des requêtes directes au backend au lieu d'utiliser le proxy :

1. **Vérifiez la configuration** :
   - `BACKEND_INTERNAL_URL` doit pointer vers `http://localhost:5000`
   - `NEXT_PUBLIC_API_URL` doit pointer vers `http://localhost:3000` (ou l'URL ngrok)

2. **Vérifiez les logs du frontend** pour voir vers quelle URL les requêtes sont faites

3. **Testez le proxy directement** :
   ```bash
   # Depuis votre navigateur ou curl
   curl http://localhost:3000/api/health
   # Devrait retourner la réponse du backend
   ```

4. **Si le proxy ne fonctionne pas**, vérifiez que le fichier `frontend/src/app/api/[...path]/route.ts` existe et est correctement configuré

## 📝 Exemple de configuration complète

### `frontend/.env.local` (Configuration simple)
```env
# Backend interne (utilisé par le proxy Next.js côté serveur)
BACKEND_INTERNAL_URL=http://localhost:5000

# URL publique : laissez vide pour utiliser des URLs relatives
# OU configurez selon votre besoin (voir section "Configuration avancée")
NEXT_PUBLIC_API_URL=
```

**Note** : Si vous laissez `NEXT_PUBLIC_API_URL` vide, vous devrez modifier les services pour utiliser des URLs relatives (`/api`) ou détecter automatiquement l'URL du navigateur.

### `.env` (racine)
```env
# Backend Flask
BACKEND_PORT=5000

# CORS (seulement localhost nécessaire car les requêtes passent par le proxy)
CORS_ORIGINS=http://localhost:3000
```

## 🔧 Configuration avancée pour ngrok

**Problème** : Si vous configurez `NEXT_PUBLIC_API_URL=http://localhost:3000`, cela fonctionnera en local mais pas via ngrok car les requêtes iront vers `localhost` au lieu de l'URL ngrok.

**Solution** : Utilisez des URLs relatives dans les services. Modifiez les services pour qu'ils utilisent l'URL actuelle du navigateur.

### Option 1 : Modifier les services pour utiliser des URLs relatives

Modifiez les services pour qu'ils utilisent `/api` comme baseURL (URL relative) au lieu d'une URL absolue. Par exemple, dans `session.service.ts` :

```typescript
// Au lieu de :
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const sessionApi = axios.create({
  baseURL: `${API_URL}/api`,
})

// Utilisez :
const getApiBaseUrl = () => {
  // Si NEXT_PUBLIC_API_URL est défini, utilisez-le
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  // Sinon, utilisez l'URL actuelle du navigateur (fonctionne avec ngrok)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Fallback pour SSR
  return 'http://localhost:3000'
}

const sessionApi = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
})
```

### Option 2 : Configuration simple (recommandée pour commencer)

Pour tester rapidement, configurez simplement :

```env
# frontend/.env.local
BACKEND_INTERNAL_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=
```

Et modifiez temporairement un service pour tester avec une URL relative :

```typescript
// Test : utiliser directement /api (URL relative)
const sessionApi = axios.create({
  baseURL: '/api',  // URL relative - fonctionne avec n'importe quelle origine
})
```

Cette URL relative (`/api`) fonctionnera automatiquement avec :
- `http://localhost:3000` en local
- `https://abc123.ngrok-free.app` via ngrok

Le proxy Next.js intercepte `/api/...` et le route vers le backend local.

## 🚀 Workflow complet

1. **Démarrer le backend** :
   ```bash
   cd backend
   python run.py
   ```

2. **Démarrer le frontend** :
   ```bash
   cd frontend
   pnpm run dev
   ```

3. **Exposer le frontend via ngrok** :
   ```bash
   ngrok http 3000
   ```

4. **Accéder à l'application** :
   - URL ngrok : `https://abc123.ngrok-free.app`
   - Le frontend charge depuis ngrok
   - Les requêtes API passent par le proxy Next.js vers le backend local

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Accédez à l'URL ngrok
2. Ouvrez les DevTools (F12) → Network
3. Vérifiez que les requêtes API vont vers `/api/...` (proxy Next.js)
4. Vérifiez que les données se chargent correctement

