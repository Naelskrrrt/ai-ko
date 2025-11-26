# Système de Thèmes de Couleur

## Vue d'ensemble

Le template frontend inclut maintenant un **système de thèmes de couleur extensible et dynamique** qui permet aux utilisateurs de personnaliser l'apparence de **toute l'application** via une pastille colorée dans la navbar. Le thème est appliqué globalement à tous les composants via un système de variables CSS et un Provider React.

Le **thème par défaut** utilise une interface neutre (blanc/gris) avec des **accents vert émeraude dynamiques** pour les éléments interactifs (boutons, liens, états actifs). Les utilisateurs peuvent choisir parmi plusieurs thèmes prédéfinis (vert émeraude, rouge orangé, bleu indigo, rose bonbon).

## Distinction : Couleurs de thème vs Couleurs sémantiques

### 🎨 Couleurs de thème (Dynamiques)

Les **couleurs de thème** changent selon la préférence utilisateur et sont utilisées pour :
- **Éléments de marque** : logos, titres principaux, accents visuels
- **Navigation** : liens actifs, boutons d'action principaux
- **Mise en valeur** : cartes de présentation, statistiques, badges
- **Éléments interactifs** : boutons primaires, onglets actifs, focus

**Classes disponibles** : `bg-theme-primary`, `text-theme-secondary`, `border-theme-accent`

**Exemple** :
```tsx
<Button className="bg-theme-primary text-white">
  Action principale
</Button>
```

### ⚠️ Couleurs sémantiques (Fixes)

Les **couleurs sémantiques** ont une **signification universelle** et ne changent JAMAIS :
- **Success (Vert)** : validation, succès, confirmation ✅
- **Danger (Rouge)** : erreurs, suppressions, alertes critiques ❌
- **Warning (Jaune/Orange)** : avertissements, actions importantes ⚠️
- **Info (Bleu)** : informations neutres, aide ℹ️

**Classes HeroUI** : `color="success"`, `color="danger"`, `color="warning"`

**Exemple** :
```tsx
{/* ✅ Correct - Message de succès en VERT */}
<Alert color="success">
  Enregistrement réussi !
</Alert>

{/* ❌ Incorrect - NE PAS utiliser le thème pour les états */}
<Alert className="bg-theme-primary">
  Enregistrement réussi !
</Alert>
```

### 📋 Quand utiliser quoi ?

| Élément | Type | Raison |
|---------|------|--------|
| Bouton "Connexion" | 🎨 Thème | Action de marque |
| Bouton "Supprimer" | ⚠️ Danger (rouge) | Action destructive |
| Message "Succès" | ⚠️ Success (vert) | État de validation |
| Carte de présentation | 🎨 Thème | Élément esthétique |
| Badge "Admin" | 🎨 Thème | Élément de marque |
| Alerte "Erreur réseau" | ⚠️ Danger (rouge) | Problème critique |
| Statistiques homepage | 🎨 Thème | Présentation visuelle |
| Formulaire validé | ⚠️ Success (vert) | État sémantique |

## Architecture

### Fichiers principaux

- **`src/core/types/theme.ts`** : Définition des types, configuration des thèmes et fonction de génération de palettes
- **`src/core/hooks/useColorTheme.ts`** : Hook React pour gérer le thème actif
- **`src/components/color-theme-provider.tsx`** : Provider React qui gère l'état global du thème
- **`src/components/theme-color-switch.tsx`** : Composant UI de la pastille dans la navbar
- **`src/app/providers.tsx`** : Intégration du ColorThemeProvider dans l'app
- **`src/styles/globals.css`** : Classes CSS utilitaires pour le système de thème

## Fonctionnement

### 1. Génération automatique de palettes

Le système génère automatiquement des palettes de couleurs complètes (50-950) à partir d'une seule couleur de base :

```typescript
const palette = generateColorPalette("#6b7280");
// Génère automatiquement : 50, 100, 200, ..., 900, 950, DEFAULT, foreground
```

### 2. Variables CSS dynamiques

Le `ColorThemeProvider` applique automatiquement les variables CSS à la racine du document :

- `--color-theme-primary`
- `--color-theme-primary-50` à `--color-theme-primary-950`
- `--color-theme-secondary` + variantes
- `--color-theme-accent` + variantes

### 3. Classes CSS utilitaires

Des classes CSS prêtes à l'emploi sont disponibles dans `globals.css` :

```css
.text-theme-primary          /* Texte couleur primaire */
.bg-theme-primary            /* Fond couleur primaire */
.bg-theme-primary/10         /* Fond primaire avec opacité 10% */
.hover:bg-theme-primary      /* Hover avec fond primaire */
.border-theme-primary        /* Bordure couleur primaire */
```

## Utilisation

### Dans un composant React

