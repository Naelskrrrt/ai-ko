# 📊 Dashboard Admin - Documentation Centrale

Bienvenue dans la documentation du Dashboard Administrateur de AI-KO !

---

## 🗂️ Navigation Rapide

### 📖 Guides Principaux

| Document | Description | Pour Qui ? |
|----------|-------------|-----------|
| **[Guide de Démarrage Rapide](./QUICK_START_ADMIN_DASHBOARD.md)** | Comment démarrer et tester le dashboard | Développeurs, QA |
| **[Documentation d'Implémentation](./IMPLEMENTATION_FRONTEND_ADMIN_DASHBOARD.md)** | Vue d'ensemble technique complète | Développeurs |
| **[Résumé du Sprint](./SPRINT_SUMMARY_DASHBOARD_ADMIN.md)** | Récapitulatif de ce qui a été fait | PMs, Équipe |
| **[Changelog](./CHANGELOG_ADMIN_DASHBOARD.md)** | Historique des versions | Tous |
| **[Roadmap](./ADMIN_DASHBOARD_ROADMAP.md)** | Fonctionnalités futures prioritaires | PMs, Développeurs |

### 🔙 Documentation Backend

| Document | Description |
|----------|-------------|
| **[API Backend](./backend/ADMIN_API_DOCUMENTATION.md)** | Documentation des 31 endpoints admin |
| **[Tests Backend](./backend/ADMIN_TESTS_REPORT.md)** | Rapport des tests |

---

## 🚀 Démarrage en 2 Minutes

### 1. Backend
```bash
cd backend
source venv/bin/activate  # Linux/Mac
flask run
```

### 2. Frontend
```bash
cd frontend
npm run dev
```

### 3. Accès
- Frontend : `http://localhost:3000`
- Backend : `http://localhost:5000`
- Dashboard Admin : `http://localhost:3000/admin`

**Compte admin requis pour se connecter.**

---

## 📁 Structure du Dashboard

```
frontend/src/
├── app/admin/
│   ├── page.tsx                    # Dashboard principal
│   ├── etudiants/page.tsx          # Gestion étudiants
│   ├── professeurs/page.tsx        # Gestion professeurs
│   └── ai-configs/page.tsx         # Gestion configs IA
├── components/admin/
│   └── UrgentActionsBar.tsx        # Barre d'alertes
├── shared/
│   ├── types/admin.types.ts        # Types TypeScript
│   ├── services/api/admin.service.ts  # Services API
│   └── hooks/
│       ├── useEtudiants.ts         # Hook étudiants
│       ├── useProfesseurs.ts       # Hook professeurs
│       └── useAIConfigs.ts         # Hook configs IA
└── core/config/site.ts             # Navigation
```

---

## 🎯 Fonctionnalités Actuelles

### ✅ Opérationnel

- **Dashboard Principal** : Statistiques + navigation rapide
- **Barre d'Alertes** : Notifications critiques/warning/info
- **Gestion Étudiants** : Liste, recherche, pagination, suppression
- **Gestion Professeurs** : Liste, recherche, pagination, suppression
- **Gestion Configs IA** : Cartes, initialisation, suppression

### 🚧 En Développement

- **Formulaires CRUD** : Création/modification (placeholders actuels)
- **Assignation** : Classes/matières pour étudiants et professeurs
- **Actions Urgentes** : Logique backend (retourne vide actuellement)

---

## 📚 Technologies

### Frontend
- **Framework** : Next.js 14 + TypeScript
- **UI** : HeroUI + Tailwind CSS
- **Icons** : Lucide React
- **Data Fetching** : SWR
- **URL State** : nuqs

### Backend
- **Framework** : Flask + SQLAlchemy
- **Database** : PostgreSQL
- **API** : Flask-RESTX
- **Auth** : JWT

---

## 🎨 Design System

### Couleurs par Entité

- **Étudiants** : Bleu (`blue-*`)
- **Professeurs** : Vert (`green-*`)
- **Configs IA** : Violet (`purple-*`)
- **Critical** : Rouge (`red-*`)
- **Warning** : Ambre (`amber-*`)
- **Info** : Bleu (`blue-*`)

### Composants HeroUI

Card, Button, Input, Chip, Dropdown, Modal, Switch

---

## 🔗 API Endpoints

### Étudiants (6 endpoints)
```
GET    /api/v1/admin/etudiants
GET    /api/v1/admin/etudiants/:id
POST   /api/v1/admin/etudiants
PUT    /api/v1/admin/etudiants/:id
DELETE /api/v1/admin/etudiants/:id
POST   /api/v1/admin/etudiants/:id/assign
```

### Professeurs (6 endpoints)
```
GET    /api/v1/admin/professeurs
GET    /api/v1/admin/professeurs/:id
POST   /api/v1/admin/professeurs
PUT    /api/v1/admin/professeurs/:id
DELETE /api/v1/admin/professeurs/:id
POST   /api/v1/admin/professeurs/:id/assign
```

### Configs IA (9 endpoints)
```
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

**Voir [API Documentation](./backend/ADMIN_API_DOCUMENTATION.md) pour détails.**

---

## 🧪 Tests

### Linting
```bash
cd frontend
npm run lint
# ✅ 0 erreurs
```

### Build
```bash
npm run build
# Vérifier qu'il n'y a pas d'erreurs TypeScript
```

### Tests Backend
```bash
cd backend
python -m pytest tests/test_admin_complete.py -v
# Score : 24/24 sur SQLite
```

---

## 🆘 Problèmes Courants

### "Network Error"
**Solution :** Vérifier que le backend tourne sur `http://localhost:5000`

### "401 Unauthorized"
**Solution :** Se reconnecter (token JWT expiré)

### Aucune donnée affichée
**Solution :** Créer des données de test ou vérifier la DB

---

## 📝 Contribution

### Workflow Git

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Développer et commiter
3. Pousser : `git push origin feature/ma-fonctionnalite`
4. Créer une Pull Request

### Standards de Code

- **ESLint** : Aucune erreur tolérée
- **TypeScript** : Strict mode activé
- **Prettier** : Formatage automatique
- **Commits** : Conventional Commits (`feat:`, `fix:`, etc.)

---

## 🎯 Prochaines Étapes

### Sprint 2 (Priorité Haute)

1. **Formulaires CRUD complets** (3-4 jours)
   - React Hook Form + Zod
   - Validation temps réel
   
2. **Modal d'assignation** (2 jours)
   - Multi-select classes/matières
   - Prévisualisation
   
3. **Actions urgentes** (3 jours)
   - Backend : endpoint dédié
   - Détection automatique
   - Notifications temps réel

**Durée totale estimée : 8-9 jours**

Voir la [Roadmap complète](./ADMIN_DASHBOARD_ROADMAP.md) pour plus de détails.

---

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| Lignes de code | ~2,500 |
| Composants créés | 4 |
| Hooks créés | 3 |
| Pages créées | 3 |
| Endpoints intégrés | 18 |
| Types TypeScript | 10 |
| Documentation | 5 fichiers |
| Erreurs linting | 0 |

---

## 🙏 Crédits

- **Framework** : Next.js (Vercel)
- **UI Library** : HeroUI
- **Icons** : Lucide React
- **Backend** : Flask (Pallets Projects)

---

## 📄 Licence

[Insérer licence ici]

---

## 📞 Contact

Pour toute question :
- **Email** : [votre-email]
- **Slack** : #ai-ko-dev
- **Issues** : GitHub Issues

---

**Dernière mise à jour :** 29 Novembre 2024  
**Version :** 1.0.0  
**Statut :** ✅ Opérationnel (fonctionnalités de base)

---

Bon développement ! 🚀





