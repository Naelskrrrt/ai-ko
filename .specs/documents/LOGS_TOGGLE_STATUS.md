# 📋 Documentation des Logs - Toggle Status Utilisateur

## 🎯 Objectif

Ce document décrit tous les logs ajoutés pour tracer le flux complet de modification du statut d'un utilisateur (activation/désactivation) via le switch admin.

---

## 📊 Vue d'ensemble du flux

```
[FRONTEND] UsersPage.tsx (handleToggleStatus)
    ↓
[FRONTEND] admin.service.ts (toggleUserStatus)
    ↓ HTTP PATCH /api/admin/users/{id}/status
[BACKEND] admin.py (toggle_user_status endpoint)
    ↓
[BACKEND] user_service.py (toggle_status)
    ↓
[BACKEND] user_repository.py (toggle_status)
    ↓
[BACKEND] user.py (to_dict)
    ↑
[BACKEND] Retour de la réponse JSON
    ↑
[FRONTEND] Traitement de la réponse
```

---

## 🔍 Logs Frontend

### 1. **UsersPage.tsx - handleToggleStatus**

**Localisation:** `frontend/src/app/admin/users/page.tsx:231-317`

**Logs au début de la fonction:**
```javascript
console.log("\n" + "=".repeat(80));
console.log("[FRONTEND TOGGLE STATUS] Début de la requête");
console.log("=".repeat(80));
console.log("[FRONTEND] User cliqué:", {
  id: user.id,
  name: user.name,
  email: user.email,
  currentStatus: user.isActive,
  role: user.role,
});
console.log("[FRONTEND] Timestamp:", new Date().toISOString());
```

**Logs avant l'appel API:**
```javascript
console.log("[FRONTEND] Ancien statut:", oldStatus ? "actif" : "inactif");
console.log("[FRONTEND] Statut attendu:", !oldStatus ? "actif" : "inactif");
console.log("[FRONTEND] 📤 Envoi de la requête PATCH...");
console.log("[FRONTEND] URL:", `/api/admin/users/${user.id}/status`);
```

**Logs en cas de succès:**
```javascript
console.log("[FRONTEND] ✓ Réponse reçue en", (endTime - startTime), "ms");
console.log("[FRONTEND] Réponse complète:", JSON.stringify(result, null, 2));
console.log("[FRONTEND] Nouveau statut dans la réponse:", result.isActive);
console.log("[FRONTEND] ✓ Toggle réussi:", oldStatus, "→", newStatus);
console.log("[FRONTEND] 🔄 Rafraîchissement des données (mutate)...");
```

**Logs en cas d'erreur:**
```javascript
console.error("[FRONTEND] ✗ ERREUR lors du toggle");
console.error("[FRONTEND] Type d'erreur:", error.constructor.name);
console.error("[FRONTEND] Message:", error.message);
console.error("[FRONTEND] Status HTTP:", error.response?.status);
console.error("[FRONTEND] Données de la réponse:", error.response?.data);
console.error("[FRONTEND] Headers de la réponse:", error.response?.headers);
console.error("[FRONTEND] Config de la requête:", error.config);
console.error("[FRONTEND] Erreur complète:", error);
```

---

### 2. **admin.service.ts - toggleUserStatus**

**Localisation:** `frontend/src/shared/services/api/admin.service.ts:155-185`

**Logs au début:**
```javascript
console.log('📤 [admin.service] toggleUserStatus - Début', {
  userId: id,
  timestamp: new Date().toISOString(),
  endpoint: `/users/${id}/status`
});
```

**Logs en cas de succès:**
```javascript
console.log('✅ [admin.service] toggleUserStatus - Réponse reçue', {
  userId: id,
  status: response.status,
  statusText: response.statusText,
  headers: response.headers,
  data: response.data,
  timestamp: new Date().toISOString()
});
```