```tsx
import { useColorTheme } from "@/core/hooks";

function MyComponent() {
  const { colorTheme, setColorTheme, currentTheme } = useColorTheme();

  return (
    <div>
      <p>Thème actuel : {currentTheme.name}</p>
      <button onClick={() => setColorTheme("redOrange")}>
        Passer au rouge orangé
      </button>
    </div>
  );
}
```

### Avec les classes CSS

```tsx
function MyButton() {
  return (
    <button className="bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 border-theme-primary">
      Bouton avec thème dynamique
    </button>
  );
}
```

### Avec les variables CSS personnalisées

```tsx
function MyCard() {
  return (
    <div style={{ 
      backgroundColor: 'var(--color-theme-primary-50)',
      borderColor: 'var(--color-theme-primary)',
      color: 'var(--color-theme-primary-900)'
    }}>
      Card avec variables CSS
    </div>
  );
}
```

## Ajouter un nouveau thème

Pour ajouter un nouveau thème de couleur, modifiez simplement le fichier `src/core/types/theme.ts`. Le système génère automatiquement toutes les variantes nécessaires :

```typescript
export const COLOR_THEMES: Record<string, ColorTheme> = {
  emerald: {
    id: "emerald",
    name: "Vert Émeraude",
    description: "Thème vert émeraude naturel et apaisant (par défaut)",
    colors: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#10b981",
    },
    badgeColor: "#059669",
  },
  redOrange: {
    id: "redOrange",
    name: "Rouge Orangé",
    description: "Thème rouge orangé chaleureux",
    colors: {
      primary: "#ff6347",
      secondary: "#ff4500",
      accent: "#ff7f50",
    },
    badgeColor: "#ff6347",
  },
  // Nouveau thème - ajoutez simplement 3 couleurs hex
  blue: {
    id: "blue",
    name: "Bleu",
    description: "Thème bleu moderne",
    colors: {
      primary: "#3b82f6",
      secondary: "#2563eb",
      accent: "#60a5fa",
    },
    badgeColor: "#3b82f6",
  },
  // Ajoutez autant de thèmes que vous voulez...
};
```

**C'est tout !** Le système s'occupe automatiquement de :
- Générer les palettes complètes (50 à 950)
- Calculer les couleurs de texte optimales (noir/blanc selon la luminosité)
- Appliquer les variables CSS globalement
- Rendre le thème disponible dans le sélecteur

### Propriétés d'un thème

- **`id`** : Identifiant unique du thème (utilisé pour la persistance)
- **`name`** : Nom affiché dans l'interface utilisateur
- **`description`** : Description optionnelle affichée dans le menu déroulant
- **`colors.primary`** : Couleur principale (format hex)
- **`colors.secondary`** : Couleur secondaire (format hex)
- **`colors.accent`** : Couleur d'accent optionnelle (format hex)
- **`badgeColor`** : Couleur de la pastille dans la navbar (format hex)

## Fonctionnalités

### Persistance automatique

Le thème sélectionné est automatiquement sauvegardé dans le `localStorage` (clé : `color-theme`) et restauré au prochain chargement de la page.

### Variables CSS globales

Le `ColorThemeProvider` expose automatiquement les couleurs du thème actif comme variables CSS :

**Variables principales :**
- `--color-theme-primary`
- `--color-theme-secondary`
- `--color-theme-accent`

**Palettes complètes (auto-générées) :**
- `--color-theme-primary-50` à `--color-theme-primary-950`
- `--color-theme-primary-DEFAULT`
- `--color-theme-primary-foreground` (couleur de texte optimale)
- Idem pour `secondary` et `accent`

### Classes CSS utilitaires

Disponibles dans `src/styles/globals.css` :

**Couleurs de texte :**
```css
.text-theme-primary          /* Couleur primaire du thème */
.text-theme-secondary        /* Couleur secondaire */
.text-theme-accent          /* Couleur d'accent */
```

**Couleurs de fond :**
```css
.bg-theme-primary           /* Fond plein */
.bg-theme-primary-50        /* Fond très clair */
.bg-theme-primary-100       /* Fond clair */
.bg-theme-primary/10        /* Fond avec 10% d'opacité */
.bg-theme-primary/20        /* Fond avec 20% d'opacité */
.bg-theme-primary/30        /* Fond avec 30% d'opacité */
```

**États hover :**
```css
.hover:bg-theme-primary            /* Hover fond plein */
.hover:bg-theme-primary/20         /* Hover fond avec opacité */
.hover:text-theme-primary          /* Hover texte */
.hover:text-theme-primary/80       /* Hover texte avec opacité */
```

**Support dark mode :**
```css
.dark:bg-theme-primary/20          /* Fond en dark mode */
.dark:hover:bg-theme-primary/30    /* Hover en dark mode */
```

