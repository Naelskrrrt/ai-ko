# Roadmap - Dashboard Admin

## 🎯 Vue d'ensemble

Ce document présente les améliorations possibles du dashboard administrateur par ordre de priorité.

---

## 🔥 Priorité 1 : Fonctionnalités CRUD Complètes

### 1.1 Formulaires de Création/Modification

**Pour : Étudiants**

- [ ] Modal avec formulaire react-hook-form
- [ ] Champs :
  - Email (validé avec regex)
  - Nom complet
  - Mot de passe (généré ou manuel)
  - Numéro étudiant
  - Téléphone (optionnel)
  - Date de naissance (optionnel)
- [ ] Validation avec zod
- [ ] Messages d'erreur clairs
- [ ] Bouton "Générer mot de passe aléatoire"

**Pour : Professeurs**

- [ ] Similaire à étudiants avec :
  - Numéro enseignant (au lieu de numéro étudiant)
  - Champs spécifiques professeurs

**Pour : Configurations IA**

- [ ] Formulaire complet avec :
  - Nom
  - Provider (select : huggingface, openai, anthropic, local)
  - Model ID (input text)
  - Description (textarea)
  - API URL (optionnel)
  - Max Tokens (slider 100-4000)
  - Temperature (slider 0.0-2.0, step 0.1)
  - Top P (slider 0.0-1.0, step 0.05)
  - Timeout (input number, secondes)
  - Actif (switch)
  - Priorité (input number)
- [ ] Validation temps réel des plages de valeurs
- [ ] Prévisualisation de la config avant création

### 1.2 Modal d'Assignation

**Pour : Étudiants**

- [ ] Sélection multiple de niveaux (checkboxes)
- [ ] Sélection multiple de classes (dépend du niveau)
- [ ] Sélection multiple de matières
- [ ] Champ année scolaire (select ou input)
- [ ] Aperçu des assignations actuelles
- [ ] Aperçu des modifications avant validation
- [ ] Bouton "Tout désassigner"

**Pour : Professeurs**

- [ ] Similaire avec matières/niveaux/classes

### 1.3 Gestion des Erreurs

- [ ] Messages d'erreur contextuels
- [ ] Toast notifications pour succès/erreur
- [ ] Gestion des erreurs réseau (retry, offline mode)
- [ ] Validation côté client avant envoi API

---

## 🚨 Priorité 2 : Système d'Actions Urgentes

### 2.1 Backend - Endpoint Dédié

**Créer : `/api/v1/admin/urgent-actions`**

```python
# Logique de détection :

# 1. Professeurs inactifs
- Détecter les professeurs qui n'ont créé aucun QCM depuis X jours
- Seuil configurable (par défaut 30 jours)
- Type : warning

# 2. Étudiants en difficulté
- Détecter les étudiants avec moyenne < seuil (par défaut 10/20)
- Calculer sur les N derniers examens
- Type : critical

# 3. Sessions d'examen sans QCM
- Détecter les sessions planifiées sans QCM assigné
- Moins de 48h avant le début
- Type : warning

# 4. Configurations IA défaillantes
- Configs marquées actives mais qui échouent systématiquement
- Taux d'échec > 80%
- Type : critical

# 5. Utilisateurs non vérifiés
- Comptes créés depuis > 7 jours sans vérification email
- Type : info
```

**Retour JSON :**

```json
{
  "actions": [
    {
      "id": "uuid",
      "type": "critical",
      "category": "etudiant",
      "message": "Jean Dupont a une moyenne de 5/20 sur les 3 derniers examens",
      "targetId": "etudiant-uuid",
      "timestamp": "2024-11-29T10:30:00Z",
      "actionUrl": "/admin/etudiants?highlight=etudiant-uuid"
    },
    {
      "id": "uuid",
      "type": "warning",
      "category": "professeur",
      "message": "Marie Martin n'a créé aucun QCM depuis 45 jours",
      "targetId": "prof-uuid",
      "timestamp": "2024-11-29T09:15:00Z",
      "actionUrl": "/admin/professeurs?highlight=prof-uuid"
    }
  ],
  "total": 2,
  "critical": 1,
  "warning": 1,
  "info": 0
}
```

### 2.2 Frontend - Intégration

- [ ] Appel automatique toutes les 5 minutes
- [ ] Badge de notification sur l'icône du dashboard
- [ ] Animation d'apparition des nouvelles alertes
- [ ] Filtrage par type (critical, warning, info)
- [ ] Marquer comme "vue" (dismiss)
- [ ] Son optionnel pour alertes critiques

### 2.3 WebSocket (Optionnel)

- [ ] Backend : Socket.IO pour notifications temps réel
- [ ] Frontend : Connexion WebSocket
- [ ] Push notifications browser (si autorisé)

