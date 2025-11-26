# Scripts d'enrichissement de la base de données

## seed_niveaux_matieres.py

Ce script enrichit la base de données avec :
- **6 niveaux** universitaires (L1, L2, L3, M1, M2, Doctorat)
- **25 matières** orientées informatique

### Utilisation

#### Avec Docker Compose (Recommandé)

```bash
# Depuis la racine du projet
docker-compose exec backend python scripts/seed_niveaux_matieres.py
```

#### Sans Docker (environnement virtuel local)

```bash
# Depuis le dossier backend
python scripts/seed_niveaux_matieres.py
```

### Contenu des données

#### Niveaux créés
- L1 (Licence 1)
- L2 (Licence 2)
- L3 (Licence 3)
- M1 (Master 1)
- M2 (Master 2)
- D (Doctorat)

#### Matières créées (25 matières)

**Programmation** (4)
- PROG101 - Introduction à la Programmation
- PROG201 - Programmation Python
- PROG301 - Programmation Java
- PROG401 - Programmation C/C++

**Algorithmique** (3)
- ALGO101 - Algorithmique Fondamentale
- ALGO201 - Structures de Données
- ALGO301 - Algorithmique Avancée

**Bases de Données** (2)
- BDD101 - Bases de Données Relationnelles
- BDD201 - Bases de Données Avancées

**Développement Web** (3)
- WEB101 - Développement Web Frontend
- WEB201 - Développement Web Backend
- WEB301 - Développement Web Full-Stack

**Réseaux et Systèmes** (3)
- SYS101 - Systèmes d'Exploitation
- NET101 - Réseaux Informatiques
- SEC101 - Sécurité Informatique

**Intelligence Artificielle** (3)
- IA101 - Introduction à l'IA
- ML201 - Machine Learning
- DL301 - Deep Learning

**Génie Logiciel** (2)
- GL101 - Génie Logiciel
- GL201 - Architecture Logicielle

**Mathématiques** (2)
- MATH101 - Mathématiques pour l'Informatique
- STAT101 - Probabilités et Statistiques

**Projet et Stage** (2)
- PROJ301 - Projet de Développement
- STAGE401 - Stage en Entreprise

### Notes

- Le script vérifie si les données existent déjà (par code unique)
- Peut être exécuté plusieurs fois sans créer de doublons
- Les couleurs sont au format hexadécimal pour l'UI
- Les coefficients varient de 1.0 à 4.0
