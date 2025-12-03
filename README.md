# 🚀 AI-KO - Système Intelligent

Plateforme intelligente basée sur une architecture microservices avec Docker Compose.

## 📋 Architecture

```
AI-KO/
├── backend/              # API Flask + Celery
├── frontend/             # Next.js 15
├── nginx/                # Reverse Proxy
├── monitoring/           # Prometheus + Grafana
├── scripts/              # Scripts utilitaires
└── docker-compose.yml    # Orchestration
```

## 🛠️ Stack Technologique

- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Backend:** Flask 3.1 + Gunicorn
- **Database:** PostgreSQL 15
- **Cache/Queue:** Redis 7
- **Workers:** Celery 5.4
- **Reverse Proxy:** Nginx
- **Monitoring:** Prometheus + Grafana
- **Container:** Docker + Docker Compose

## 🚀 Démarrage Rapide

### Prérequis

- Docker 24+ et Docker Compose
- Git
- 8GB RAM minimum
- PowerShell (Windows) ou Bash (Linux/Mac)

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd ai-ko
```

2. **Basculer vers Développement**
```bash
# Windows PowerShell
.\switch-env.ps1 dev

# Linux/Mac
./switch-env.sh dev
```

3. **Démarrer les services**
```bash
# Méthode 1: Avec Make (Linux/Mac)
make up

# Méthode 2: Avec PowerShell commands (Windows)
. .\commands.ps1
Up

# Méthode 3: Docker Compose manuel
docker-compose -f docker-compose.dev.yml up -d
```

4. **Vérifier le déploiement**
```bash
# Méthode 1: Commands helper
Health

# Méthode 2: Manuellement
docker-compose ps
curl http://localhost:5000/health
curl http://localhost:3000
```

## 🔄 Gestion des Environnements

### Deux Environnements Configurés

**Développement (DEV)** - Localhost avec Docker
- PostgreSQL & Redis en Docker
- Backend Flask avec hot-reload
- Frontend Next.js sur localhost:3000
- Mode debug activé

**Production (PROD)** - Railway + Vercel
- PostgreSQL Railway
- Redis Railway
- Backend sur Railway
- Frontend sur Vercel
- SSL/HTTPS activé

### Basculement Simple

```bash
# Windows
.\switch-env.ps1 dev    # Basculer vers dev
.\switch-env.ps1 prod   # Basculer vers prod

# Linux/Mac
./switch-env.sh dev     # Basculer vers dev
./switch-env.sh prod    # Basculer vers prod
```

**Documentation complète:** [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)
**Guide rapide:** [QUICK_START.md](./QUICK_START.md)

## 🌐 Accès aux Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Interface utilisateur Next.js |
| Backend API | http://localhost:5000 | API REST Flask |
| Prometheus | http://localhost:9090 | Métriques et monitoring |
| Grafana | http://localhost:3001 | Dashboards (admin/changeme) |
| PostgreSQL | localhost:5432 | Base de données |
| Redis | localhost:6379 | Cache et queue |

## 📝 Commandes Utiles

### Gestion des Services

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Redémarrer un service
docker-compose restart backend

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Status des services
docker-compose ps
```

### Backend

```bash
# Shell interactif
docker-compose exec backend flask shell

# Migrations
docker-compose exec backend flask db migrate -m "description"
docker-compose exec backend flask db upgrade

# Tests
docker-compose exec backend pytest

# Accès terminal
docker-compose exec backend bash
```

### Base de Données

```bash
# Accès PostgreSQL
docker-compose exec postgres psql -U smart_user systeme_intelligent

# Backup
./scripts/backup.sh

# Restore
./scripts/restore.sh 20250121_143000
```

### Monitoring

```bash
# Métriques backend
curl http://localhost:5000/metrics

# Health checks
curl http://localhost:5000/health/detailed
curl http://localhost:3000/api/health
```

## 🔧 Développement

### Structure Backend

```
backend/
├── app/
│   ├── __init__.py          # Factory Flask
│   ├── api/                 # Blueprints API
│   │   ├── health.py        # Health checks
│   │   └── ...
│   ├── models/              # Modèles SQLAlchemy
│   ├── tasks/               # Tâches Celery
│   └── utils/               # Utilitaires
├── migrations/              # Migrations Alembic
├── tests/                   # Tests pytest
├── run.py                   # Point d'entrée
├── celery_app.py           # Configuration Celery
├── requirements.txt         # Dépendances Python
└── Dockerfile              # Image Docker
```