**Logs en cas d'erreur:**
```javascript
console.error('❌ [admin.service] toggleUserStatus - Erreur', {
  userId: id,
  error: error.message,
  response: error.response?.data,
  status: error.response?.status,
  statusText: error.response?.statusText,
  timestamp: new Date().toISOString()
});
```

---

## 🔍 Logs Backend

### 3. **admin.py - toggle_user_status (Endpoint)**

**Localisation:** `backend/app/api/admin.py:228-265`

**Logs au début de la requête:**
```python
print(f"\n{'='*80}")
print(f"[TOGGLE STATUS] Début de la requête")
print(f"{'='*80}")
print(f"[TOGGLE STATUS] Admin demandeur: {current_user.email} (ID: {current_user.id})")
print(f"[TOGGLE STATUS] User cible: {user_id}")
print(f"[TOGGLE STATUS] Timestamp: {datetime.utcnow().isoformat()}")
```

**Logs avant l'appel au service:**
```python
print(f"[TOGGLE STATUS] Appel du service toggle_status...")
```

**Logs en cas de succès:**
```python
print(f"[TOGGLE STATUS] ✓ Succès du toggle")
print(f"[TOGGLE STATUS] Nouveau statut: is_active={user_dict.get('isActive')}")
print(f"[TOGGLE STATUS] User email: {user_dict.get('email')}")
print(f"[TOGGLE STATUS] Response data: {user_dict}")
print(f"{'='*80}\n")
```

**Logs en cas d'erreur:**
```python
# ValueError (400)
print(f"[TOGGLE STATUS] ✗ Erreur de validation: {str(e)}")

# Exception générale (500)
print(f"[TOGGLE STATUS] ✗ ERREUR CRITIQUE")
print(f"[TOGGLE STATUS] Exception: {str(e)}")
print(f"[TOGGLE STATUS] Traceback complet:")
print(traceback.format_exc())
```

---

### 4. **user_service.py - toggle_status**

**Localisation:** `backend/app/services/user_service.py:180-211`

**Logs au début:**
```python
print(f"[SERVICE toggle_status] Début - user_id={user_id}, current_user_id={current_user_id}")
```

**Logs de validation:**
```python
# En cas d'auto-modification
print(f"[SERVICE toggle_status] ✗ Validation échouée: tentative de se désactiver soi-même")

# Appel du repository
print(f"[SERVICE toggle_status] Appel du repository...")

# Utilisateur non trouvé
print(f"[SERVICE toggle_status] ✗ Utilisateur non trouvé: {user_id}")
```

**Logs de succès:**
```python
print(f"[SERVICE toggle_status] ✓ User trouvé: {user.email}")
print(f"[SERVICE toggle_status] Nouveau statut: is_active={user.is_active}")
print(f"[SERVICE toggle_status] ✓ Conversion en dict réussie")
```

---

### 5. **user_repository.py - toggle_status**

**Localisation:** `backend/app/repositories/user_repository.py:100-125`

**Logs de recherche:**
```python
print(f"[REPO toggle_status] Recherche de l'utilisateur: {user_id}")
```

**Logs en cas d'utilisateur non trouvé:**
```python
print(f"[REPO toggle_status] ✗ Utilisateur non trouvé: {user_id}")
```

**Logs de mise à jour:**
```python
print(f"[REPO toggle_status] User trouvé: {user.email}")
print(f"[REPO toggle_status] Statut actuel: is_active={old_status}")
print(f"[REPO toggle_status] Nouveau statut: is_active={new_status}")
print(f"[REPO toggle_status] Mise à jour en base de données...")
print(f"[REPO toggle_status] ✓ Mise à jour réussie")
print(f"[REPO toggle_status] Vérification: is_active={updated_user.is_active}")
```

---

### 6. **user.py - to_dict (Modèle)**

**Localisation:** `backend/app/models/user.py:100-148`

