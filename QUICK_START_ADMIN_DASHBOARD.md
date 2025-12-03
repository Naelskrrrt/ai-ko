# Guide de Démarrage Rapide - Dashboard Admin

## 🚀 Démarrage en 5 Minutes

### Prérequis

1. ✅ Backend fonctionnel avec PostgreSQL
2. ✅ Migrations appliquées (y compris `006_add_ai_model_configs.py`)
3. ✅ Utilisateur admin créé dans la DB

---

## Étape 1 : Démarrer le Backend

```bash
cd backend

# Activer l'environnement virtuel (si nécessaire)
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Démarrer Flask
flask run

# Le backend devrait être accessible sur http://localhost:5000
```

---

## Étape 2 : Démarrer le Frontend

```bash
# Dans un nouveau terminal
cd frontend

# Installer les dépendances (si première fois)
npm install

# Démarrer le serveur de développement
npm run dev

# Le frontend devrait être accessible sur http://localhost:3000
```

---

## Étape 3 : Tester le Dashboard

### 3.1 Se Connecter

1. Aller sur `http://localhost:3000/login`
2. Se connecter avec un compte **admin**

### 3.2 Accéder au Dashboard

1. Cliquer sur "Admin" dans la navigation
2. Vous devriez voir :
   - Le dashboard avec statistiques
   - La barre d'actions urgentes (vide pour l'instant)
   - 3 cartes de navigation rapide

### 3.3 Tester les Nouvelles Pages

#### Page Étudiants (`/admin/etudiants`)

```
✅ Tableau avec liste des étudiants
✅ Barre de recherche
✅ Pagination
✅ Menu actions (Modifier, Assigner, Supprimer)
✅ Bouton "Nouvel étudiant"
```

#### Page Professeurs (`/admin/professeurs`)

```
✅ Tableau avec liste des professeurs
✅ Affichage des matières enseignées
✅ Barre de recherche
✅ Pagination
✅ Menu actions (Modifier, Assigner matières, Supprimer)
✅ Bouton "Nouveau professeur"
```

#### Page Configs IA (`/admin/ai-configs`)

```
✅ Grille de cartes avec les configurations
✅ Badge "Par défaut" sur la config active
✅ Paramètres détaillés (tokens, temperature, etc.)
✅ Switch actif/inactif
✅ Menu actions (Modifier, Définir par défaut, Appliquer, Supprimer)
✅ Bouton "Initialiser configs par défaut"
```

---

## 🧪 Tests Recommandés

### Test 1 : Initialiser les Configs IA

1. Aller sur `/admin/ai-configs`
2. Si aucune config n'existe :
   - Cliquer sur "Initialiser configs par défaut"
   - Vérifier que 3-4 configs sont créées
   - Vérifier qu'une est marquée "Par défaut" ⭐

### Test 2 : Recherche d'Étudiants

1. Aller sur `/admin/etudiants`
2. Taper un nom dans la barre de recherche
3. Vérifier que la liste se filtre en temps réel
4. Vérifier que l'URL est mise à jour (`?search=...`)

### Test 3 : Pagination

1. Si plus de 10 étudiants/professeurs :
   - Cliquer sur les flèches de pagination
   - Vérifier que l'URL change (`?page=2`)
   - Vérifier que les données changent

### Test 4 : Suppression

1. Cliquer sur le menu actions (⋮) d'un étudiant
2. Cliquer sur "Supprimer"
3. Vérifier qu'une modale de confirmation apparaît
4. Annuler ou confirmer
5. Vérifier que la liste se rafraîchit

---

## 🔧 Résolution de Problèmes

### Problème 1 : "Network Error" dans le frontend

**Cause :** Le backend n'est pas démarré ou l'URL est incorrecte.

**Solution :**
```bash
# Vérifier que le backend tourne
curl http://localhost:5000/api/v1/health

# Si erreur, redémarrer le backend
cd backend
flask run
```

### Problème 2 : "401 Unauthorized"

**Cause :** Token JWT expiré ou invalide.

**Solution :**
- Se déconnecter et se reconnecter
- Vérifier que le token est bien stocké dans localStorage