### Structure Frontend

```
frontend/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Page d'accueil
│   └── api/                # API Routes
├── components/             # Composants React
├── lib/                    # Librairies et utils
├── public/                 # Assets statiques
├── package.json            # Dépendances Node
├── next.config.js          # Config Next.js
├── tsconfig.json           # Config TypeScript
└── Dockerfile              # Image Docker
```

### Mode Développement

```bash
# Backend (avec hot-reload)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
flask run --reload

# Frontend (avec hot-reload)
cd frontend
npm install
npm run dev
```

## 📊 Monitoring et Logs

### Prometheus

- Métriques: http://localhost:9090
- Targets: http://localhost:9090/targets
- Alertes: http://localhost:9090/alerts

### Grafana

- Dashboards: http://localhost:3001
- Identifiants par défaut: admin / (voir .env)
- Source de données: Prometheus (préconfigurée)

### Logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f celery_worker

# Logs Nginx
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

## 🔐 Sécurité

### Checklist Production

- [ ] Changer TOUS les mots de passe par défaut
- [ ] Générer des secrets forts (32+ caractères)
- [ ] Configurer SSL/TLS (certificats dans nginx/ssl/)
- [ ] Activer le firewall (ports 80, 443 uniquement)
- [ ] Désactiver les ports de debug (5432, 6379, 9090, 3001)
- [ ] Configurer les backups automatiques
- [ ] Mettre en place les alertes Prometheus
- [ ] Restreindre l'accès à Grafana
- [ ] Activer les logs d'audit
- [ ] Scanner les images Docker (Trivy, Snyk)

### Variables Sensibles

Ne jamais commiter:
- `.env`
- `nginx/ssl/*.pem`
- `*.key`
- Tokens et API keys

## 🧪 Tests

### Backend

```bash
# Tous les tests
docker-compose exec backend pytest

# Avec coverage
docker-compose exec backend pytest --cov=app --cov-report=html

# Tests spécifiques
docker-compose exec backend pytest tests/test_health.py -v
```

### Frontend

```bash
# Tests unitaires
docker-compose exec frontend npm test

# Tests E2E
docker-compose exec frontend npm run test:e2e
```

## 📦 Déploiement Production

### Prérequis Production

1. Serveur Linux (Ubuntu 22.04 LTS recommandé)
2. Docker Engine installé
3. Nom de domaine configuré
4. Certificat SSL/TLS

### Étapes

```bash
# 1. Sur le serveur
git clone <repository-url>
cd ai-ko

# 2. Configurer l'environnement
cp env.example .env
nano .env  # Configurer les variables

# 3. Générer certificats SSL (Let's Encrypt)
sudo certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# 4. Déployer
./scripts/deploy.sh

# 5. Configurer les backups automatiques (cron)
crontab -e
# Ajouter: 0 2 * * * /path/to/ai-ko/scripts/backup.sh
```

## 🆘 Troubleshooting

### Problème: Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier les ports
netstat -tuln | grep -E '3000|5000|5432|6379'

# Reconstruire les images
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Problème: Base de données non accessible

```bash
# Vérifier le statut
docker-compose ps postgres

# Logs PostgreSQL
docker-compose logs postgres

# Vérifier la connexion
docker-compose exec postgres pg_isready -U smart_user
```

### Problème: Redis non accessible

```bash
# Vérifier le statut
docker-compose ps redis

# Tester Redis
docker-compose exec redis redis-cli ping
```

## 📚 Documentation

- [Architecture Technique](.specs/ANALYSE_TECHNIQUE_COMPLETE.md)
- [Spécifications Next.js](.specs/SPECIFICATIONS_NEXTJS.md)
- [Diagrammes](.specs/DIAGRAMMES_MERMAID.md)
- [Index Documentation](.specs/INDEX_DOCUMENTATION.md)
- [MVP Checklist](MVP_CHECKLIST.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE)

## 👥 Support

- 📧 Email: support@ai-ko.com
- 📚 Documentation: https://docs.ai-ko.com
- 🐛 Issues: https://github.com/ai-ko/issues

---

**Made with ❤️ by AI-KO Team**



