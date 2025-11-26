---
applyTo: '**frontend'
---

# Frontend Template - Instructions de Codage IA


## Vue d'ensemble du projet
Template frontend moderne construit avec Next.js 15, HeroUI v2, SWR et TypeScript. L'application utilise un système de layout conditionnel qui bascule entre un layout standard et un layout dashboard basé sur la route actuelle.

## Architecture et Patterns Clés

### Système de Layout Conditionnel
L'application utilise une architecture unique à double layout définie dans `components/layout/conditional-layout.tsx` :
- **Layout Standard** : Utilisé pour les pages marketing (`/`, `/about`, `/pricing`, etc.) avec header + footer
- **Layout Dashboard** : Utilisé pour les pages applicatives (`/dashboard`, `/team`, etc.) avec sidebar + header
- La sélection du layout est contrôlée par le tableau `siteConfig.sidebarPages` dans `config/site.ts`

### Configuration du Site
Toute la navigation, le routage et le comportement des layouts sont centralisés dans `config/site.ts` :
- `navItems` : Navigation principale pour le layout standard
- `sidebarNavItems` : Navigation de la sidebar du dashboard
- `sidebarPages` : Tableau définissant quelles routes utilisent le layout dashboard
- **TOUJOURS** mettre à jour ce fichier lors de l'ajout de nouvelles routes dashboard

### Organisation des Composants
- **Composants UI** : Utiliser EXCLUSIVEMENT les composants HeroUI natifs avec tailwind-variants pour le styling
- **INTERDIT** : Placer de la logique métier dans les composants UI (utiliser des bibliothèques/hooks séparés)
- **Composants Layout** : Système de layout modulaire dans `components/layout/`
- **Primitives** : Utilitaires de styling réutilisables dans `components/primitives.ts` utilisant `tailwind-variants`

## Workflows de Développement

### Ajout de Nouvelles Pages
1. Créer la page dans le répertoire `app/` approprié
2. Si c'est une page dashboard, ajouter la route au tableau `siteConfig.sidebarPages`
3. Ajouter l'élément de navigation à `siteConfig.navItems` ou `siteConfig.sidebarNavItems`
4. Exporter les metadata pour le SEO

### Patterns de Styling
- **OBLIGATOIRE** : Utiliser les composants HeroUI natifs comme base : `@heroui/button`, `@heroui/navbar`, etc.
- **INTERDIT** : Créer des composants UI personnalisés si un équivalent HeroUI existe
- Appliquer tailwind-variants pour les patterns de styling complexes (voir `primitives.ts`)
- Mode sombre activé par défaut (`defaultTheme: "dark"` dans le layout)
- Utiliser les tokens de couleur sémantiques : `text-primary`, `bg-success/10`, `text-default-600`

### Gestion des Données
- **OBLIGATOIRE** : Utiliser SWR pour tous les appels d'API et la gestion du cache
- Patterns SWR : `useSWR`, `useSWRMutation` pour les mutations
- Configuration SWR centralisée recommandée dans un provider
- **Hook useFetch** : Utiliser le hook personnalisé `useFetch` dans `libs/fetcher.ts` pour tous les appels API

#### Utilisation du Hook useFetch
Le hook `useFetch` dans `libs/fetcher.ts` encapsule SWR avec Axios pour une gestion optimisée des données :

```typescript
import { useFetch } from '@/libs/fetcher';

// Exemple d'utilisation basique
const { data, error, isLoading, mutate } = useFetch<User[]>('/api/users');

// Avec paramètres de requête
const { data, error, isLoading } = useFetch<User[]>(
  '/api/users',
  { status: 'active', limit: 10 }
);

// Avec configuration Axios et SWR personnalisée
const { data, error, isLoading } = useFetch<Dashboard>(
  '/api/dashboard',
  undefined,
  { timeout: 10000 }, // Config Axios
  { refreshInterval: 30000 } // Config SWR
);

// Désactiver la requête conditionnellement
const { data } = useFetch<Profile>(userId ? `/api/users/${userId}` : null);
```

**Paramètres du hook useFetch :**
- `url` : URL de l'API (null pour désactiver)
- `params` : Paramètres de requête (optionnel)
- `config` : Configuration Axios (optionnel)
- `swrOptions` : Options SWR personnalisées (optionnel)

### Configuration TypeScript
- Configuration TypeScript stricte avec répertoire app de Next.js 15
- Configuration de router personnalisée dans `providers.tsx` pour la navigation HeroUI
- Utiliser les types metadata appropriés pour le SEO

## Dépendances Clés et Configuration
- **HeroUI v2** : Bibliothèque UI principale avec imports modulaires
- **SWR** : Bibliothèque de fetching de données et gestion du cache
- **Tailwind CSS v4** : Dernière version avec plugin HeroUI
- **Framer Motion** : Pour les animations (importé via HeroUI)
- **next-themes** : Changement de thème avec mode sombre basé sur les classes
- **Turbopack** : Activé pour le serveur de dev (`npm run dev` utilise `--turbopack`)

## Style de Code et Conventions
- Utiliser `clsx` pour la fusion conditionnelle de className
- Instructions d'import : Composants HeroUI individuellement, pas d'exports en barrel
- Nommage des fichiers : kebab-case pour les composants, PascalCase pour les pages
- Contenu textuel en français dans toute l'application (voir messages dashboard)
- Utiliser le wrapper `NextLink` pour la navigation interne avec les composants HeroUI

## Points d'Intégration Critiques
- **Theme Provider** : Enveloppe l'app dans `providers.tsx` avec HeroUI + next-themes
- **Configuration des Polices** : Configuration personnalisée dans `config/fonts.ts` (référencée dans layout)
- **Rendu Conditionnel** : Toujours vérifier `siteConfig.sidebarPages` pour les décisions de layout
- **Responsive Mobile** : Header affiche le toggle menu sur mobile, sidebar se ferme automatiquement au changement de route

## Règles Strictes à Respecter
1. **HeroUI Natif OBLIGATOIRE** : Ne jamais recréer un composant qui existe déjà dans HeroUI
2. **SWR pour les Données** : Utiliser SWR pour tous les appels API, pas fetch() direct
3. **Séparation UI/Logique** : JAMAIS de logique métier dans les composants UI, utiliser des libs/hooks séparés
4. **Layout Dashboard** : Les routes doivent être ajoutées au tableau `siteConfig.sidebarPages`
5. **Navigation HeroUI** : Nécessite la configuration router personnalisée dans providers
6. **Configuration Tailwind** : Doit inclure les chemins de thème HeroUI dans le tableau content
7. **Hydratation** : Utiliser `suppressHydrationWarning` dans la balise html pour la compatibilité theme provider
8. **INTERDIT npm run dev** : Ne JAMAIS chercher à relancer `npm run dev` après un fix - le serveur de développement se recharge automatiquement
9. **INTERDIT d'ouvrir la console**: Ne jamais chercher à regarder le résultat dans la console.
