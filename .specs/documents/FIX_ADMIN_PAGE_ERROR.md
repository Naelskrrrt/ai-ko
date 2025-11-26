# Résolution: PageNotFoundError /admin/page

## Cause du problème

L'erreur `PageNotFoundError: Cannot find module for page: route not found /admin/page` est causée par le cache de Next.js/Turbopack qui n'a pas détecté les nouveaux fichiers créés.

## Solution (3 méthodes)

### ✅ Méthode 1: Script automatique (RECOMMANDÉ)

```powershell
cd frontend
.\fix-cache.ps1
```

Puis redémarrer:
```powershell
pnpm dev
```

### ✅ Méthode 2: Nettoyage manuel

```powershell
cd frontend

# Arrêter le serveur (Ctrl+C dans le terminal)

# Supprimer les caches
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Redémarrer
pnpm dev
```

### ✅ Méthode 3: Nettoyage complet (si les méthodes 1 et 2 ne fonctionnent pas)

```powershell
cd frontend

# Arrêter le serveur

# Supprimer TOUT
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force .turbo
Remove-Item -Recurse -Force node_modules

# Réinstaller
pnpm install

# Redémarrer
pnpm dev
```

## Vérification

Une fois le serveur redémarré:

1. Ouvrir http://localhost:3000/login
2. Se connecter avec `admin@test.com` / `admin123`
3. Vous devriez être redirigé vers `/admin`
4. Le dashboard admin devrait s'afficher correctement

## Autres solutions si le problème persiste

### 1. Vérifier la structure des fichiers

```powershell
cd frontend
Get-ChildItem -Path src\app\admin -Recurse
```

Vous devriez voir:
```
src\app\admin\
  - layout.tsx
  - page.tsx
  - users\
    - page.tsx
```

### 2. Vérifier les imports

Dans `frontend/src/app/admin/page.tsx`, vérifier que tous les imports sont corrects:

```typescript
import { adminService } from "@/shared/services/api/admin.service";
import type { DashboardStats } from "@/shared/types/admin.types";
```

### 3. Utiliser le mode sans Turbopack (temporaire)

Si Turbopack cause des problèmes, démarrer sans:

```powershell
cd frontend
pnpm next dev
# au lieu de: pnpm dev (qui utilise --turbopack)
```

### 4. Créer un nouveau fichier temporaire

Si le problème persiste, essayer de renommer temporairement:

```powershell
cd frontend\src\app\admin
Rename-Item page.tsx page.tsx.backup
# Attendre 2 secondes
Rename-Item page.tsx.backup page.tsx
```

Cela force Next.js à re-détecter le fichier.

## Explication technique

Next.js 15 avec Turbopack utilise un système de cache agressif pour améliorer les performances. Parfois, quand de nouveaux fichiers sont créés programmatiquement (par un script ou un assistant IA), le système de cache ne détecte pas immédiatement les changements.

Le nettoyage des dossiers `.next`, `.turbo` et `node_modules/.cache` force Next.js à reconstruire complètement l'index des routes.

## Prévention future

Pour éviter ce problème à l'avenir:

1. **Redémarrer le serveur** après avoir créé de nouveaux fichiers de page
2. **Utiliser le hot reload**: modifier un fichier existant force une recompilation
3. **Nettoyer régulièrement**: `Remove-Item .next -Recurse -Force` avant de redémarrer

## Support

Si le problème persiste après toutes ces étapes:

1. Vérifier les logs du terminal pour d'autres erreurs
2. Vérifier la console du navigateur (F12)
3. Essayer de créer un fichier simple pour tester:

```typescript
// frontend/src/app/admin/test/page.tsx
export default function TestPage() {
  return <div>Test Page</div>
}
```

Si `/admin/test` fonctionne mais pas `/admin`, le problème vient du fichier `page.tsx` lui-même.

## Résumé rapide

```powershell
# SOLUTION RAPIDE
cd frontend
Remove-Item -Recurse -Force .next, .turbo
pnpm dev
```

Puis aller sur http://localhost:3000/login et se connecter avec admin@test.com / admin123


