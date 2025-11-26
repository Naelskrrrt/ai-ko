# 🏗️ Infrastructure AI-KO

Documentation détaillée de l'infrastructure Docker et de l'architecture système.

## 📋 Table des Matières

1. [Architecture Globale](#architecture-globale)
2. [Services Docker](#services-docker)
3. [Réseaux et Volumes](#réseaux-et-volumes)
4. [Configuration](#configuration)
5. [Monitoring](#monitoring)
6. [Sécurité](#sécurité)
7. [Performance](#performance)
8. [Maintenance](#maintenance)

## 🏛️ Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                     NGINX (Reverse Proxy)                │
│                    Port 80 (HTTP) / 443 (HTTPS)         │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             ▼                           ▼
    ┌────────────────┐         ┌─────────────────┐
    │   Frontend     │         │    Backend      │
    │   Next.js 15   │         │   Flask 3.1     │
    │   Port 3000    │◄────────│   Port 5000     │
    └────────────────┘         └────────┬────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌───────────────┐   ┌──────────┐      ┌──────────────┐
            │  PostgreSQL   │   │  Redis   │      │    Celery    │
            │    Port 5432  │   │ Port 6379│      │   Workers    │
            └───────────────┘   └──────────┘      └──────────────┘
                                                           │
                                                           ▼
                                                   ┌──────────────┐
                                                   │ Celery Beat  │
                                                   │  (Scheduler) │
                                                   └──────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Monitoring Stack                      │
│   Prometheus (9090) ◄──► Grafana (3001)                │
└─────────────────────────────────────────────────────────┘
```

## 🐳 Services Docker

### 1. PostgreSQL (Database)

**Image:** `postgres:15-alpine`

```yaml
Configuration:
- Port: 5432
- Database: systeme_intelligent
- User: smart_user
- Extensions: uuid-ossp, unaccent, pg_trgm, hstore
- Volume: postgres_data (persistant)
```

**Health Check:**
```bash
pg_isready -U smart_user
```

**Optimisations:**
- Shared buffers: 256MB
- Effective cache: 1GB
- Work mem: 4MB
- Max connections: 100

### 2. Redis (Cache & Queue)

**Image:** `redis:7-alpine`

```yaml
Configuration:
- Port: 6379
- Max Memory: 256MB
- Eviction Policy: allkeys-lru
- Persistence: AOF enabled
- Volume: redis_data (persistant)
```

**Health Check:**
```bash
redis-cli ping
```

**Utilisation:**
- Cache application
- Celery broker
- Sessions
- Rate limiting

### 3. Backend (Flask API)

**Build:** `./backend/Dockerfile`

```yaml
Configuration:
- Port: 5000
- Workers: 4 (Gunicorn)
- Timeout: 300s
- Volume: backend_uploads (persistant)
```

**Endpoints principaux:**
- `/health` - Health check simple
- `/health/detailed` - Health check complet
- `/health/ready` - Kubernetes readiness
- `/health/live` - Kubernetes liveness
- `/metrics` - Métriques Prometheus
- `/api/*` - API REST

**Health Check:**
```bash
curl -f http://localhost:5000/health
```

### 4. Celery Worker

**Build:** `./backend/Dockerfile`

```yaml
Configuration:
- Concurrency: 2 workers
- Max tasks per child: 50
- Time limit: 600s (10min)
- Soft time limit: 540s (9min)
```

**Queues:**
- `default` - Tâches générales
- `ai_tasks` - Tâches IA (longues)
- `priority` - Tâches prioritaires

**Monitoring:**
```bash
celery -A celery_app.celery inspect active
celery -A celery_app.celery inspect stats
```

### 5. Celery Beat (Scheduler)

**Build:** `./backend/Dockerfile`

```yaml
Configuration:
- Scheduler: redis
- Beat DB: redis://redis:6379/0
```

**Tâches planifiées:**
```python
# Exemple de configuration
from celery.schedules import crontab

beat_schedule = {
    'cleanup-old-data': {
        'task': 'app.tasks.cleanup',
        'schedule': crontab(hour=2, minute=0),  # 2AM daily
    },
}
```

### 6. Frontend (Next.js)

**Build:** `./frontend/Dockerfile`

```yaml
Configuration:
- Port: 3000
- Node: 20-alpine
- Output: standalone
- Build: Multi-stage (optimisé)
```

**Features:**
- Server-side rendering (SSR)
- Static generation (SSG)
- API Routes
- Image optimization
- Code splitting

**Health Check:**
```bash
curl -f http://localhost:3000/api/health
```

### 7. Nginx (Reverse Proxy)

**Image:** `nginx:alpine`

```yaml
Configuration:
- HTTP Port: 80
- HTTPS Port: 443
- Rate limiting:
  - API: 10 req/s
  - Auth: 5 req/s
```

**Routes:**
```nginx
/               → frontend:3000
/api/*          → backend:5000  (rate limited)
/api/auth/*     → backend:5000  (strict rate limit)
/health         → backend:5000  (no rate limit)
```

**SSL/TLS:**
- Protocols: TLSv1.2, TLSv1.3
- Ciphers: HIGH:!aNULL:!MD5
- HSTS enabled
- Perfect Forward Secrecy

### 8. Prometheus (Monitoring)

**Image:** `prom/prometheus:latest`

```yaml
Configuration:
- Port: 9090
- Scrape interval: 15s
- Retention: 15 days
- Volume: prometheus_data
```

**Targets:**
- Backend Flask: `:5000/metrics`
- PostgreSQL Exporter: `:9187`
- Redis Exporter: `:9121`

**Alertes:**
- Backend Down (1min)
- High Memory (5min)
- Database Down (1min)
- Redis Down (1min)

### 9. Grafana (Dashboards)

**Image:** `grafana/grafana:latest`

```yaml
Configuration:
- Port: 3001
- Admin: admin (changeable)
- Datasource: Prometheus (auto-configured)
- Volume: grafana_data
```

**Dashboards:**
1. System Overview
2. Backend Performance
3. Database Metrics
4. Redis Metrics
5. Celery Tasks

## 🌐 Réseaux et Volumes

### Network: smart-system-network

**Type:** Bridge

```yaml
Driver: bridge
Subnet: Auto-assigné
Services connectés:
  - postgres
  - redis
  - backend
  - celery_worker
  - celery_beat
  - frontend
  - nginx
  - prometheus
  - grafana
```

**Isolation:**
- Réseau interne isolé
- Communication inter-services sécurisée
- DNS automatique (par nom de service)

### Volumes Persistants

```yaml
postgres_data:
  Type: local
  Path: /var/lib/docker/volumes/ai-ko_postgres_data
  Usage: Base de données PostgreSQL

redis_data:
  Type: local
  Path: /var/lib/docker/volumes/ai-ko_redis_data
  Usage: Persistence Redis (AOF)

backend_uploads:
  Type: local
  Path: /var/lib/docker/volumes/ai-ko_backend_uploads
  Usage: Fichiers uploadés

prometheus_data:
  Type: local
  Path: /var/lib/docker/volumes/ai-ko_prometheus_data
  Usage: Métriques Prometheus

grafana_data:
  Type: local
  Path: /var/lib/docker/volumes/ai-ko_grafana_data
  Usage: Configuration Grafana
```

## ⚙️ Configuration

### Variables d'Environnement

Voir `env.example` pour la liste complète.

**Catégories:**

1. **Database**
   - POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
   
2. **Redis**
   - REDIS_PASSWORD
   
3. **Backend**
   - SECRET_KEY, JWT_SECRET_KEY, FLASK_ENV
   
4. **Frontend**
   - NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET
   
5. **Celery**
   - CELERY_WORKERS, CELERY_BROKER_URL
   
6. **Monitoring**
   - GRAFANA_USER, GRAFANA_PASSWORD

### Secrets Management

**Génération de secrets:**

```bash
# Linux/Mac
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"

# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Stockage:**
- Développement: `.env` (gitignored)
- Production: Docker secrets, HashiCorp Vault, AWS Secrets Manager

## 📊 Monitoring

### Métriques Backend (Prometheus)

```python
# Métriques exposées
- http_request_duration_seconds
- http_request_total
- http_request_exceptions_total
- process_cpu_seconds_total
- process_resident_memory_bytes
- celery_task_duration_seconds
- celery_task_total
```

### Dashboards Grafana

**1. System Overview**
- Services status
- CPU, Memory, Disk
- Network traffic

**2. Backend Performance**
- Request rate
- Response time (p50, p95, p99)
- Error rate
- Active connections

**3. Database Metrics**
- Connections
- Queries/sec
- Cache hit ratio
- Slow queries

**4. Celery Tasks**
- Tasks by state
- Task duration
- Queue length
- Worker health

### Alerting

**Configuration Alertmanager:**

```yaml
# monitoring/alertmanager/alertmanager.yml
route:
  receiver: 'email'
  group_wait: 10s
  group_interval: 10m
  repeat_interval: 1h

receivers:
  - name: 'email'
    email_configs:
      - to: 'admin@ai-ko.com'
        from: 'alerts@ai-ko.com'
        smarthost: 'smtp.gmail.com:587'
```

## 🔐 Sécurité

### Docker Security

```yaml
# Bonnes pratiques appliquées:
✓ Non-root users
✓ Read-only filesystems (où possible)
✓ Capability dropping
✓ Resource limits
✓ Health checks
✓ Multi-stage builds
✓ Vulnerability scanning
```

### Network Security

```yaml
# Nginx Security Headers
Strict-Transport-Security: max-age=31536000
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
```

### Rate Limiting

```nginx
# API endpoints
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Auth endpoints
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
```

## ⚡ Performance

### Backend Optimization

```python
# Gunicorn workers
Workers = (2 × CPU_cores) + 1
Worker_class = sync
Timeout = 300s
Keepalive = 5s
```

### Database Optimization

```sql
-- Indexes
CREATE INDEX idx_table_column ON table(column);

-- Partitioning (si nécessaire)
CREATE TABLE data_2025 PARTITION OF data
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Vacuum
VACUUM ANALYZE;
```

### Redis Optimization

```bash
# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
appendonly yes
appendfsync everysec
```

### Frontend Optimization

```javascript
// Next.js config
output: 'standalone'  // Smaller image
swcMinify: true       // Fast minification
```

## 🔧 Maintenance

### Backups

**Automatique (cron):**
```cron
# Backup quotidien à 2h du matin
0 2 * * * /path/to/scripts/backup.sh
```

**Manuel:**
```bash
./scripts/backup.sh
```

**Restore:**
```bash
./scripts/restore.sh 20250121_143000
```

### Updates

```bash
# 1. Backup
./scripts/backup.sh

# 2. Pull nouvelles images
docker-compose pull

# 3. Rebuild
docker-compose build --pull

# 4. Restart avec downtime minimal
docker-compose up -d

# 5. Migrations
docker-compose exec backend flask db upgrade
```

### Logs Management

**Rotation:**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

**Consultation:**
```bash
# Temps réel
docker-compose logs -f

# Dernières 100 lignes
docker-compose logs --tail=100

# Service spécifique
docker-compose logs -f backend

# Export
docker-compose logs > logs_$(date +%Y%m%d).txt
```

### Cleanup

```bash
# Supprimer containers arrêtés
docker container prune

# Supprimer images non utilisées
docker image prune -a

# Supprimer volumes non utilisés (ATTENTION!)
docker volume prune

# Nettoyage complet
docker system prune -a --volumes
```

## 📚 Ressources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**Dernière mise à jour:** 2025-01-21



