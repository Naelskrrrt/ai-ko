# 🔍 Debug: Erreur 404 sur /admin

## Diagnostic Étape par Étape

### Étape 1: Tester la route simple

1. **Redémarrez le serveur** (important!):
   ```powershell
   # Dans le terminal du frontend, Ctrl+C puis:
   cd frontend
   pnpm dev
   ```

2. **Testez la route de test**:
   - Allez sur: http://localhost:3000/admin/test
   - **Si vous voyez "Test Page - Admin Route Works!"** → La route fonctionne!
   - **Si 404** → Problème de configuration Next.js

### Étape 2: Vérifier l'authentification

1. **Ouvrez la console du navigateur** (F12)

2. **Allez sur**: http://localhost:3000/admin

3. **Regardez les logs** dans la console:
   - Vous devriez voir: `[AdminLayout] Debug: { user: ..., loading: ..., isAdmin: ... }`
   
4. **Analysez les logs**:
   - Si `loading: true` → Le système attend l'authentification
   - Si `user: null` → Vous n'êtes pas connecté
   - Si `isAdmin: false` → Vous n'êtes pas admin

### Étape 3: Se connecter en tant qu'admin

Si vous n'êtes pas connecté ou pas admin:

1. **Allez sur**: http://localhost:3000/login

2. **Connectez-vous avec**:
   - Email: `admin@test.com`
   - Mot de passe: `admin123`

3. **Vérifiez la redirection**:
   - Après login, vous devriez être redirigé vers `/admin` automatiquement

### Étape 4: Vérifier le backend

Si vous êtes connecté mais la page ne charge pas:

1. **Vérifiez que le backend tourne**:
   ```powershell
   # Dans un autre terminal
   cd backend
   .\venv\Scripts\activate
   python run.py
   ```

2. **Testez l'API**:
   - Ouvrez: http://localhost:5000/api/health
   - Vous devriez voir une réponse JSON

### Étape 5: Vérifier les fichiers

```powershell
# Depuis la racine du projet
ls frontend/src/app/admin/
```

Vous devriez voir:
```
layout.tsx
page.tsx
page-simple.tsx
test/
  page.tsx
users/
  page.tsx
```

### Étape 6: Tester avec la page simplifiée

Temporairement, remplacez la page admin par la version simple:

1. **Renommez les fichiers**:
   ```powershell
   cd frontend/src/app/admin
   Rename-Item page.tsx page-complex.tsx.bak
   Rename-Item page-simple.tsx page.tsx
   ```

2. **Redémarrez le serveur**

3. **Testez**: http://localhost:3000/admin
   - Si ça fonctionne → Le problème vient du code de la page complexe (API calls)
   - Si ça ne fonctionne pas → Le problème vient du layout ou de l'auth

## Solutions par Scénario

### Scénario A: 404 même sur /admin/test
**Problème**: Next.js ne détecte pas les routes

**Solution**:
```powershell
cd frontend
Remove-Item -Recurse -Force .next, .turbo, node_modules
pnpm install
pnpm dev
```

### Scénario B: /admin/test fonctionne mais pas /admin
**Problème**: Erreur dans page.tsx ou layout.tsx

**Solution**: Vérifier les logs de la console navigateur et du terminal

### Scénario C: Redirection infinie ou page blanche
**Problème**: Authentification ou permissions

**Solutions**:
1. Vérifier que vous êtes connecté (cookie auth_token dans DevTools > Application > Cookies)
2. Vérifier le rôle de l'utilisateur (console logs)
3. Vérifier que le backend est démarré

### Scénario D: Erreur API lors du chargement
**Problème**: Le backend ne répond pas ou CORS

**Solutions**:
1. Vérifier que le backend tourne sur port 5000
2. Vérifier les logs du backend
3. Vérifier le fichier `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

## Commandes de Dépannage Rapide

### Reset complet
```powershell
# Terminal 1: Backend
cd backend
.\venv\Scripts\activate
python run.py

# Terminal 2: Frontend (nouveau terminal)
cd frontend
Remove-Item -Recurse -Force .next, .turbo
pnpm dev

# Attendre le build, puis:
# Browser: http://localhost:3000/login
# Se connecter: admin@test.com / admin123
# Aller sur: http://localhost:3000/admin
```

### Logs détaillés
```powershell
# Dans le terminal frontend, avant de démarrer:
$env:DEBUG="*"
pnpm dev
```

## Checklist de Vérification

- [ ] Backend tourne sur http://localhost:5000
- [ ] Frontend tourne sur http://localhost:3000
- [ ] Cache .next supprimé
- [ ] node_modules à jour (pnpm install)
- [ ] Fichiers admin/page.tsx et admin/layout.tsx existent
- [ ] Connecté avec admin@test.com / admin123
- [ ] Cookie auth_token présent dans le navigateur
- [ ] Console navigateur ouverte (F12) pour voir les logs
- [ ] Pas d'erreurs dans le terminal frontend
- [ ] Pas d'erreurs dans le terminal backend

## Résultat Attendu

Après avoir suivi ces étapes, vous devriez:
1. ✅ Pouvoir accéder à http://localhost:3000/admin/test
2. ✅ Voir les logs `[AdminLayout] Debug` dans la console
3. ✅ Accéder à http://localhost:3000/admin après login
4. ✅ Voir le dashboard admin avec les statistiques

---

**Que faire ensuite?**

Une fois que vous avez identifié le problème avec ces tests, partagez:
1. Quelle étape a échoué
2. Les logs de la console navigateur
3. Les logs du terminal frontend
4. Les logs du terminal backend (si applicable)


