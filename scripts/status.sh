#!/bin/bash
# scripts/status.sh

echo "🔍 Status des services AI-KO"
echo ""

# Status Docker Compose
echo "📦 Services Docker:"
docker-compose ps
echo ""

# Health checks
echo "🏥 Health Checks:"
echo ""

# Backend
echo -n "  Backend API: "
if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Down"
fi

# Frontend
echo -n "  Frontend: "
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Down"
fi

# PostgreSQL
echo -n "  PostgreSQL: "
if docker-compose exec -T postgres pg_isready -U smart_user > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Down"
fi

# Redis
echo -n "  Redis: "
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Down"
fi

echo ""

# Utilisation ressources
echo "💻 Utilisation des ressources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"



