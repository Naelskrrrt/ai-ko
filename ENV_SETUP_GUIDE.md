# Guide de Configuration des Environnements - AI-KO

Ce guide explique comment configurer et basculer entre les environnements de développement et de production.

## Structure des Fichiers d'Environnement

```
ai-ko/
├── .env                    # Fichier actif (géré automatiquement, ne pas commiter)
├── .env.dev               # Configuration développement (localhost)
├── .env.prod              # Configuration production (Railway)
├── .env.template          # Template pour créer un nouveau .env
├── switch-env.ps1         # Script Windows PowerShell
├── switch-env.sh          # Script Linux/Mac Bash
├── docker-compose.yml     # Docker Compose production
└── docker-compose.dev.yml # Docker Compose développement
```

## Environnements

### 1. Développement (DEV)

**Caractéristiques:**
- Backend Flask avec hot-reload
- PostgreSQL et Redis en Docker
- Frontend Next.js sur localhost:3000
- API Backend sur localhost:5000
- Mode debug activé
- CORS ouvert pour localhost

**Services:**
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend Flask (port 5000)
- Celery Worker
- Celery Beat

### 2. Production (PROD)

**Caractéristiques:**
- Backend déployé sur Railway
- Frontend déployé sur Vercel
- Base de données PostgreSQL Railway
- Redis Railway
- Mode production optimisé
- CORS configuré pour le domaine de production
- SSL/HTTPS activé

## Basculement entre Environnements

### Windows (PowerShell)

```powershell
# Basculer vers DEV
.\switch-env.ps1 dev

# Basculer vers PROD
.\switch-env.ps1 prod
```

### Linux/Mac (Bash)

```bash
# Basculer vers DEV
./switch-env.sh dev

# Basculer vers PROD
./switch-env.sh prod
```

### Ce que fait le script

1. Sauvegarde l'ancien `.env` avec un timestamp
2. Copie le fichier `.env.[dev|prod]` vers `.env`
3. Affiche la configuration active
4. Donne les instructions suivantes

## Utilisation - Développement

### 1. Basculer vers Dev

```bash
# Windows
.\switch-env.ps1 dev

# Linux/Mac
./switch-env.sh dev
```

### 2. Démarrer les Services Docker

```bash
# Démarrer tous les services
docker-compose -f docker-compose.dev.yml up -d

# Ou utiliser le docker-compose par défaut
docker-compose up -d
```

### 3. Voir les Logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f celery_worker
```

### 4. Accéder aux Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

### 5. Arrêter les Services

```bash
# Arrêter sans supprimer les volumes
docker-compose down

# Arrêter et supprimer les volumes (attention: supprime les données)
docker-compose down -v
```

## Utilisation - Production (Railway)

### 1. Basculer vers Prod

```bash
# Windows
.\switch-env.ps1 prod

# Linux/Mac
./switch-env.sh prod
```

### 2. Configurer les Variables dans Railway UI

Avant de déployer, configurez les variables d'environnement dans Railway:

**Backend Railway:**
```env
DATABASE_URL=postgresql://...  # Fourni automatiquement par Railway
REDIS_URL=redis://...          # Fourni automatiquement par Railway
SECRET_KEY=...                 # Générer avec: openssl rand -hex 32
JWT_SECRET_KEY=...             # Générer avec: openssl rand -hex 32
HF_API_TOKEN=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CORS_ORIGINS=https://your-frontend.vercel.app
FLASK_ENV=production
FLASK_DEBUG=0
```

**Frontend Vercel:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-frontend.vercel.app
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-frontend.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/api/auth/callback/google
```

### 3. Déployer sur Railway

```bash
# Backend
cd backend
railway up

# Frontend (si nécessaire, généralement auto-déployé par Vercel)
cd frontend
vercel --prod
```

### 4. Vérifier le Déploiement

- Backend: https://your-backend.railway.app/health
- Frontend: https://your-frontend.vercel.app

