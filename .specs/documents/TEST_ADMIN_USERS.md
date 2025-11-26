# 🧪 Guide de Test - Gestion des Utilisateurs Admin

## ✅ Fonctionnalités Implémentées

### 1. ✨ Sous-menu de Changement de Rôle
### 2. 🔒 Protection de l'Utilisateur Connecté  
### 3. 🎨 Affichage du Statut Amélioré

---

## 🚀 Comment Tester

### Prérequis

1. **Backend démarré**:
```powershell
cd backend
.\venv\Scripts\activate
python run.py
```

2. **Frontend démarré**:
```powershell
cd frontend
pnpm dev
```

3. **Utilisateurs de test créés**:
```powershell
cd backend
python create_test_users.py
```

---

## 🧪 Test 1: Sous-menu de Changement de Rôle

### Étapes:

1. **Allez sur**: http://localhost:3000/login
2. **Connectez-vous**: `admin@test.com` / `admin123`
3. **Allez sur**: http://localhost:3000/admin/users
4. **Trouvez** un utilisateur (ex: `test` ou `etudiant1@test.com`)
5. **Cliquez** sur le bouton ⋮ (trois points)
6. **Cliquez** sur "Changer rôle"

### ✅ Résultat Attendu:

- Un **sous-menu s'affiche** immédiatement à côté
- Le sous-menu affiche **3 options**:
  ```
  🛡️  Admin
  🎓  Enseignant
  👤  Étudiant
  ```
- Le **rôle actuel** est surligné (fond gris clair)
- Les icônes sont **colorées** selon le rôle

### Continuez:

7. **Cliquez** sur un rôle différent (ex: "Enseignant")

### ✅ Résultat Attendu:

- Les **deux menus se ferment** instantanément
- Un **toast de succès** apparaît en haut à droite: "Rôle de [nom] changé en enseignant"
- La **table se rafraîchit** automatiquement
- Le nouveau **badge de rôle** est affiché dans le tableau
- **Aucun rechargement** de page

---

## 🧪 Test 2: Protection de l'Utilisateur Connecté

### Étapes:

1. **Restez connecté** en tant qu'admin (`admin@test.com`)
2. **Allez sur**: http://localhost:3000/admin/users
3. **Trouvez votre propre ligne** (email: admin@test.com)
4. **Regardez** le bouton actions (⋮)

### ✅ Résultat Attendu:

- Le bouton ⋮ est **grisé** (désactivé)
- Le curseur affiche **"not-allowed"** au survol
- Un **tooltip** apparaît: "Vous ne pouvez pas modifier votre propre compte"
- Le bouton **ne réagit pas** au clic

### Vérification Avancée:

5. **Ouvrez la console** du navigateur (F12)
6. **Essayez de cliquer** sur le bouton grisé
7. **Vérifiez** qu'aucune action ne se produit

### ❌ Actions Bloquées:

- Éditer vos propres informations
- Activer/Désactiver votre compte
- Changer votre propre rôle
- Supprimer votre compte

---

## 🧪 Test 3: Affichage du Statut

### Étapes:

1. **Allez sur**: http://localhost:3000/admin/users
2. **Regardez** la colonne "Status"

### ✅ Résultat Attendu:

Pour chaque utilisateur:

| Statut | Badge | Couleur | Style |
|--------|-------|---------|-------|
| Actif | "Actif" | Vert (success) | Fond coloré (flat) |
| Inactif | "Inactif" | Gris (default) | Bordure seule (bordered) |

### Vérification Visuelle:

**Utilisateurs Actifs**:
```
┌─────────┐
│  Actif  │  ← Badge vert avec fond
└─────────┘
```

**Utilisateurs Inactifs**:
```
┌─────────┐
│ Inactif │  ← Badge gris avec bordure
└─────────┘
```

---

## 🧪 Test 4: Scénario Complet

### Scénario: Changer le rôle d'un étudiant en enseignant

1. **Connexion**: admin@test.com / admin123
2. **Navigation**: /admin/users
3. **Filtrage**: Sélectionner "Étudiant" dans le filtre "Rôle"
4. **Sélection**: Trouver "etudiant1@test.com"
5. **Action**: Cliquer sur ⋮ → "Changer rôle"
6. **Choix**: Cliquer sur "🎓 Enseignant"
7. **Vérification 1**: Toast de succès apparaît
8. **Vérification 2**: Le badge passe de violet (étudiant) à bleu (enseignant)
9. **Vérification 3**: Changer le filtre sur "Enseignant"
10. **Vérification 4**: L'utilisateur apparaît dans la liste

### ✅ Résultat Final:

- etudiant1@test.com a maintenant le rôle "enseignant"
- Le badge est bleu
- L'utilisateur apparaît dans le filtre "Enseignant"
- Toutes les actions se sont faites sans rechargement de page