**Bordures :**
```css
.border-theme-primary       /* Bordure couleur primaire */
.border-theme-secondary     /* Bordure couleur secondaire */
.focus:border-theme-primary /* Focus avec bordure primaire */
```

### Génération automatique de palettes

La fonction `generateColorPalette()` crée automatiquement :
- **Variantes claires** (50-400) : pour les fonds, backgrounds légers
- **Couleur de base** (500) : couleur principale
- **Variantes foncées** (600-950) : pour les textes, bordures, états hover
- **Foreground** : couleur de texte optimale (noir ou blanc selon la luminosité)

Algorithme intelligent :
- Calcule la luminosité de la couleur de base
- Génère des variantes harmonieuses
- Assure un contraste optimal pour l'accessibilité

## Interface utilisateur

La pastille de thème apparaît dans la navbar :
- **Desktop** : À gauche du ThemeSwitch (clair/sombre)
- **Mobile** : Dans la barre supérieure à côté du ThemeSwitch

### Interactions

- **Clic sur la pastille** : Ouvre un menu déroulant avec tous les thèmes disponibles
- **Sélection d'un thème** : Change immédiatement le thème et sauvegarde le choix
- **Hover** : La pastille s'agrandit légèrement avec une ombre

## Exemples de thèmes suggérés

Voici quelques suggestions de thèmes que vous pourriez ajouter. Il suffit de fournir 3 couleurs hex, le reste est automatique !

### Violet (basé sur la couleur primaire existante)
```typescript
purple: {
  id: "purple",
  name: "Violet",
  description: "Thème violet créatif",
  colors: {
    primary: "#9d53ff",
    secondary: "#8b5cf6",
    accent: "#c084fc",
  },
  badgeColor: "#9d53ff",
}
```

### Bleu
```typescript
blue: {
  id: "blue",
  name: "Bleu",
  description: "Thème bleu moderne",
  colors: {
    primary: "#3b82f6",
    secondary: "#2563eb",
    accent: "#60a5fa",
  },
  badgeColor: "#3b82f6",
}
```

### Vert
```typescript
green: {
  id: "green",
  name: "Vert",
  description: "Thème vert naturel",
  colors: {
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
  },
  badgeColor: "#10b981",
}
```

### Rose
```typescript
rose: {
  id: "rose",
  name: "Rose",
  description: "Thème rose élégant",
  colors: {
    primary: "#f43f5e",
    secondary: "#e11d48",
    accent: "#fb7185",
  },
  badgeColor: "#f43f5e",
}
```

### Orange
```typescript
orange: {
  id: "orange",
  name: "Orange",
  description: "Thème orange énergique",
  colors: {
    primary: "#f97316",
    secondary: "#ea580c",
    accent: "#fb923c",
  },
  badgeColor: "#f97316",
}
```

### Cyan
```typescript
cyan: {
  id: "cyan",
  name: "Cyan",
  description: "Thème cyan moderne",
  colors: {
    primary: "#06b6d4",
    secondary: "#0891b2",
    accent: "#22d3ee",
  },
  badgeColor: "#06b6d4",
}
```

### Indigo
```typescript
indigo: {
  id: "indigo",
  name: "Indigo",
  description: "Thème indigo profond",
  colors: {
    primary: "#6366f1",
    secondary: "#4f46e5",
    accent: "#818cf8",
  },
  badgeColor: "#6366f1",
}
```

## Notes techniques

### Architecture du système

1. **Provider React (`ColorThemeProvider`)** : Gère l'état global du thème
2. **Hook (`useColorTheme`)** : Interface pour accéder au thème depuis n'importe quel composant
3. **Génération de palettes** : Algorithme automatique pour créer des variations harmonieuses
4. **Variables CSS** : Appliquées dynamiquement sur `:root` pour une portée globale
5. **Classes utilitaires** : Prêtes à l'emploi dans `globals.css`
6. **Configuration Tailwind** : Le `tailwind.config.js` ne contient plus de couleurs fixes - tout est dynamique

### Détails d'implémentation

- **Persistance** : `localStorage` (clé : `color-theme`)
- **Thème par défaut** : `emerald` (vert émeraude)
- **SSR Safe** : Gestion automatique du chargement avec état `isLoaded`
- **Attribut data** : `data-color-theme` ajouté sur `<html>` pour les sélecteurs CSS
- **Performance** : Variables CSS appliquées une seule fois, pas de re-render global
- **Séparation des préoccupations** : Les couleurs Tailwind fixes (violet) ont été supprimées pour éviter les conflits

### Compatibilité

- ✅ Compatible avec le système de thèmes clair/sombre (NextThemes)
- ✅ Compatible avec HeroUI
- ✅ Compatible avec Tailwind CSS v4
- ✅ Support complet du dark mode
- ✅ SSR/SSG avec Next.js 15