## Commandes Utiles

### Docker

```bash
# Rebuild après changement de code
docker-compose up -d --build

# Accéder à un container
docker-compose exec backend bash
docker-compose exec postgres psql -U root systeme_intelligent_dev

# Voir l'utilisation des ressources
docker stats

# Nettoyer les images inutilisées
docker system prune -a
```

### Migrations de Base de Données

```bash
# Dev (dans le container)
docker-compose exec backend flask db upgrade
docker-compose exec backend flask db migrate -m "Description"

# Prod (Railway)
railway run flask db upgrade
```

### Tests

```bash
# Dev
docker-compose exec backend pytest
docker-compose exec backend pytest --cov=app

# Local sans Docker
cd backend
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate  # Windows
pytest
```

## Sécurité

### Génération de Secrets

```bash
# Linux/Mac/Git Bash
openssl rand -hex 32

# PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Fichiers à Ne Jamais Commiter

- `.env` (fichier actif)
- `.env.backup.*` (sauvegardes)
- Tout fichier contenant des secrets réels

### Fichiers à Commiter

- `.env.dev` (avec des valeurs de dev non sensibles)
- `.env.prod` (template avec variables Railway, sans valeurs réelles)
- `.env.template` (template vide)

## Troubleshooting

### Problème: Le script switch-env ne fonctionne pas

**Windows:**
```powershell
# Autoriser l'exécution de scripts PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Puis réessayer
.\switch-env.ps1 dev
```

**Linux/Mac:**
```bash
# Rendre le script exécutable
chmod +x switch-env.sh

# Puis réessayer
./switch-env.sh dev
```

### Problème: Docker ne démarre pas

```bash
# Vérifier que Docker est lancé
docker ps

# Redémarrer Docker
# Sur Windows: Redémarrer Docker Desktop
# Sur Linux: sudo systemctl restart docker

# Vérifier les logs
docker-compose logs
```

### Problème: Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Recréer la base de données
docker-compose down -v
docker-compose up -d
```

### Problème: Port déjà utilisé

```bash
# Trouver le processus utilisant le port (Linux/Mac)
lsof -i :5000

# Trouver le processus utilisant le port (Windows)
netstat -ano | findstr :5000

# Arrêter le processus ou changer le port dans .env
```

### Problème: CORS Error

**Dev:**
- Vérifier que `CORS_ORIGINS` contient `http://localhost:3000`
- Vérifier que le backend est accessible sur `http://localhost:5000`

**Prod:**
- Vérifier que `CORS_ORIGINS` contient l'URL Vercel exacte
- Vérifier dans Railway UI que la variable est bien configurée

## Checklist de Déploiement Production

Avant de déployer en production:

- [ ] Basculer vers l'environnement prod: `./switch-env.sh prod`
- [ ] Vérifier que toutes les variables d'environnement sont configurées dans Railway UI
- [ ] Générer des secrets forts (SECRET_KEY, JWT_SECRET_KEY, etc.)
- [ ] Configurer les URLs correctes (NEXT_PUBLIC_API_URL, CORS_ORIGINS)
- [ ] Tester les credentials Google OAuth en production
- [ ] Vérifier que FLASK_DEBUG=0 et FLASK_ENV=production
- [ ] Vérifier les migrations de base de données
- [ ] Tester les endpoints API
- [ ] Vérifier les logs Railway
- [ ] Tester l'authentification complète
- [ ] Vérifier les uploads de fichiers
- [ ] Configurer les backups de base de données

## Support

Pour toute question ou problème:

1. Vérifier ce guide
2. Consulter les logs: `docker-compose logs -f`
3. Vérifier l'état des services: `docker-compose ps`
4. Consulter la documentation Railway: https://docs.railway.app
5. Consulter la documentation Vercel: https://vercel.com/docs

---

**Dernière mise à jour:** 2025-12-02
