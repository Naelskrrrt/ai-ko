# 🔍 Script de Vérification MVP

Script Python pour vérifier automatiquement l'état d'avancement du MVP en analysant le code existant.

## 📋 Fonctionnalités

Le script analyse automatiquement :

- ✅ **Structure Backend** (Flask, Clean Architecture)
- ✅ **Authentification** (JWT, rôles, CSRF)
- ✅ **Modèles Base de Données** (SQLAlchemy)
- ✅ **Endpoints API** (tous les modules)
- ✅ **Intégration IA** (Hugging Face, modèles T5/BERT)
- ✅ **Structure Frontend** (Next.js/React)
- ✅ **Pages et Composants** Frontend
- ✅ **Déploiement** (Docker, CI/CD)
- ✅ **Tests** (Backend et Frontend)
- ✅ **Documentation**

## 🚀 Installation

```bash
# Le script utilise uniquement la bibliothèque standard Python
# Aucune dépendance externe requise
python3 --version  # Python 3.7+ requis
```

## 💻 Utilisation

### Utilisation de base

```bash
# Analyse et affiche le rapport dans le terminal (Markdown)
python check_mvp_progress.py

# Génère un rapport HTML
python check_mvp_progress.py --format html --output mvp_report.html

# Génère un rapport JSON
python check_mvp_progress.py --format json --output mvp_report.json

# Spécifier un autre répertoire de projet
python check_mvp_progress.py --project-root /path/to/project
```

### Options disponibles

```bash
python check_mvp_progress.py --help
```

Options :
- `--format, -f` : Format de sortie (`markdown`, `html`, `json`) - default: `markdown`
- `--output, -o` : Fichier de sortie (si non spécifié, affiche dans le terminal)
- `--project-root` : Racine du projet à analyser (default: `.`)

## 📊 Exemples de sortie

### Rapport Markdown

```markdown
# 📊 Rapport de Progression MVP

**Date:** 2025-11-15 14:30:00
**Progression globale:** 45.2% (47/104 items)

## 📈 Statistiques par Catégorie

| Catégorie | Complété | Total | Pourcentage |
|-----------|----------|-------|-------------|
| Authentification | 4 | 5 | 80.0% |
| Module 1 | 3 | 8 | 37.5% |
| ...
```

### Rapport HTML

Génère un fichier HTML avec :
- Barre de progression visuelle
- Statistiques par catégorie
- Détails de chaque élément avec statut (✅/❌)

### Rapport JSON

Format JSON structuré pour intégration dans d'autres outils :

```json
{
  "date": "2025-11-15T14:30:00",
  "completion_percentage": 45.2,
  "total_items": 104,
  "completed_items": 47,
  "categories": {
    "Authentification": {
      "total": 5,
      "completed": 4
    }
  },
  "items": [...]
}
```

## 🔧 Personnalisation

### Ajouter de nouvelles vérifications

Modifiez la classe `MVPChecker` dans `check_mvp_progress.py` :

```python
def _check_ma_nouvelle_fonctionnalite(self):
    """Vérifie ma nouvelle fonctionnalité"""
    has_feature = self._search_in_files(r"pattern", "backend")
    self._add_item("Ma Catégorie", "Ma fonctionnalité",
                  len(has_feature) > 0, "Détails...")
```

Puis ajoutez l'appel dans `check_all()` :

```python
def check_all(self) -> MVPProgress:
    # ...
    self._check_ma_nouvelle_fonctionnalite()
    # ...
```

## 📝 Notes

- Le script utilise des expressions régulières pour détecter les patterns dans le code
- Les résultats sont indicatifs et peuvent nécessiter une vérification manuelle
- Certaines vérifications peuvent être des faux positifs/négatifs selon la structure du code
- Le script analyse uniquement les fichiers `.py`, `.ts`, `.tsx`, `.js`, `.jsx`

## 🐛 Dépannage

### Le script ne trouve pas certains fichiers

Vérifiez que vous êtes dans le bon répertoire :
```bash
pwd  # Doit être à la racine du projet
ls   # Doit contenir backend/ et frontend-nextjs/
```

### Erreurs d'encodage

Le script gère automatiquement les erreurs d'encodage avec `errors='ignore'`.

### Performance

Pour de gros projets, le script peut prendre quelques secondes. C'est normal.

## 🔄 Intégration CI/CD

Exemple d'intégration dans GitHub Actions :

```yaml
name: MVP Progress Check

on:
  schedule:
    - cron: '0 0 * * *'  # Tous les jours
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Check MVP Progress
        run: |
          python check_mvp_progress.py --format html --output mvp_report.html
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: mvp-report
          path: mvp_report.html
```

## 📚 Références

- Voir `MVP_CHECKLIST.md` pour la checklist complète
- Voir `.specs/` pour les spécifications techniques détaillées



