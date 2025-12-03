# 🛠️ Commandes Utiles - Dashboard Admin

Aide-mémoire des commandes fréquemment utilisées pour le développement du dashboard.

---

## 🚀 Démarrage

### Backend

```bash
# Naviguer vers le dossier backend
cd backend

# Activer l'environnement virtuel (Linux/Mac)
source venv/bin/activate

# Activer l'environnement virtuel (Windows)
venv\Scripts\activate

# Démarrer Flask en mode développement
flask run

# Démarrer Flask sur un port spécifique
flask run --port 5001

# Démarrer Flask avec rechargement automatique
FLASK_ENV=development flask run
```

### Frontend

```bash
# Naviguer vers le dossier frontend
cd frontend

# Installer les dépendances (première fois)
npm install

# Démarrer le serveur de développement
npm run dev

# Démarrer sur un port spécifique
npm run dev -- -p 3001

# Build de production
npm run build

# Démarrer le serveur de production
npm start
```

### PostgreSQL (Docker)

```bash
# Démarrer PostgreSQL
docker-compose up -d postgres

# Arrêter PostgreSQL
docker-compose down

# Voir les logs
docker-compose logs -f postgres

# Se connecter à PostgreSQL
docker exec -it ai-ko-postgres psql -U postgres -d ai_ko
```

---

## 🗄️ Base de Données

### Migrations

```bash
cd backend

# Créer une nouvelle migration
flask db migrate -m "Description de la migration"

# Appliquer les migrations
flask db upgrade

# Revenir à la migration précédente
flask db downgrade

# Voir l'historique des migrations
flask db history

# Voir la version actuelle
flask db current
```

### PostgreSQL

```bash
# Se connecter à la DB
psql -U postgres -d ai_ko

# Lister les tables
\dt

# Voir la structure d'une table
\d users

# Exécuter une requête SQL
SELECT * FROM users WHERE role = 'admin';

# Quitter psql
\q
```

---

## 🧪 Tests

### Backend

```bash
cd backend

# Exécuter tous les tests
python -m pytest

# Exécuter un fichier de tests spécifique
python -m pytest tests/test_admin_complete.py

# Exécuter avec verbosité
python -m pytest tests/test_admin_complete.py -v

# Exécuter avec coverage
python -m pytest --cov=app tests/

# Exécuter un test spécifique
python -m pytest tests/test_admin_complete.py::test_get_all_etudiants -v

# Afficher les prints pendant les tests
python -m pytest tests/test_admin_complete.py -v -s
```

### Frontend

```bash
cd frontend

# Linting ESLint
npm run lint

# Fixer automatiquement les erreurs de linting
npm run lint:fix

# Vérification TypeScript
npx tsc --noEmit

# Tests unitaires (si configurés)
npm test

# Tests E2E (si configurés)
npm run test:e2e
```

---

## 📦 Gestion des Dépendances

### Backend (Python)

```bash
cd backend

# Installer une nouvelle dépendance
pip install package-name

# Sauvegarder les dépendances
pip freeze > requirements.txt

# Installer depuis requirements.txt
pip install -r requirements.txt

# Créer un environnement virtuel
python -m venv venv
```

### Frontend (Node)

```bash
cd frontend

# Installer une nouvelle dépendance
npm install package-name

# Installer une dépendance de développement
npm install --save-dev package-name

# Désinstaller une dépendance
npm uninstall package-name

# Mettre à jour les dépendances
npm update

# Nettoyer node_modules
rm -rf node_modules package-lock.json
npm install
```

---

## 🔍 Debugging

### Backend

```bash
# Démarrer Flask avec le debugger
FLASK_ENV=development FLASK_DEBUG=1 flask run

# Voir les logs en direct
tail -f logs/app.log

# Python Shell interactif
flask shell
```

### Frontend

```bash
# Nettoyer le cache Next.js
rm -rf .next
npm run dev

# Nettoyer complètement
rm -rf .next node_modules
npm install
npm run dev

# Analyser le bundle
npm run build -- --analyze
```

---

## 🗂️ Git

### Workflow Standard

```bash
# Créer une nouvelle branche
git checkout -b feature/nom-de-la-fonctionnalite

# Voir le statut
git status

# Ajouter des fichiers
git add .
git add frontend/src/app/admin/page.tsx

# Commiter
git commit -m "feat: ajouter page gestion étudiants"

# Pousser la branche
git push origin feature/nom-de-la-fonctionnalite

# Mettre à jour depuis main
git checkout main
git pull origin main
git checkout feature/nom-de-la-fonctionnalite
git rebase main

# Fusionner une branche
git checkout main
git merge feature/nom-de-la-fonctionnalite
```

