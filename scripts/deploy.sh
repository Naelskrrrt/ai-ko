#!/bin/bash
# scripts/deploy.sh - Script de déploiement complet pour VPS

set -e

# Options
INIT_DB=${INIT_DB:-false}
INIT_SSL=${INIT_SSL:-false}
DOMAIN=${DOMAIN:-}
SSL_EMAIL=${SSL_EMAIL:-}

echo "🚀 Déploiement AI-KO Smart System"
echo "=========================================="
echo ""

# Vérifier variables d'environnement
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    echo "📝 Copier env.example vers .env et configurer les variables"
    echo ""
    echo "💡 Vous pouvez utiliser: cp env.example .env"
    exit 1
fi

# Vérifier les variables critiques
source .env
REQUIRED_VARS=("SECRET_KEY" "JWT_SECRET_KEY" "POSTGRES_PASSWORD" "REDIS_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"change_me"* ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Variables d'environnement non configurées:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📝 Modifiez le fichier .env avant de continuer"
    exit 1
fi

# Vérifier Docker et Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Initialisation SSL si demandée
if [ "$INIT_SSL" = "true" ] && [ -n "$DOMAIN" ] && [ -n "$SSL_EMAIL" ]; then
    echo "🔐 Initialisation SSL pour $DOMAIN..."
    if [ -f "scripts/init-ssl.sh" ]; then
        chmod +x scripts/init-ssl.sh
        ./scripts/init-ssl.sh "$DOMAIN" "$SSL_EMAIL"
    else
        echo "⚠️  Script init-ssl.sh non trouvé, ignoré"
    fi
    echo ""
fi

# Pull latest images (optionnel, peut être commenté pour build local)
# echo "📥 Pull des images Docker..."
# docker-compose pull || echo "⚠️  Pull échoué, utilisation des images locales"

# Build des images
echo "🔨 Build des images Docker..."
docker-compose build --parallel

# Arrêter les anciens containers
echo "🛑 Arrêt des anciens containers..."
docker-compose down

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente des services (30 secondes)..."
sleep 30

# Vérifier que les services sont en cours d'exécution
echo "🔍 Vérification des services..."
FAILED_SERVICES=()

for service in postgres redis backend frontend nginx; do
    if ! docker-compose ps "$service" | grep -q "Up"; then
        FAILED_SERVICES+=("$service")
    fi
done

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo "⚠️  Services en échec: ${FAILED_SERVICES[*]}"
    echo "📝 Consultez les logs: docker-compose logs ${FAILED_SERVICES[*]}"
fi

# Migrations et initialisation de la base de données
echo ""
echo "🗄️  Initialisation de la base de données..."
if [ "$INIT_DB" = "true" ]; then
    if [ -f "scripts/init-db-complete.sh" ]; then
        chmod +x scripts/init-db-complete.sh
        ./scripts/init-db-complete.sh || echo "⚠️  Erreur lors de l'initialisation complète"
    else
        docker-compose exec -T backend flask db upgrade || echo "⚠️  Migrations déjà appliquées ou erreur"
    fi
else
    docker-compose exec -T backend flask db upgrade || echo "⚠️  Migrations déjà appliquées ou erreur"
fi

# Health checks
echo ""
echo "🏥 Vérification santé des services..."
docker-compose ps

# Vérifier les healthchecks
echo ""
echo "🔍 Vérification des healthchecks..."
sleep 10

HEALTH_CHECK_FAILED=false

# Backend healthcheck
if docker-compose exec -T backend curl -f http://localhost:5000/health &> /dev/null; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Unhealthy"
    HEALTH_CHECK_FAILED=true
fi

# Frontend healthcheck
if docker-compose exec -T frontend wget -q --spider http://localhost:3000/api/health &> /dev/null || \
   docker-compose exec -T frontend curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Frontend: Healthy"
else
    echo "⚠️  Frontend: Healthcheck non disponible (peut être normal au démarrage)"
fi

# Database healthcheck
if docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-root}" &> /dev/null; then
    echo "✅ Database: Healthy"
else
    echo "❌ Database: Unhealthy"
    HEALTH_CHECK_FAILED=true
fi

# Redis healthcheck
if docker-compose exec -T redis redis-cli --raw incr ping &> /dev/null; then
    echo "✅ Redis: Healthy"
else
    echo "❌ Redis: Unhealthy"
    HEALTH_CHECK_FAILED=true
fi

echo ""
echo "=========================================="
if [ "$HEALTH_CHECK_FAILED" = true ]; then
    echo "⚠️  Déploiement terminé avec des avertissements"
    echo "📝 Vérifiez les logs: docker-compose logs"
else
    echo "✅ Déploiement terminé avec succès!"
fi
echo "=========================================="
echo ""
echo "📊 Services disponibles:"
echo "  - Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "  - Backend API: http://localhost:${BACKEND_PORT:-5000}"
echo "  - Swagger: http://localhost:${BACKEND_PORT:-5000}/api/docs/swagger/"
if [ -n "${PROMETHEUS_PORT:-}" ]; then
    echo "  - Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
fi
if [ -n "${GRAFANA_PORT:-}" ]; then
    echo "  - Grafana: http://localhost:${GRAFANA_PORT:-3001}"
fi
echo ""
echo "📝 Commandes utiles:"
echo "  - Logs: docker-compose logs -f [service]"
echo "  - Status: docker-compose ps"
echo "  - Redémarrer: docker-compose restart [service]"
echo "  - Arrêter: docker-compose down"
echo ""
if [ "$INIT_DB" != "true" ]; then
    echo "💡 Pour initialiser la base de données complète:"
    echo "   INIT_DB=true ./scripts/deploy.sh"
fi