**Logs de conversion:**
```python
print(f"[MODEL to_dict] Début de la conversion pour user: {getattr(self, 'id', 'ID_MANQUANT')}")

print(f"[MODEL to_dict] Vérification des attributs:")
print(f"  - id: {getattr(self, 'id', 'MISSING')}")
print(f"  - email: {getattr(self, 'email', 'MISSING')}")
print(f"  - name: {getattr(self, 'name', 'MISSING')}")
print(f"  - is_active: {getattr(self, 'is_active', 'MISSING')}")
print(f"  - email_verified: {getattr(self, 'email_verified', 'MISSING')}")

print(f"[MODEL to_dict] ✓ Conversion réussie")
print(f"[MODEL to_dict] Dict créé avec {len(data)} clés")
print(f"[MODEL to_dict] Aperçu: id={data.get('id')}, email={data.get('email')}, isActive={data.get('isActive')}")
```

---

## 🧪 Comment tester

### 1. Ouvrir les consoles

**Frontend:**
- Ouvrir la console du navigateur (F12 → Console)
- Filtrer sur `[FRONTEND]` ou `[admin.service]`

**Backend:**
- Regarder le terminal où le serveur Flask tourne
- Les logs s'afficheront automatiquement

### 2. Effectuer un toggle

1. Se connecter en tant qu'admin
2. Aller sur `/admin/users`
3. Cliquer sur le switch de statut d'un utilisateur
4. Observer les logs dans les deux consoles

### 3. Exemple de sortie attendue

**Console navigateur:**
```
================================================================================
[FRONTEND TOGGLE STATUS] Début de la requête
================================================================================
[FRONTEND] User cliqué: { id: "abc-123", name: "Test User", ... }
...
📤 [admin.service] toggleUserStatus - Début
...
✅ [admin.service] toggleUserStatus - Réponse reçue
...
[FRONTEND] ✓ Toggle réussi: true → false
```

**Terminal backend:**
```
================================================================================
[TOGGLE STATUS] Début de la requête
================================================================================
[TOGGLE STATUS] Admin demandeur: admin@test.com (ID: xyz-789)
...
[SERVICE toggle_status] Début - user_id=abc-123
[REPO toggle_status] Recherche de l'utilisateur: abc-123
[REPO toggle_status] Statut actuel: is_active=True
[REPO toggle_status] Nouveau statut: is_active=False
[MODEL to_dict] ✓ Conversion réussie
...
[TOGGLE STATUS] ✓ Succès du toggle
```

---

## 🎯 Points à vérifier dans les logs

### ✅ Flux normal (succès)

1. **Frontend** envoie la requête avec le bon user ID
2. **Endpoint** reçoit la requête avec un admin valide
3. **Service** valide que l'admin ne se modifie pas lui-même
4. **Repository** trouve l'utilisateur et change son statut
5. **Modèle** convertit correctement en dictionnaire
6. **Endpoint** renvoie le bon JSON
7. **Frontend** reçoit la réponse et rafraîchit l'UI

### ❌ Cas d'erreur à surveiller

1. **Utilisateur non trouvé**: Logs `[REPO]` et `[SERVICE]` montrent "non trouvé"
2. **Auto-modification**: Logs `[SERVICE]` montrent "tentative de se désactiver soi-même"
3. **Erreur de conversion**: Logs `[MODEL]` montrent des attributs `MISSING`
4. **Erreur HTTP**: Frontend montre status 400, 403, 404, ou 500
5. **Erreur réseau**: Frontend montre "pas de réponse"

---

## 📝 Notes importantes

- Les logs utilisent des préfixes clairs: `[FRONTEND]`, `[TOGGLE STATUS]`, `[SERVICE]`, `[REPO]`, `[MODEL]`
- Les symboles facilitent la lecture: `✓` (succès), `✗` (erreur), `🔄` (en cours), `📤` (envoi), `📦` (réception)
- Les séparateurs `====` délimitent clairement chaque requête
- Les timestamps permettent de mesurer les performances
- Tous les objets importants sont loggés en détail

---

**Date de création:** 2 décembre 2025  
**Dernière mise à jour:** 2 décembre 2025
