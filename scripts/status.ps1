# scripts/status.ps1
# Script de vérification du status pour Windows PowerShell

Write-Host "🔍 Status des services AI-KO`n" -ForegroundColor Cyan

# Status Docker Compose
Write-Host "📦 Services Docker:" -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# Health checks
Write-Host "🏥 Health Checks:`n" -ForegroundColor Yellow

# Backend
Write-Host "  Backend API: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unhealthy" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Down" -ForegroundColor Red
}

# Frontend
Write-Host "  Frontend: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unhealthy" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Down" -ForegroundColor Red
}

# PostgreSQL
Write-Host "  PostgreSQL: " -NoNewline
try {
    $result = docker-compose exec -T postgres pg_isready -U smart_user 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Down" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Down" -ForegroundColor Red
}

# Redis
Write-Host "  Redis: " -NoNewline
try {
    $result = docker-compose exec -T redis redis-cli ping 2>&1
    if ($result -match "PONG") {
        Write-Host "✅ Healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Down" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Down" -ForegroundColor Red
}

Write-Host "`n💻 Utilisation des ressources:" -ForegroundColor Yellow
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"