---

## 📊 Priorité 3 : Filtres & Recherche Avancée

### 3.1 Page Étudiants

**Filtres à ajouter :**

- [ ] Filtrer par niveau (select multiple)
- [ ] Filtrer par classe (select multiple, dépend du niveau)
- [ ] Filtrer par matière (select multiple)
- [ ] Filtrer par année scolaire (select)
- [ ] Filtrer par statut email (vérifié/non vérifié)
- [ ] Tri par : nom, email, date création, numéro

**Interface :**

- [ ] Panneau de filtres repliable à gauche
- [ ] Compteur de filtres actifs
- [ ] Bouton "Réinitialiser les filtres"
- [ ] URL persistante avec tous les filtres

### 3.2 Page Professeurs

**Filtres à ajouter :**

- [ ] Filtrer par matière enseignée
- [ ] Filtrer par niveau enseigné
- [ ] Filtrer par nombre de QCMs créés (range)
- [ ] Filtrer par statut email

### 3.3 Page Configs IA

**Filtres à ajouter :**

- [ ] Filtrer par provider (huggingface, openai, etc.)
- [ ] Filtrer par statut (actif/inactif)
- [ ] Afficher uniquement la config par défaut
- [ ] Tri par : nom, provider, priorité, date création

---

## 📈 Priorité 4 : Statistiques & Analytiques

### 4.1 Dashboard Principal

**Nouvelles statistiques :**

- [ ] Graphique d'évolution des inscriptions (étudiants/professeurs)
- [ ] Répartition géographique (si données disponibles)
- [ ] Taux de complétion des QCMs
- [ ] Moyenne générale par niveau
- [ ] Top 5 professeurs (par nombre de QCMs créés)
- [ ] Top 5 étudiants (par notes moyennes)

**Graphiques :**

- [ ] Utiliser Chart.js ou Recharts
- [ ] Graphiques interactifs
- [ ] Export des graphiques en PNG

### 4.2 Page Détail Étudiant

**Créer : `/admin/etudiants/[id]`**

- [ ] Informations détaillées
- [ ] Historique des examens passés
- [ ] Graphique d'évolution des notes
- [ ] Liste des matières suivies
- [ ] Classes assignées
- [ ] Logs d'activité (connexions, examens terminés)

### 4.3 Page Détail Professeur

**Créer : `/admin/professeurs/[id]`**

- [ ] Informations détaillées
- [ ] Liste des QCMs créés
- [ ] Statistiques sur les QCMs :
  - Nombre total
  - Taux de réussite moyen
  - Questions les plus difficiles
- [ ] Matières enseignées
- [ ] Niveaux enseignés
- [ ] Logs d'activité

---

## 🔐 Priorité 5 : Sécurité & Permissions

### 5.1 Logs d'Audit

- [ ] Backend : Logger toutes les actions admin
  - Création/modification/suppression d'utilisateurs
  - Modification de configurations IA
  - Assignations
- [ ] Page `/admin/audit-logs` :
  - Tableau avec : timestamp, admin, action, cible, détails
  - Filtres : par admin, par type d'action, par date
  - Export CSV

### 5.2 Confirmations Supplémentaires

- [ ] Confirmation par mot de passe pour actions critiques :
  - Suppression d'un professeur
  - Suppression massive
  - Modification de la config IA par défaut
- [ ] Rate limiting sur actions sensibles

### 5.3 Rôles Admin Granulaires

- [ ] Super Admin (toutes permissions)
- [ ] Admin Académique (gestion étudiants/professeurs)
- [ ] Admin Technique (gestion configs IA)
- [ ] Admin RH (consultation uniquement)

---

## 🎨 Priorité 6 : UX & Accessibilité

### 6.1 Améliorations UX

- [ ] Skeleton loaders pendant chargement
- [ ] Animations de transition fluides
- [ ] Indicateurs de chargement contextuels
- [ ] Mode compact pour tableaux
- [ ] Sauvegarde automatique des brouillons
- [ ] Shortcuts clavier (Ctrl+K pour recherche globale)

### 6.2 Accessibilité

- [ ] Navigation complète au clavier
- [ ] Screen reader friendly
- [ ] Contraste WCAG AAA
- [ ] Focus visible
- [ ] Labels ARIA complets
- [ ] Tests avec NVDA/JAWS

### 6.3 Internationalisation

- [ ] Support multi-langue (FR, EN, AR)
- [ ] Détection automatique de la langue
- [ ] Sélecteur de langue dans la sidebar
- [ ] Traduction des messages d'erreur

---

## 🚀 Priorité 7 : Performance & Optimisation

### 7.1 Optimisation Frontend