### Problème 3 : "Cannot GET /admin/etudiants"

**Cause :** Routing Next.js non configuré (ne devrait pas arriver).

**Solution :**
```bash
cd frontend
rm -rf .next
npm run dev
```

### Problème 4 : Aucune donnée affichée

**Cause :** Base de données vide.

**Solution :**
```bash
# Créer des données de test
cd backend
python scripts/seed_database.py  # Si vous avez un script de seeding

# Ou créer manuellement via l'API
```

---

## 🎯 Fonctionnalités Manquantes (TODO)

Ces fonctionnalités affichent actuellement "Fonctionnalité en cours de développement..." :

1. **Formulaires de création/modification** :
   - Créer un nouvel étudiant
   - Créer un nouveau professeur
   - Créer une nouvelle config IA
   - Modifier les entités existantes

2. **Modal d'assignation** :
   - Assigner classes/matières aux étudiants
   - Assigner matières aux professeurs

3. **Logique des Actions Urgentes** :
   - Backend : endpoint `/api/v1/admin/urgent-actions`
   - Calcul des alertes (professeurs inactifs, étudiants en difficulté)

---

## 📚 API Endpoints Disponibles

### Étudiants

```http
GET    /api/v1/admin/etudiants?page=1&per_page=10&search=nom
GET    /api/v1/admin/etudiants/:id
POST   /api/v1/admin/etudiants
PUT    /api/v1/admin/etudiants/:id
DELETE /api/v1/admin/etudiants/:id
POST   /api/v1/admin/etudiants/:id/assign
```

### Professeurs

```http
GET    /api/v1/admin/professeurs?page=1&per_page=10&search=nom
GET    /api/v1/admin/professeurs/:id
POST   /api/v1/admin/professeurs
PUT    /api/v1/admin/professeurs/:id
DELETE /api/v1/admin/professeurs/:id
POST   /api/v1/admin/professeurs/:id/assign
```

### Configurations IA

```http
GET    /api/v1/admin/ai-configs
GET    /api/v1/admin/ai-configs/:id
GET    /api/v1/admin/ai-configs/default
POST   /api/v1/admin/ai-configs
PUT    /api/v1/admin/ai-configs/:id
DELETE /api/v1/admin/ai-configs/:id
POST   /api/v1/admin/ai-configs/:id/set-default
POST   /api/v1/admin/ai-configs/:id/apply
POST   /api/v1/admin/ai-configs/init-defaults
```

---

## 🎨 Composants Réutilisables

Si vous voulez utiliser ces composants ailleurs :

```tsx
// Barre d'actions urgentes (pour dashboard enseignant par exemple)
import { UrgentActionsBar } from "@/components/admin/UrgentActionsBar";

<UrgentActionsBar actions={actions} role="professeur" />

// Hooks SWR
import { useEtudiants, useProfesseurs, useAIConfigs } from "@/shared/hooks";

const { etudiants, isLoading } = useEtudiants({ page: 1, per_page: 10 });
const { professeurs } = useProfesseurs({ search: "Jean" });
const { configs } = useAIConfigs();
```

---

## ✅ Checklist de Vérification

Avant de considérer le dashboard comme opérationnel :

- [ ] Backend démarré et accessible
- [ ] Frontend démarré et accessible
- [ ] Connexion admin fonctionnelle
- [ ] Dashboard principal affiche les stats
- [ ] Page étudiants affiche la liste
- [ ] Page professeurs affiche la liste
- [ ] Page configs IA affiche les cartes
- [ ] Recherche fonctionne
- [ ] Pagination fonctionne
- [ ] Suppression fonctionne (avec confirmation)
- [ ] Navigation dans la sidebar fonctionne
- [ ] Aucune erreur dans la console browser
- [ ] Aucune erreur dans les logs backend

---

## 🆘 Besoin d'Aide ?

1. **Console Browser** : F12 → onglet Console (erreurs JS)
2. **Network Tab** : F12 → onglet Network (requêtes API)
3. **Backend Logs** : Vérifier les logs Flask dans le terminal
4. **Documentation Backend** : Voir `ADMIN_API_DOCUMENTATION.md`

---

Bon test ! 🚀





