# 📋 TODO - Configuration du Template

Cette checklist vous guide pour personnaliser ce template selon vos besoins.

## ✅ Configuration de Base

### 1. Informations du Projet
- [ ] Modifier `name` et `description` dans `package.json`
- [ ] Personnaliser `siteConfig` dans `config/site.ts`
  - [ ] Nom de l'application
  - [ ] Description
  - [ ] Navigation (navItems, navMenuItems)
  - [ ] Pages avec sidebar (sidebarPages)
  - [ ] Configuration de l'organisation/entreprise
- [ ] Remplacer les logos dans `public/`
  - [ ] `favicon.ico`
  - [ ] `logo-capt_light-mode.png` & `logo-capt_dark-mode.png` → vos logos
  - [ ] Icons de différentes tailles

### 2. Configuration API
- [ ] Définir `NEXT_PUBLIC_API_URL` dans `.env.local`
- [ ] Adapter les endpoints dans `config/api.ts`
- [ ] Tester la connexion avec votre backend

### 3. Authentification
- [ ] Adapter les types dans `types/auth.ts` selon votre système d'auth
- [ ] Modifier la logique d'authentification dans `lib/auth.ts`
- [ ] Personnaliser les routes d'auth dans `app/api/auth/`
- [ ] Adapter le hook `useAuth` selon vos besoins

## 🎨 Personnalisation UI/UX

### 4. Design System
- [ ] Personnaliser les couleurs dans `config/site.ts` (theme)
- [ ] Adapter le logo dans `components/icons.tsx`
- [ ] Modifier les styles globaux dans `src/styles/globals.css`
- [ ] Personnaliser les composants layout si nécessaire

### 5. Navigation et Routing
- [ ] Ajouter vos pages métier dans `app/`
- [ ] Mettre à jour `sidebarPages` pour les pages avec sidebar
- [ ] Créer vos éléments de navigation dans la config
- [ ] Adapter le middleware si protection de routes nécessaire

### 6. Pages Spécifiques
- [ ] Personnaliser la page d'accueil (`app/page.tsx`)
- [ ] Adapter la page de login (`app/login/page.tsx`)
- [ ] Créer vos pages dashboard selon vos besoins
- [ ] Modifier la page de profil selon votre structure utilisateur

## 📊 Gestion des Données

### 7. SWR et API
- [ ] Créer vos hooks de données avec `useFetch`
- [ ] Implémenter vos mutations avec les hooks de `libs/mutations.ts`
- [ ] Adapter la configuration SWR selon vos besoins
- [ ] Créer vos types TypeScript dans `types/`

### 8. Cache et Performance
- [ ] Configurer le cache client si nécessaire (`libs/client-cache.ts`)
- [ ] Adapter la stratégie de revalidation SWR
- [ ] Optimiser les images et assets

## 🔧 Fonctionnalités Métier

### 9. Fonctionnalités Spécifiques
- [ ] Identifier vos besoins métier
- [ ] Créer les composants nécessaires avec HeroUI
- [ ] Implémenter la logique dans des hooks/libs séparés
- [ ] Ajouter la gestion d'erreurs appropriée

### 10. État Global (si nécessaire)
- [ ] Évaluer le besoin d'un état global (Zustand, Context, etc.)
- [ ] Implémenter si SWR ne suffit pas
- [ ] Documenter les patterns utilisés

## 🚀 Déploiement et Production

### 11. Configuration Production
- [ ] Configurer les variables d'environnement de production
- [ ] Tester le build de production (`npm run build`)
- [ ] Optimiser les bundles si nécessaire
- [ ] Configurer le monitoring d'erreurs (Sentry, etc.)

### 12. Déploiement
- [ ] Choisir votre plateforme (Vercel, Netlify, Docker, etc.)
- [ ] Configurer les variables d'environnement sur la plateforme
- [ ] Tester l'application déployée
- [ ] Configurer le domaine personnalisé

## 📚 Documentation et Maintenance

### 13. Documentation
- [ ] Mettre à jour ce README avec vos spécificités
- [ ] Documenter vos API et hooks personnalisés
- [ ] Créer des guides pour votre équipe
- [ ] Maintenir la documentation à jour

### 14. Tests (optionnel mais recommandé)
- [ ] Installer un framework de test (Jest, Vitest, etc.)
- [ ] Créer des tests pour vos hooks SWR
- [ ] Tester les composants critiques
- [ ] Mettre en place l'intégration continue

### 15. Monitoring et Analytics
- [ ] Intégrer Google Analytics ou alternative
- [ ] Mettre en place le monitoring des performances
- [ ] Configurer les alertes d'erreurs
- [ ] Surveiller l'utilisation des API

## 🧹 Nettoyage Final

### 16. Suppression du Template
- [ ] Supprimer ce fichier TODO.md
- [ ] Supprimer les exemples non utilisés dans `examples/`
- [ ] Nettoyer les commentaires et logs de debug
- [ ] Réviser les imports inutilisés
- [ ] Optimiser la taille du bundle final

---

## 💡 Conseils

### Bonnes Pratiques
- **SWR First** : Utilisez toujours SWR pour les données, évitez `fetch()` direct
- **HeroUI Native** : Ne recréez jamais un composant qui existe dans HeroUI
- **TypeScript Strict** : Maintenez un typage strict pour éviter les erreurs
- **Séparation des Responsabilités** : Logique métier dans `/libs`, UI dans `/components`

### Structure Recommandée pour Vos Nouvelles Fonctionnalités
```
app/your-feature/          # Pages de la fonctionnalité
components/your-feature/   # Composants UI spécifiques
hooks/useYourFeature.ts    # Hooks de données avec SWR
libs/your-feature.ts       # Logique métier pure
types/your-feature.ts      # Types TypeScript
```

### Ressources Utiles
- [Guide SWR Complet](./docs/SWR_GUIDE.md)
- [Exemples SWR](./examples/swr-examples.tsx)
- [HeroUI Documentation](https://heroui.com)
- [Next.js 15 Docs](https://nextjs.org/docs)

---

✨ **Bon développement avec ce template !**