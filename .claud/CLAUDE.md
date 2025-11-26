# Règles d'Infrastructure - AI-KO

## Architecture Générale

### Stack Technologique

- **Orchestration:** Docker Compose
- **Reverse Proxy:** Nginx
- **Base de données:** PostgreSQL 15+
- **Cache/Queue:** Redis 7+
- **Backend:** Flask 3.1+ (Gunicorn)
- **Frontend:** Next.js 15+
- **Workers:** Celery 5.3+
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack (optionnel)
- **CI/CD:** GitHub Actions

## Structure Docker Compose

```
docker-compose.yml
├── Services:
│   ├── postgres (PostgreSQL 15)
│   ├── redis (Redis 7)
│   ├── backend (Flask API)
│   ├── celery_worker (Celery Workers)
│   ├── celery_beat (Celery Scheduler)
│   ├── frontend (Next.js)
│   ├── nginx (Reverse Proxy)
│   ├── prometheus (Monitoring)
│   └── grafana (Dashboards)
├── Volumes:
│   ├── postgres_data
│   ├── redis_data
│   └── backend_uploads
└── Networks:
    └── smart-system-network
```

## Règles de Développement

### 1. Docker Compose - Configuration Complète

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: smart-system-db
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-systeme_intelligent}
      POSTGRES_USER: ${POSTGRES_USER:-smart_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-smart_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - smart-system-network
    restart: unless-stopped

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: smart-system-redis
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - smart-system-network
    restart: unless-stopped

  # Flask Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        - PYTHON_VERSION=3.13
    container_name: smart-system-backend
    environment:
      # Database
      DATABASE_URL: postgresql://${POSTGRES_USER:-smart_user}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-systeme_intelligent}
      
      # Redis
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      CELERY_BROKER_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      CELERY_RESULT_BACKEND: redis://:${REDIS_PASSWORD}@redis:6379/1
      
      # Flask
      FLASK_APP: run.py
      FLASK_ENV: ${FLASK_ENV:-production}
      SECRET_KEY: ${SECRET_KEY}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      
      # Hugging Face
      HF_API_TOKEN: ${HF_API_TOKEN}
      
      # CORS
      CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:3000}
    volumes:
      - ./backend:/app
      - backend_uploads:/app/uploads
      - /app/venv  # Exclure venv du volume
    ports:
      - "${BACKEND_PORT:-5000}:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      sh -c "
        flask db upgrade &&
        gunicorn --bind 0.0.0.0:5000
                 --workers ${GUNICORN_WORKERS:-4}
                 --timeout 300
                 --access-logfile -
                 --error-logfile -
                 --log-level info
                 run:app
      "
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - smart-system-network
    restart: unless-stopped

  # Celery Worker (IA tasks)
  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-system-celery-worker
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-smart_user}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-systeme_intelligent}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      CELERY_BROKER_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      CELERY_RESULT_BACKEND: redis://:${REDIS_PASSWORD}@redis:6379/1
      HF_API_TOKEN: ${HF_API_TOKEN}
      FLASK_ENV: ${FLASK_ENV:-production}
    volumes:
      - ./backend:/app
      - backend_uploads:/app/uploads
    depends_on:
      - redis
      - postgres
      - backend
    command: >
      celery -A celery_app.celery worker
             --loglevel=info
             --concurrency=${CELERY_WORKERS:-2}
             --max-tasks-per-child=50
             --time-limit=600
             --soft-time-limit=540
    healthcheck:
      test: ["CMD", "celery", "-A", "celery_app.celery", "inspect", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - smart-system-network
    restart: unless-stopped

  # Celery Beat (scheduled tasks)
  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-system-celery-beat
    environment:
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      CELERY_BROKER_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      DATABASE_URL: postgresql://${POSTGRES_USER:-smart_user}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-systeme_intelligent}
    volumes:
      - ./backend:/app
    depends_on:
      - redis
      - postgres
    command: celery -A celery_app.celery beat --loglevel=info
    networks:
      - smart-system-network
    restart: unless-stopped

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend-nextjs
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:5000}
        - NODE_ENV=production
    container_name: smart-system-frontend
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://backend:5000}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      DATABASE_URL: postgresql://${POSTGRES_USER:-smart_user}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-systeme_intelligent}
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - smart-system-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: smart-system-nginx
    ports:
      - "${HTTP_PORT:-80}:80"
      - "${HTTPS_PORT:-443}:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - smart-system-network
    restart: unless-stopped

  # Prometheus (Monitoring)
  prometheus:
    image: prom/prometheus:latest
    container_name: smart-system-prometheus
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    ports:
      - "${PROMETHEUS_PORT:-9090}:9090"
    networks:
      - smart-system-network
    restart: unless-stopped

  # Grafana (Dashboards)
  grafana:
    image: grafana/grafana:latest
    container_name: smart-system-grafana
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "${GRAFANA_PORT:-3001}:3000"
    depends_on:
      - prometheus
    networks:
      - smart-system-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  backend_uploads:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

