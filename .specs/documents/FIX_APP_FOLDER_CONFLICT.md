# 🔧 FIX: Conflit de dossiers app/

## ❌ PROBLÈME IDENTIFIÉ

Votre projet a **DEUX dossiers app/** en conflit:
```
frontend/
  ├── app/                    ❌ CONFLIT (ne devrait pas exister)
  │   └── (auth)/
  │       ├── login/
  │       └── register/
  └── src/
      └── app/                ✅ BON (utilisé par le projet)
          ├── admin/
          ├── dashboard/
          └── ...
```

**Next.js cherche les routes dans `app/` à la racine, pas dans `src/app/`!**

C'est pourquoi `/admin` donne 404 - Next.js ne voit pas `src/app/admin/`.

## ✅ SOLUTION

### Étape 1: Arrêter le serveur
Dans le terminal frontend, faites: **Ctrl+C**

### Étape 2: Supprimer le dossier app/ à la racine
```powershell
cd frontend
Remove-Item -Recurse -Force app
```

OU si vous voulez un backup:
```powershell
cd frontend
Rename-Item app app.OLD.backup
```

### Étape 3: Vérifier tsconfig.json

Ouvrir `frontend/tsconfig.json` et vérifier que les chemins pointent vers `src`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Étape 4: Nettoyer le cache
```powershell
cd frontend
Remove-Item -Recurse -Force .next, .turbo
```

### Étape 5: Redémarrer
```powershell
pnpm dev
```

### Étape 6: Tester
Allez sur: **http://localhost:3000/admin**

Vous devriez maintenant voir la page! ✅

## Vérification de la Structure Finale

Après ces étapes, votre structure devrait être:

```
frontend/
  ├── src/
  │   └── app/                ✅ Seul dossier app/
  │       ├── admin/
  │       │   ├── layout.tsx
  │       │   ├── page.tsx
  │       │   └── users/
  │       │       └── page.tsx
  │       ├── (auth)/
  │       │   ├── login/
  │       │   └── register/
  │       ├── dashboard/
  │       ├── layout.tsx
  │       └── page.tsx
  ├── middleware.ts
  └── next.config.js
```

## Si le problème persiste

### Option A: Déplacer tout dans app/ à la racine

Si vous préférez utiliser `app/` à la racine au lieu de `src/app/`:

1. Déplacer tout de `src/app/` vers `app/`
2. Mettre à jour `tsconfig.json` et `next.config.js`
3. Supprimer le dossier `src/`

### Option B: Utiliser src/ (RECOMMANDÉ - c'est votre config actuelle)

Supprimer `app/` à la racine et garder tout dans `src/`.

---

## Commandes Rapides (Copier-Coller)

```powershell
# ARRÊTER LE SERVEUR FRONTEND D'ABORD (Ctrl+C)

cd frontend

# Supprimer le dossier app/ en conflit
Remove-Item -Recurse -Force app

# Nettoyer le cache
Remove-Item -Recurse -Force .next, .turbo

# Redémarrer
pnpm dev

# Tester: http://localhost:3000/admin
```

C'est tout! 🎉


