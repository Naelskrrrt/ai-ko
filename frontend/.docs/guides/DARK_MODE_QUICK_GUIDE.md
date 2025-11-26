# 🎨 Guide Rapide - Dark Mode Coding

## 🚀 Quick Start

### Pour un nouvel élément, toujours faire:

```tsx
// ✅ BON - Utiliser les classes adaptées au thème
<p className="text-color-primary dark:text-color-primary">
  Texte qui s'adapte automatiquement
</p>

// ✅ BON - Utiliser les tokens de couleur HeroUI
<div className="bg-primary text-primary">
  Utilise les couleurs du thème
</div>

// ✅ BON - Ajouter des variantes pour les backgrounds
<button className="bg-primary/10 dark:bg-primary/20 text-primary">
  Bouton adapté au thème
</button>

// ✅ BON - Pour les éléments neutres
<span className="text-default-600 dark:text-default-300">
  Texte neutre
</span>
```

---

## ❌ Anti-Patterns

```tsx
// ❌ MAUVAIS - Couleurs brutes hardcodées
<p className="text-gray-600">Invisible en dark mode!</p>

// ❌ MAUVAIS - Gradients sans variantes dark
<div className="bg-gradient-to-r from-primary/10 to-secondary/10">
  Trop clair en dark mode
</div>

// ❌ MAUVAIS - Mélanger les systèmes
<div className="bg-blue-50 text-primary">
  Incohérent
</div>

// ❌ MAUVAIS - Oublier les secondaires
<div className="text-gray-500">
  Sera trop foncé en dark mode
</div>
```

---

## 📋 Checklist Avant Commit

### Pour chaque fichier de composant/page modifié:

- [ ] Tous les textes utilisent `text-color-*` ou `text-default-*`?
- [ ] Les fonds utilisent `bg-color-*` ou `bg-content-*`?
- [ ] Les gradients ont des variantes `dark:`?
- [ ] Les bordures utilisent `border-color` ou `border-divider`?
- [ ] Les couleurs neutres sont vraiment neutres?
- [ ] Testé en mode dark et light?
- [ ] Aucune couleur brute (gray-*, slate-*, etc.)?

---

## 🎯 Patterns Courants

### Cartes & Conteneurs

```tsx
// ✅ Carte adaptée au thème
<div className="bg-content1 border border-divider rounded-lg p-4">
  <h3 className="text-color-primary font-semibold">Titre</h3>
  <p className="text-color-secondary">Description</p>
</div>
```

### Textes Hiérarchisés

```tsx
<div className="space-y-2">
  <h1 className="text-color-primary text-2xl font-bold">
    Titre principal
  </h1>
  <h2 className="text-color-secondary text-lg font-semibold">
    Sous-titre
  </h2>
  <p className="text-color-tertiary text-sm">
    Texte secondaire
  </p>
  <p className="text-default-500 text-xs">
    Texte désactivé
  </p>
</div>
```

### Boutons Colorés

```tsx
// ✅ Primaire
<button className="bg-primary/10 dark:bg-primary/20 text-primary 
                   hover:bg-primary/20 dark:hover:bg-primary/30">
  Bouton primaire
</button>

// ✅ Succès
<button className="bg-success/10 dark:bg-success/20 text-success 
                   hover:bg-success/20 dark:hover:bg-success/30">
  Bouton succès
</button>

// ✅ Danger
<button className="bg-danger/10 dark:bg-danger/20 text-danger 
                   hover:bg-danger/20 dark:hover:bg-danger/30">
  Bouton danger
</button>
```

### Éléments Neutres (gris)

```tsx
// ✅ Pour les éléments secondaires
<div className="text-default-600 dark:text-default-300">
  Élément neutre
</div>

// ✅ Pour les bordures
<div className="border-2 border-color">
  Avec bordure adaptée
</div>

// ✅ Pour les fonds neutres
<div className="bg-color-secondary dark:bg-color-tertiary">
  Fond neutre
</div>
```

### Gradients

```tsx
// ✅ Gradient adapté au thème
<div className="bg-gradient-to-r 
               from-primary/10 dark:from-primary/20 
               to-secondary/10 dark:to-secondary/20">
  Gradient magnifique dans les deux modes
</div>

// ✅ Gradient complexe
<div className="bg-gradient-to-br 
               from-primary-50 dark:from-primary-900 
               to-secondary-50 dark:to-secondary-900">
  Très adaptatif
</div>
```

### Icônes & Accents

```tsx
// ✅ Icône colorée
<Icon className="w-5 h-5 text-primary" />

// ✅ Icône neutre
<Icon className="w-5 h-5 text-default-400 dark:text-default-500" />

// ✅ Icône désactivée
<Icon className="w-5 h-5 text-default-300 dark:text-default-600" />
```

---

## 🧬 Variables CSS Disponibles