networks:
  smart-system-network:
    driver: bridge
```

**Règle:** TOUJOURS utiliser Docker Compose pour orchestrer tous les services. Tous les services doivent être dockerisés.

### 2. Dockerfiles Optimisés

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.13-slim as base

# Dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Créer utilisateur non-root
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /app/uploads && \
    chown -R appuser:appuser /app

WORKDIR /app

# Installer dépendances Python
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install gunicorn

# Copier code
COPY --chown=appuser:appuser . .

# Utilisateur non-root
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Port
EXPOSE 5000

# Commande par défaut (peut être overridée dans docker-compose)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]
```

#### Frontend Dockerfile

```dockerfile
# frontend-nextjs/Dockerfile
FROM node:20-alpine AS base

# Installer dépendances uniquement si nécessaire
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier fichiers de dépendances
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement au build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Créer utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Règle:** 
- Utiliser multi-stage builds pour réduire la taille des images
- TOUJOURS utiliser un utilisateur non-root
- Optimiser les layers Docker (ordre des COPY)
- Utiliser `.dockerignore` pour exclure les fichiers inutiles

### 3. Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

    # Upstreams
    upstream backend {
        least_conn;
        server backend:5000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream frontend {
        least_conn;
        server frontend:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP -> HTTPS redirect (production)
    server {
        listen 80;
        server_name _;
        
        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Backend API
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Auth endpoints (rate limit plus strict)
        location /api/auth/ {
            limit_req zone=auth_limit burst=10 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health checks (no rate limit)
        location /health {
            access_log off;
            proxy_pass http://backend;
        }
    }
}
```

**Règle:** 
- TOUJOURS utiliser HTTPS en production
- Configurer rate limiting sur les endpoints sensibles
- Ajouter les security headers
- Utiliser upstream avec health checks

### 4. Variables d'Environnement

```bash
# .env.example
# Database
POSTGRES_DB=systeme_intelligent
POSTGRES_USER=smart_user
POSTGRES_PASSWORD=change_me_secure_password
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=change_me_redis_password
REDIS_PORT=6379

# Flask Backend
SECRET_KEY=change_me_secret_key_min_32_chars
JWT_SECRET_KEY=change_me_jwt_secret_key
FLASK_ENV=production
BACKEND_PORT=5000
GUNICORN_WORKERS=4

# Celery
CELERY_WORKERS=2

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=change_me_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
FRONTEND_PORT=3000

# Hugging Face
HF_API_TOKEN=change_me_hf_token

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Nginx
HTTP_PORT=80
HTTPS_PORT=443

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_USER=admin
GRAFANA_PASSWORD=change_me_grafana_password
GRAFANA_PORT=3001
```

**Règle:** 
- TOUJOURS créer un `.env.example` avec toutes les variables
- JAMAIS commiter le `.env` réel
- Utiliser des secrets forts (générer avec `openssl rand -hex 32`)

### 5. Health Checks

#### Backend Health Check

