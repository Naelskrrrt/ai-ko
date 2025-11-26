# Script pour démarrer ngrok pour le backend (port 5000)
# Usage: .\start-ngrok-backend.ps1

Write-Host "🌐 Démarrage de ngrok pour le backend (port 5000)..." -ForegroundColor Green
Write-Host ""

# Vérifier si ngrok est installé globalement
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if ($ngrokPath) {
    Write-Host "✅ ngrok CLI trouvé: $($ngrokPath.Source)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Démarrage du tunnel ngrok pour http://localhost:5000" -ForegroundColor Cyan
    Write-Host "📋 L'URL publique sera affichée ci-dessous" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Assurez-vous que le backend est démarré sur le port 5000" -ForegroundColor Yellow
    Write-Host ""
    ngrok http 5000
} else {
    Write-Host "⚠️  ngrok CLI non trouvé globalement" -ForegroundColor Yellow
    Write-Host "💡 Utilisation du script Node.js avec @ngrok/ngrok..." -ForegroundColor Cyan
    Write-Host ""
    
    # Vérifier si le script Node.js existe
    if (Test-Path "frontend\scripts\ngrok-backend.js") {
        Write-Host "✅ Script Node.js trouvé" -ForegroundColor Green
        Write-Host "⚠️  Assurez-vous que NGROK_AUTHTOKEN est configuré dans .env ou frontend/.env.local" -ForegroundColor Yellow
        Write-Host "⚠️  IMPORTANT: Assurez-vous que le backend est démarré sur le port 5000" -ForegroundColor Yellow
        Write-Host ""
        Set-Location frontend
        node scripts/ngrok-backend.js
    } else {
        Write-Host "❌ Script Node.js non trouvé" -ForegroundColor Red
        Write-Host "💡 Solutions:" -ForegroundColor Yellow
        Write-Host "   1. Installez ngrok globalement: npm install -g ngrok" -ForegroundColor White
        Write-Host "   2. Ou exécutez: cd frontend && pnpm install" -ForegroundColor White
        exit 1
    }
}

