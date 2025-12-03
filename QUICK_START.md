# Quick Start - AI-KO

Guide rapide pour démarrer le projet en 5 minutes.

## Prérequis

- Docker & Docker Compose installés
- Git installé
- PowerShell (Windows) ou Bash (Linux/Mac)

## Démarrage Rapide - Développement

### 1. Cloner le Projet

```bash
git clone <repository-url>
cd ai-ko
```

### 2. Basculer vers Dev

**Windows:**
```powershell
.\switch-env.ps1 dev
```

**Linux/Mac:**
```bash
./switch-env.sh dev
```

### 3. Démarrer Docker

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Accéder à l'Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs (si configuré)

### 5. Voir les Logs

```bash
docker-compose logs -f
```

### 6. Arrêter

```bash
docker-compose down
```

## Démarrage Rapide - Production

### 1. Basculer vers Prod

**Windows:**
```powershell
.\switch-env.ps1 prod
```

**Linux/Mac:**
```bash
./switch-env.sh prod
```

### 2. Configurer Railway

Aller sur Railway UI et configurer les variables d'environnement:

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `HF_API_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CORS_ORIGINS`

### 3. Déployer

```bash
# Backend
cd backend
railway up

# Frontend (auto-déployé par Vercel généralement)
```

## Commandes Essentielles

### Docker

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f [service-name]

# Rebuild
docker-compose up -d --build

# Voir l'état
docker-compose ps
```

### Migrations

```bash
# Appliquer les migrations
docker-compose exec backend flask db upgrade

# Créer une nouvelle migration
docker-compose exec backend flask db migrate -m "Description"
```

### Tests

```bash
# Lancer les tests
docker-compose exec backend pytest

# Avec coverage
docker-compose exec backend pytest --cov=app
```

## Structure du Projet

```
ai-ko/
├── backend/              # API Flask
│   ├── app/             # Code principal
│   ├── migrations/      # Migrations Alembic
│   └── tests/           # Tests
├── frontend/            # Next.js App
│   ├── src/
│   └── public/
├── .env                 # Environnement actif (auto-généré)
├── .env.dev            # Config dev
├── .env.prod           # Config prod
├── switch-env.ps1      # Script Windows
├── switch-env.sh       # Script Linux/Mac
└── docker-compose.dev.yml
```

## Variables d'Environnement Importantes

### Développement
- `FLASK_ENV=development`
- `FLASK_DEBUG=1`
- `NEXT_PUBLIC_API_URL=http://localhost:5000`
- `CORS_ORIGINS=http://localhost:3000`

### Production
- `FLASK_ENV=production`
- `FLASK_DEBUG=0`
- `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
- `CORS_ORIGINS=https://your-frontend.vercel.app`

## Troubleshooting Rapide

### Port déjà utilisé

```bash
# Changer le port dans .env
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

### Erreur Docker

```bash
# Redémarrer Docker
docker-compose down
docker-compose up -d

# Rebuild complet
docker-compose down -v
docker-compose up -d --build
```

### Erreur de connexion DB

```bash
# Recréer la base de données
docker-compose down -v
docker-compose up -d
```

## Support

Consultez le guide complet: [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)

---

**Bon développement!**