```python
# backend/app/api/health.py
from flask import Blueprint, jsonify
from app.extensions import db
import redis

bp = Blueprint('health', __name__)

@bp.route('/health')
def health():
    """Health check simple"""
    return jsonify({'status': 'healthy'}), 200

@bp.route('/health/detailed')
def health_detailed():
    """Health check détaillé avec dépendances"""
    checks = {
        'status': 'healthy',
        'database': 'unknown',
        'redis': 'unknown',
    }
    
    # Check database
    try:
        db.session.execute('SELECT 1')
        checks['database'] = 'healthy'
    except Exception as e:
        checks['database'] = f'unhealthy: {str(e)}'
        checks['status'] = 'unhealthy'
    
    # Check Redis
    try:
        r = redis.from_url(current_app.config['REDIS_URL'])
        r.ping()
        checks['redis'] = 'healthy'
    except Exception as e:
        checks['redis'] = f'unhealthy: {str(e)}'
        checks['status'] = 'unhealthy'
    
    status_code = 200 if checks['status'] == 'healthy' else 503
    return jsonify(checks), status_code
```

**Règle:** TOUJOURS implémenter des health checks pour tous les services. Utiliser `/health` pour Kubernetes/Docker.

### 6. CI/CD avec GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Tests Backend
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      
      - name: Install dependencies
        working-directory: ./backend
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run tests
        working-directory: ./backend
        run: |
          pytest --cov=app --cov-report=xml --cov-report=html
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  # Tests Frontend
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v5
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend-nextjs/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend-nextjs
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend-nextjs
        run: npm run lint
      
      - name: Run tests
        working-directory: ./frontend-nextjs
        run: npm run test
      
      - name: Build
        working-directory: ./frontend-nextjs
        run: npm run build

  # Build & Push Docker Images
  build-images:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend-nextjs
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy (si serveur configuré)
  deploy:
    needs: [build-images]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/smart-system
            git pull origin main
            docker-compose pull
            docker-compose up -d --build
            docker-compose exec backend flask db upgrade
```

**Règle:** TOUJOURS tester avant de build. Utiliser le cache Docker pour accélérer les builds.

### 7. Monitoring - Prometheus

```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'smart-system'
    environment: 'production'

rule_files:
  - 'alerts.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

**Règle:** Exposer des métriques Prometheus sur tous les services critiques.

### 8. Scripts Utilitaires

#### Script de Déploiement

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Déploiement Smart System"

# Vérifier variables d'environnement
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    exit 1
fi

# Pull latest images
echo "📥 Pull des images Docker..."
docker-compose pull

# Build si nécessaire
echo "🔨 Build des images..."
docker-compose build

# Migrations
echo "🗄️  Migrations base de données..."
docker-compose exec -T backend flask db upgrade

# Redémarrage services
echo "🔄 Redémarrage des services..."
docker-compose up -d

# Health checks
echo "🏥 Vérification santé des services..."
sleep 10
docker-compose ps

echo "✅ Déploiement terminé!"
```

#### Script de Backup

```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "💾 Backup PostgreSQL..."
docker-compose exec -T postgres pg_dump -U smart_user systeme_intelligent | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Backup Redis (optionnel)
echo "💾 Backup Redis..."
docker-compose exec -T redis redis-cli --rdb - | gzip > "$BACKUP_DIR/redis_$DATE.rdb.gz"

# Backup uploads
echo "💾 Backup uploads..."
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C volumes backend_uploads

echo "✅ Backup terminé: $BACKUP_DIR"
```

**Règle:** Créer des scripts pour les opérations répétitives (deploy, backup, restore).

## Checklist de Déploiement

Avant de déployer en production, vérifier:

- [ ] Tous les services sont dockerisés
- [ ] Health checks implémentés
- [ ] Variables d'environnement configurées
- [ ] Secrets générés et sécurisés
- [ ] SSL/TLS configuré (Nginx)
- [ ] Rate limiting activé
- [ ] Monitoring configuré (Prometheus/Grafana)
- [ ] Backups automatisés
- [ ] CI/CD pipeline fonctionnel
- [ ] Documentation à jour

## Commandes Utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Arrêter tous les services
docker-compose down

# Rebuild après changement
docker-compose up -d --build

# Accès à un service
docker-compose exec backend bash
docker-compose exec postgres psql -U smart_user systeme_intelligent

# Nettoyer volumes (ATTENTION: supprime les données)
docker-compose down -v

# Voir l'utilisation des ressources
docker stats

# Backup manuel
./scripts/backup.sh

# Restore
gunzip < backups/postgres_20250101_120000.sql.gz | docker-compose exec -T postgres psql -U smart_user systeme_intelligent
```