- [ ] Lazy loading des pages admin
- [ ] Virtualisation des tableaux (react-window)
- [ ] Compression des images
- [ ] Code splitting agressif
- [ ] Service Worker pour cache

### 7.2 Optimisation Backend

- [ ] Mise en cache Redis pour listes fréquentes
- [ ] Pagination côté serveur optimisée
- [ ] Indexation des colonnes searchées
- [ ] Query optimization (select_in_load)

### 7.3 Monitoring

- [ ] Sentry pour erreurs frontend
- [ ] Logging structuré backend (ELK stack)
- [ ] Métriques de performance (Prometheus)
- [ ] Alertes automatiques (Grafana)

---

## 📱 Priorité 8 : Mobile & Responsive

### 8.1 Interface Mobile

- [ ] Sidebar collapsible sur mobile
- [ ] Tableaux scrollables horizontalement
- [ ] Touch gestures (swipe pour supprimer)
- [ ] Boutons plus grands pour mobile
- [ ] Navigation bottom tab bar

### 8.2 Progressive Web App

- [ ] Manifest.json
- [ ] Service Worker
- [ ] Icônes multi-tailles
- [ ] Mode offline basique
- [ ] Install prompt

---

## 🔄 Priorité 9 : Import/Export

### 9.1 Import Massif

**Étudiants :**

- [ ] Upload CSV/Excel
- [ ] Mapping des colonnes
- [ ] Validation avant import
- [ ] Import progressif avec barre de progression
- [ ] Rapport d'erreurs

**Professeurs :**

- [ ] Similaire aux étudiants

### 9.2 Export

- [ ] Export CSV de toutes les listes
- [ ] Export Excel avec formatage
- [ ] Export PDF avec logo établissement
- [ ] Sélection des colonnes à exporter
- [ ] Export planifié (hebdomadaire, mensuel)

---

## 🧪 Priorité 10 : Tests & Documentation

### 10.1 Tests Frontend

- [ ] Tests unitaires (Jest + React Testing Library)
- [ ] Tests d'intégration (Cypress)
- [ ] Tests E2E (Playwright)
- [ ] Coverage > 80%

### 10.2 Tests Backend

- [ ] Tests unitaires complets
- [ ] Tests d'intégration API
- [ ] Tests de charge (Locust)

### 10.3 Documentation

- [ ] Storybook pour composants
- [ ] Documentation API avec Swagger
- [ ] Guide utilisateur (vidéos)
- [ ] Guide développeur

---

## 📅 Timeline Estimée

| Priorité | Durée Estimée | Difficulté |
|----------|---------------|------------|
| 1 - CRUD Complet | 3-4 jours | Moyenne |
| 2 - Actions Urgentes | 2-3 jours | Élevée |
| 3 - Filtres Avancés | 2 jours | Faible |
| 4 - Statistiques | 3-4 jours | Moyenne |
| 5 - Sécurité | 2-3 jours | Élevée |
| 6 - UX/A11y | 2-3 jours | Moyenne |
| 7 - Performance | 3-4 jours | Élevée |
| 8 - Mobile/PWA | 2-3 jours | Moyenne |
| 9 - Import/Export | 2-3 jours | Moyenne |
| 10 - Tests/Docs | 4-5 jours | Moyenne |

**Total : 25-35 jours de développement**

---

## 🎯 Objectifs Trimestriels

### Q1 (Mois 1-3)
- Priorités 1, 2, 3 (CRUD + Urgentes + Filtres)
- Dashboard pleinement opérationnel

### Q2 (Mois 4-6)
- Priorités 4, 5 (Stats + Sécurité)
- Analytics avancées

### Q3 (Mois 7-9)
- Priorités 6, 7 (UX + Performance)
- Optimisation générale

### Q4 (Mois 10-12)
- Priorités 8, 9, 10 (Mobile + Import/Export + Tests)
- Finalisation et documentation

---

## 💡 Idées Innovantes

### Intelligence Artificielle

- [ ] Suggestions automatiques d'assignations (IA recommande classes/matières pour un étudiant)
- [ ] Détection d'anomalies dans les notes (patterns inhabituels)
- [ ] Prédiction du risque d'échec d'un étudiant
- [ ] Recommandations de QCMs personnalisés

### Collaboration

- [ ] Chat intégré entre admin et professeurs
- [ ] Système de tickets (support interne)
- [ ] Workflow d'approbation (professeur demande création classe → admin approuve)

### Gamification

- [ ] Badges pour professeurs (créateur de QCM prolifique)
- [ ] Leaderboard des classes (moyenne générale)
- [ ] Récompenses pour étudiants

---

Prêt à faire évoluer le dashboard ! 🚀


