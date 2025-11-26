# scripts/deploy.ps1
# Script de déploiement pour Windows PowerShell

Write-Host "🚀 Déploiement AI-KO Smart System" -ForegroundColor Cyan

# Vérifier si .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Fichier .env manquant" -ForegroundColor Red
    Write-Host "📝 Copier env.example vers .env et configurer les variables" -ForegroundColor Yellow
    exit 1
}

# Pull latest images
Write-Host "`n📥 Pull des images Docker..." -ForegroundColor Yellow
docker-compose pull

# Build si nécessaire
Write-Host "`n🔨 Build des images..." -ForegroundColor Yellow
docker-compose build --parallel

# Arrêter les anciens containers
Write-Host "`n🛑 Arrêt des anciens containers..." -ForegroundColor Yellow
docker-compose down

# Démarrer les services
Write-Host "`n🚀 Démarrage des services..." -ForegroundColor Yellow
docker-compose up -d

# Attendre que les services soient prêts
Write-Host "`n⏳ Attente des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Migrations
Write-Host "`n🗄️  Migrations base de données..." -ForegroundColor Yellow
try {
    docker-compose exec -T backend flask db upgrade
} catch {
    Write-Host "⚠️  Migrations déjà appliquées ou erreur" -ForegroundColor Yellow
}

# Health checks
Write-Host "`n🏥 Vérification santé des services..." -ForegroundColor Yellow
docker-compose ps

Write-Host "`n✅ Déploiement terminé!" -ForegroundColor Green
Write-Host "`n📊 Services disponibles:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  - Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  - Grafana: http://localhost:3001" -ForegroundColor White
Write-Host "`n📝 Pour voir les logs:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f backend" -ForegroundColor White
Write-Host "  docker-compose logs -f frontend" -ForegroundColor White