### Couleurs de Texte
```css
var(--color-text-primary)     /* Texte principal */
var(--color-text-secondary)   /* Texte secondaire */
var(--color-text-tertiary)    /* Texte tertiaire */
var(--color-text-inverse)     /* Inverse (blanc/noir) */
```

### Couleurs de Fond
```css
var(--color-bg-primary)       /* Fond principal */
var(--color-bg-secondary)     /* Fond secondaire */
var(--color-bg-tertiary)      /* Fond tertiaire */
var(--color-bg-inverse)       /* Fond inverse */
```

### Bordures
```css
var(--color-border)           /* Bordure standard */
var(--color-border-subtle)    /* Bordure subtile */
var(--color-divider)          /* Divider */
```

### UI
```css
var(--color-ui-hover)         /* État hover */
var(--color-ui-active)        /* État actif */
var(--color-ui-disabled)      /* Désactivé */
```

### Overlay
```css
var(--color-overlay)          /* Overlay standard */
var(--color-overlay-strong)   /* Overlay forte */
```

---

## 🔄 Migration depuis l'ancien code

### Avant
```tsx
<p className="text-gray-600">Vieux texte</p>
<div className="bg-gray-50">Vieux fond</div>
```

### Après
```tsx
<p className="text-color-secondary">Texte adapté</p>
<div className="bg-color-secondary">Fond adapté</div>
```

### Gradient Migration
Avant:
```tsx
<div className="bg-gradient-to-r from-primary/10 to-secondary/10">
```

Après:
```tsx
<div className="bg-gradient-to-r 
               from-primary/10 dark:from-primary/20 
               to-secondary/10 dark:to-secondary/20">
```

---

## 🎨 Palette Mémorisable

| Usage | Light | Dark | Classe |
|-------|-------|------|--------|
| Texte principal | #0f172a | #f1f5f9 | `text-color-primary` |
| Texte secondaire | #475569 | #cbd5e1 | `text-color-secondary` |
| Texte tertiaire | #94a3b8 | #64748b | `text-color-tertiary` |
| Fond principal | #ffffff | #0f172a | `bg-color-primary` |
| Fond secondaire | #f8fafc | #1e293b | `bg-color-secondary` |
| Fond tertiaire | #f1f5f9 | #334155 | `bg-color-tertiary` |
| Primaire | #9d53ff | #9d53ff | `primary` (constant) |
| Succès | #10b981 | #10b981 | `success` (constant) |
| Danger | #dc2626 | #dc2626 | `danger` (constant) |

---

## 🚨 Erreurs Courantes

### 1. Oublier les variantes dark

```tsx
// ❌ ERREUR
<button className="bg-primary/10">Invisible!</button>

// ✅ CORRIGER
<button className="bg-primary/10 dark:bg-primary/20">Ok!</button>
```

### 2. Utiliser les mauvaises classes pour les neutres

```tsx
// ❌ ERREUR
<span className="text-gray-500">Trop foncé en dark</span>

// ✅ CORRIGER
<span className="text-default-500 dark:text-default-400">Ok</span>
```

### 3. Gradients non adaptés

```tsx
// ❌ ERREUR
<div className="bg-gradient-to-r from-slate-100 to-slate-200">
  Trop clair en dark mode
</div>

// ✅ CORRIGER  
<div className="bg-gradient-to-r 
               from-slate-100 dark:from-slate-800
               to-slate-200 dark:to-slate-700">
  Magnifique
</div>
```

### 4. Mélanger les systèmes

```tsx
// ❌ ERREUR
<div className="bg-primary-50 text-gray-700">Incohérent</div>

// ✅ CORRIGER
<div className="bg-primary-50 dark:bg-primary-900 
               text-default-700 dark:text-default-200">
  Cohérent
</div>
```

---

## 🧪 Testing Dark Mode

### Chrome DevTools

1. Ouvrir DevTools (F12)
2. Cmd/Ctrl + Shift + P
3. Taper "dark mode"
4. Sélectionner "Emulate CSS media feature prefers-color-scheme"
5. Choisir "dark"

### Firefox DevTools

1. Ouvrir DevTools (F12)
2. Settings → Inspector
3. Cocher "Emulate CSS media features"
4. about:config → set `ui.systemUsesDarkTheme = 1`

### Tests Recommandés

```
✅ Page charges en mode dark par défaut?
✅ Tous les textes sont lisibles?
✅ Les contrastes respectent WCAG AA (4.5:1)?
✅ Les boutons sont cliquables?
✅ Les images sont bien visibles?
✅ Les forms sont utilisables?
✅ Les notifications sont visibles?
✅ Le toggle theme fonctionne?
```

---

## 📞 Support & Questions

Pour des questions sur le dark mode:

1. Consulter `DARK_MODE_IMPROVEMENTS.md` pour le contexte complet
2. Vérifier les patterns dans ce guide
3. Tester en DevTools avant de committer
4. Soumettre une PR si vous trouvez des améliorations

---

**Dernière mise à jour:** October 20, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