---

## 🐛 Cas de Test Négatifs

### Test 1: Clic en Dehors du Menu

1. Ouvrir le menu de changement de rôle
2. **Cliquer en dehors** du menu
3. ✅ Le menu **se ferme**

### Test 2: Échap pour Fermer

1. Ouvrir le menu de changement de rôle
2. **Appuyer sur Échap**
3. ✅ Le menu **se ferme**

### Test 3: Changer vers le Même Rôle

1. Ouvrir le menu sur un admin
2. Cliquer sur "🛡️ Admin" (même rôle)
3. ✅ Toast de succès (même si c'est le même rôle)
4. ✅ Les menus se ferment
5. ✅ Pas d'erreur

### Test 4: Utilisateur Connecté Vérifié

1. Se connecter avec prof1@test.com
2. Aller sur /admin/users (si accès autorisé)
3. ✅ Le bouton ⋮ pour prof1@test.com est grisé

---

## 📸 Captures d'Écran Attendues

### 1. Menu de Changement de Rôle Ouvert
```
┌──────────────────────┐
│ ⋮                    │ ← Bouton actions
├──────────────────────┤
│ ✏️ Éditer            │
│ 👤 Activer           │
│ 🔧 Changer rôle   ►  │ ← Survol
│ 🗑️ Supprimer         │
└──────────────────────┘
        │
        └─► ┌────────────────────┐
            │ Changer le rôle    │
            ├────────────────────┤
            │ 🛡️  Admin          │
            │ 🎓  Enseignant     │ ← Surligné
            │ 👤  Étudiant       │
            └────────────────────┘
```

### 2. Utilisateur Connecté (Bouton Désactivé)
```
┌─────────────────────────────────────────────────┐
│ Utilisateur | Email            | Rôle  | Actions│
├─────────────────────────────────────────────────┤
│ Admin User  | admin@test.com   | Admin | ⋮ (grisé) │
│ Test User   | test@test.com    | Étud. | ⋮         │
└─────────────────────────────────────────────────┘
```

### 3. Badges de Statut
```
Actif:    [  Actif  ]  ← Vert, fond coloré
Inactif:  [ Inactif ]  ← Gris, bordure
```

---

## ✅ Checklist de Validation

### Fonctionnalités
- [ ] Le sous-menu de rôle s'affiche correctement
- [ ] Les 3 rôles sont visibles avec icônes
- [ ] Le rôle actuel est surligné
- [ ] Clic sur un rôle change le rôle
- [ ] Les menus se ferment après sélection
- [ ] Toast de succès apparaît
- [ ] Les données se rafraîchissent

### Protection
- [ ] Le bouton est grisé pour l'utilisateur connecté
- [ ] Le tooltip apparaît au survol
- [ ] Le clic ne fait rien
- [ ] Aucune erreur console

### Statut
- [ ] Badge vert pour actif
- [ ] Badge gris pour inactif
- [ ] Variants corrects (flat/bordered)

### Performance
- [ ] Pas de rechargement de page
- [ ] Rafraîchissement instantané
- [ ] Pas de lag
- [ ] Pas d'erreur console

---

## 🔧 Dépannage

### Le menu ne s'affiche pas

**Solution**:
1. Vérifier que vous êtes sur `/admin/users`
2. Vérifier la console (F12) pour des erreurs
3. Rafraîchir la page (Ctrl+R)
4. Nettoyer le cache et redémarrer:
```powershell
cd frontend
Remove-Item -Recurse -Force .next, .turbo
pnpm dev
```

### Le bouton n'est pas grisé pour moi

**Solution**:
1. Vérifier que vous êtes bien connecté
2. Ouvrir la console et vérifier `currentUser`
3. Se déconnecter et se reconnecter

### Le statut n'est pas correct

**Cause**: Le backend retourne `email_verified: false` pour un utilisateur actif

**Solution Backend**:
```powershell
cd backend
python
>>> from app import create_app, db
>>> from app.models import User
>>> app = create_app()
>>> with app.app_context():
...     user = User.query.filter_by(email="test@test.com").first()
...     user.email_verified = True
...     db.session.commit()
```

---

## 📝 Rapport de Test

Après les tests, notez:

| Test | Status | Notes |
|------|--------|-------|
| Sous-menu rôle | ✅ / ❌ | |
| Protection user connecté | ✅ / ❌ | |
| Affichage statut | ✅ / ❌ | |
| Fermeture menus | ✅ / ❌ | |
| Rafraîchissement données | ✅ / ❌ | |
| Performance | ✅ / ❌ | |
| Pas d'erreurs | ✅ / ❌ | |

---

## 🎉 Conclusion

Si tous les tests sont ✅, les fonctionnalités sont **prêtes pour production**!

**Profitez de votre gestion d'utilisateurs améliorée! 🚀**