### Conventional Commits

```bash
# Nouvelle fonctionnalité
git commit -m "feat: ajouter modal de création étudiant"

# Correction de bug
git commit -m "fix: corriger erreur pagination"

# Documentation
git commit -m "docs: mettre à jour README"

# Style/formatage
git commit -m "style: formater code avec prettier"

# Refactoring
git commit -m "refactor: extraire logique dans useEtudiants"

# Test
git commit -m "test: ajouter tests pour UrgentActionsBar"

# Performance
git commit -m "perf: optimiser chargement liste étudiants"
```

---

## 🧹 Nettoyage

### Fichiers Temporaires

```bash
# Backend
cd backend
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Frontend
cd frontend
rm -rf .next
rm -rf node_modules
```

### Logs

```bash
# Backend
cd backend
rm -rf logs/*.log

# Frontend (si applicable)
cd frontend
rm -rf .next/*.log
```

---

## 📊 Monitoring & Performance

### Backend

```bash
# Profiling avec cProfile
python -m cProfile -o profile.stats app.py

# Analyser les stats
python -m pstats profile.stats

# Voir les requêtes SQL lentes
FLASK_SQLALCHEMY_ECHO=True flask run
```

### Frontend

```bash
# Analyser le bundle size
npm run build
du -sh .next

# Lighthouse (performance)
npx lighthouse http://localhost:3000/admin
```

---

## 🔐 Sécurité

### Secrets & Variables d'Environnement

```bash
# Backend
cd backend

# Générer une nouvelle clé secrète
python -c "import secrets; print(secrets.token_hex(32))"

# Vérifier les variables d'environnement
flask shell
>>> import os
>>> os.environ.get('DATABASE_URL')
```

### Dépendances Vulnérables

```bash
# Backend
cd backend
pip-audit

# Frontend
cd frontend
npm audit
npm audit fix
```

---

## 📤 Déploiement

### Backend (Production)

```bash
cd backend

# Build
pip install -r requirements.txt

# Appliquer les migrations
flask db upgrade

# Démarrer avec gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

### Frontend (Production)

```bash
cd frontend

# Build
npm run build

# Démarrer
npm start

# Ou avec PM2
pm2 start npm --name "ai-ko-frontend" -- start
```

---

## 🔧 Utilitaires

### Formatage

```bash
# Backend (Black)
cd backend
black .

# Frontend (Prettier)
cd frontend
npx prettier --write .
```

### Vérification de Type

```bash
# Backend (MyPy)
cd backend
mypy app/

# Frontend (TypeScript)
cd frontend
npx tsc --noEmit
```

### Statistiques du Code

```bash
# Compter les lignes de code
cloc frontend/src

# Avec git
git ls-files | xargs wc -l
```

---

## 🆘 Résolution de Problèmes

### Backend

```bash
# Réinitialiser la DB (⚠️ DANGER : supprime toutes les données)
flask db downgrade base
flask db upgrade

# Vérifier la connexion PostgreSQL
psql -U postgres -h localhost -c "SELECT 1;"

# Vérifier que Flask écoute
curl http://localhost:5000/api/v1/health
```

### Frontend

```bash
# Vérifier que Node/npm fonctionnent
node -v
npm -v

# Nettoyer complètement
rm -rf node_modules .next package-lock.json
npm install
npm run dev

# Vérifier les ports
lsof -i :3000
```

---

## 📝 Logs

### Voir les Logs

```bash
# Backend
tail -f backend/logs/app.log

# Frontend (si configurés)
tail -f frontend/.next/logs/application.log

# Docker
docker-compose logs -f
```

---

## 🎯 Raccourcis Personnalisés (Optionnel)

Ajouter ces alias dans `.bashrc` ou `.zshrc` :

```bash
# Backend
alias be="cd ~/dev/ai-ko/backend && source venv/bin/activate"
alias ber="be && flask run"

# Frontend
alias fe="cd ~/dev/ai-ko/frontend"
alias fer="fe && npm run dev"

# Tests
alias bet="be && python -m pytest tests/test_admin_complete.py -v"

# Git
alias gs="git status"
alias gp="git pull origin main"
alias gc="git commit -m"
```

---

## 📚 Liens Utiles

- **Flask Docs** : https://flask.palletsprojects.com/
- **Next.js Docs** : https://nextjs.org/docs
- **HeroUI Docs** : https://heroui.com/docs
- **PostgreSQL Docs** : https://www.postgresql.org/docs/

---

**Dernière mise à jour :** 29 Novembre 2024  
**Mainteneur :** Équipe AI-KO

---

Bon développement ! 🚀