### Avantages de cette approche

1. **Simplicité** : Ajoutez un thème en 5 lignes de code
2. **Automatique** : Génération de palettes complètes
3. **Global** : Un changement affecte toute l'app instantanément
4. **Performant** : Variables CSS natives, pas de re-render
5. **Flexible** : Utilisable avec classes CSS ou variables personnalisées
6. **Type-safe** : TypeScript pour la sécurité des types
7. **Persistant** : Le choix est sauvegardé automatiquement

## Migration et utilisation dans les composants existants

Pour adapter un composant existant au système de thème, remplacez les couleurs fixes par les classes de thème **uniquement pour les éléments non-sémantiques** :

### Migration des éléments de marque

**Avant :**
```tsx
<Button className="bg-purple-600 text-white hover:bg-purple-700">
  Cliquez ici
</Button>
```

**Après :**
```tsx
<Button className="bg-theme-primary text-white hover:bg-theme-primary/90">
  Cliquez ici
</Button>
```

### Conservation des couleurs sémantiques

**Avant (❌ ne changez rien) :**
```tsx
<Button color="danger" onClick={handleDelete}>
  Supprimer
</Button>

<Alert color="success">
  Opération réussie !
</Alert>

<Badge color="warning">
  Attention
</Badge>
```

**Après (✅ gardez tel quel) :**
```tsx
{/* Les couleurs sémantiques restent TOUJOURS fixes */}
<Button color="danger" onClick={handleDelete}>
  Supprimer
</Button>

<Alert color="success">
  Opération réussie !
</Alert>

<Badge color="warning">
  Attention
</Badge>
```

### Checklist de migration

Lors de la migration d'une page, demandez-vous pour chaque élément :

1. **"Est-ce que cet élément a une signification universelle ?"**
   - ✅ Oui → Gardez la couleur sémantique (success/danger/warning)
   - ❌ Non → Utilisez le système de thème

2. **"Est-ce que cette couleur communique un état ou une action importante ?"**
   - ✅ Oui → Couleur sémantique
   - ❌ Non → Couleur de thème

3. **"Si je change le thème, est-ce que la signification de cet élément change ?"**
   - ✅ Oui → Gardez la couleur sémantique
   - ❌ Non → Couleur de thème appropriée

## Intégration avec HeroUI

Le système coexiste parfaitement avec les thèmes HeroUI. Vous pouvez :
- Utiliser les **couleurs de thème** (`theme-primary`, `theme-secondary`, etc.) pour les éléments de marque et esthétiques
- Utiliser les **couleurs sémantiques HeroUI** (`success`, `danger`, `warning`, `default`) pour les états et messages
- Combiner les deux selon les besoins de votre interface

**Exemple mixte :**
```tsx
<Card className="bg-content1">
  {/* Titre avec couleur de thème (branding) */}
  <CardHeader className="text-theme-primary">
    Dashboard utilisateur
  </CardHeader>
  
  <CardBody>
    {/* Bouton d'action avec thème */}
    <Button className="bg-theme-primary text-white">
      Voir le profil
    </Button>
    
    {/* Bouton de suppression avec couleur sémantique */}
    <Button color="danger" variant="flat">
      Supprimer le compte
    </Button>
  </CardBody>
  
  {/* Messages avec couleurs sémantiques */}
  <CardFooter>
    <Chip color="success" size="sm">Compte vérifié</Chip>
    <Chip color="warning" size="sm">Action requise</Chip>
  </CardFooter>
</Card>
```

## Exemples pratiques

### ✅ Bon usage

```tsx
// Page d'accueil avec thème
<div className="bg-gradient-to-r from-theme-primary-50 to-theme-secondary-50">
  <h1 className={title({ color: "secondary" })}>Bienvenue</h1>
  <Button className="bg-theme-primary">Commencer</Button>
</div>

// Formulaire avec états sémantiques
<form>
  <Input 
    label="Email" 
    color="default"  // Neutre par défaut
    errorMessage="Email invalide"
    isInvalid={hasError}
    color={hasError ? "danger" : "default"}  // Rouge si erreur
  />
  <Button type="submit" color="success">  // Vert pour confirmer
    Valider
  </Button>
</form>
```

### ❌ Mauvais usage

```tsx
// ❌ N'utilisez PAS le thème pour les messages d'erreur
<Alert className="bg-theme-primary text-white">
  Erreur : Fichier introuvable
</Alert>

// ✅ Utilisez plutôt la couleur sémantique
<Alert color="danger">
  Erreur : Fichier introuvable
</Alert>

// ❌ N'utilisez PAS de couleur fixe pour le branding
<Button className="bg-purple-600">
  Action principale
</Button>

// ✅ Utilisez le thème pour s'adapter aux préférences
<Button className="bg-theme-primary">
  Action principale
</Button>
```
