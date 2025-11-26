# 🔧 Guide de Débogage - Switch Status

## ❓ Problème
Le switch de statut ne fonctionne pas - aucune requête n'est envoyée au backend.

## ✅ Corrections Apportées

### 1. **Logs de Débogage Ajoutés**

#### Frontend (`page.tsx`)
- ✅ Logs dans `handleToggleStatus()` pour tracer l'exécution
- ✅ Affichage des erreurs détaillées dans la console

#### Services API (`admin.service.ts` & `auth.service.ts`)
- ✅ Logs des requêtes (URL, méthode, token)
- ✅ Logs des réponses et erreurs
- ✅ Détection de la source du token (cookie vs localStorage)

### 2. **Support Double Token**

Le système cherche maintenant le token d'authentification dans **2 endroits** :
1. **Cookies** : `auth_token`
2. **LocalStorage** : `auth_token`

Ceci résout le problème de coexistence de deux systèmes d'authentification.

---

## 🔍 Comment Déboguer

### Étape 1 : Ouvrir la Console du Navigateur

1. Appuyez sur **F12** (Chrome/Firefox) ou **Cmd+Option+I** (Mac)
2. Allez dans l'onglet **Console**

### Étape 2 : Rafraîchir la Page `/admin/users`

Vous devriez voir des logs comme :

```
🔑 Request interceptor: {
  url: '/users',
  method: 'get',
  hasToken: true,
  tokenSource: 'cookie',
  token: 'eyJhbGciOiJIUzI1NiIs...'
}
```

**✅ Si `hasToken: true`** → Le token est présent, on peut passer à l'étape suivante

**❌ Si `hasToken: false`** → Problème d'authentification (voir section "Problèmes Courants")

### Étape 3 : Cliquer sur le Switch

Vous devriez voir :

```
🔄 Toggle status clicked for user: test abc123-user-id
⏳ Sending request to toggle status...
🔑 Request interceptor: {
  url: '/users/abc123-user-id/status',
  method: 'patch',
  hasToken: true,
  tokenSource: 'cookie',
  token: 'eyJhbGciOiJIUzI1NiIs...'
}
✅ API Response: {
  url: '/users/abc123-user-id/status',
  status: 200,
  data: { id: 'abc123', emailVerified: true, ... }
}
✅ Toggle status response: { id: 'abc123', emailVerified: true, ... }
```

### Étape 4 : Analyser les Logs

#### ✅ **Succès** - Vous voyez :
- `🔄 Toggle status clicked` → Le switch a été cliqué
- `⏳ Sending request` → La requête est envoyée
- `🔑 Request interceptor` → Le token est ajouté
- `✅ API Response` → Le backend a répondu
- `✅ Toggle status response` → Le statut a été changé

#### ❌ **Erreur** - Vous voyez :
- `❌ Cannot toggle own status` → Vous essayez de changer votre propre statut (normal)
- `❌ Toggle status error` → Erreur du backend
- `❌ API Error` → Problème de communication avec l'API

---

## 🚨 Problèmes Courants

### Problème 1 : Pas de Token (`hasToken: false`)

**Symptômes :**
```
⚠️ No auth token found in cookies OR localStorage
Available cookies: (vide ou sans auth_token)
```

**Solution :**
1. Vous n'êtes pas connecté → Allez sur `/login`
2. Le token a expiré → Reconnectez-vous
3. Vérifiez dans la console :
   ```javascript
   // Dans la console du navigateur
   console.log('Cookies:', document.cookie);
   console.log('LocalStorage:', localStorage.getItem('auth_token'));
   ```

### Problème 2 : Erreur 401 (Non Autorisé)

**Symptômes :**
```
❌ API Error: { status: 401, data: { message: 'Token invalide' } }
```

**Solution :**
- Le token est expiré ou invalide
- Reconnectez-vous : `/login`

### Problème 3 : Erreur 403 (Forbidden)

**Symptômes :**
```
❌ API Error: { status: 403, data: { message: 'Accès refusé' } }
```

**Solution :**
- Vous n'êtes pas admin
- Vérifiez votre rôle :
  ```javascript
  // Dans la console
  console.log('User:', JSON.parse(localStorage.getItem('auth_user') || '{}'));
  ```

### Problème 4 : Erreur 500 (Erreur Serveur)

**Symptômes :**
```
❌ API Error: { status: 500, data: { message: 'Erreur interne' } }
```

**Solution :**
- Problème côté backend
- Vérifiez les logs du serveur Flask :
  ```bash
  cd backend
  python run.py
  ```

### Problème 5 : Rien ne se Passe (Pas de Logs)

**Symptômes :**
- Aucun log dans la console après avoir cliqué sur le switch

**Solution :**
1. Le switch est désactivé → Vérifiez si c'est votre propre compte
2. Problème de chargement du composant → Rechargez la page (Ctrl+F5)
3. Vérifiez dans la console :
   ```javascript
   // Dans la console
   console.log('Switch disabled?', document.querySelector('[aria-label*="utilisateur"]')?.getAttribute('disabled'));
   ```

---

## 🔬 Tests Avancés

### Test 1 : Vérifier l'Endpoint Backend Directement

```bash
# Dans le terminal
curl -X PATCH \
  http://localhost:5000/api/admin/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 2 : Vérifier les Utilisateurs

```javascript
// Dans la console du navigateur
fetch('http://localhost:5000/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || document.cookie.split('auth_token=')[1]?.split(';')[0]}`
  }
})
  .then(r => r.json())
  .then(data => console.log('Users:', data));
```

### Test 3 : Forcer un Toggle

```javascript
// Dans la console du navigateur
const userId = 'abc123-user-id'; // Remplacer par un vrai ID
const token = localStorage.getItem('auth_token') || document.cookie.split('auth_token=')[1]?.split(';')[0];

fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(data => console.log('Result:', data))
  .catch(err => console.error('Error:', err));
```

---

## 📊 Checklist de Vérification

Avant de signaler un bug, vérifiez :

- [ ] Je suis connecté en tant qu'**admin**
- [ ] Le backend Flask est **démarré** (`python run.py`)
- [ ] La page est **rafraîchie** (Ctrl+F5)
- [ ] J'ai **ouvert la console** du navigateur (F12)
- [ ] Je vois les logs `🔑 Request interceptor` avec `hasToken: true`
- [ ] Je ne clique PAS sur mon propre compte
- [ ] Le switch n'est PAS grisé (désactivé)
- [ ] J'ai vérifié les **logs de la console** pour voir l'erreur exacte

---

## 📝 Informations à Fournir en Cas de Bug

Si le problème persiste, fournissez :

1. **Screenshot de la console** avec tous les logs
2. **Votre rôle** : admin / enseignant / étudiant ?
3. **Token présent ?** : `hasToken: true` ou `false` ?
4. **Erreur exacte** : Code HTTP + message
5. **Navigateur** : Chrome / Firefox / Safari ?
6. **Actions effectuées** : Décrivez étape par étape

---

## ✅ Si Tout Fonctionne

Vous devriez voir :
1. ✅ Logs dans la console
2. ✅ Switch change visuellement
3. ✅ Toast "Succès" affiché
4. ✅ Statut mis à jour dans la table

**Si oui, supprimez les logs de débogage en production !**

---

**Dernière mise à jour :** 22 novembre 2025

