# Script PowerShell pour exécuter tous les tests API

Write-Host "🚀 Démarrage des tests API complets" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le serveur backend est en cours d'exécution
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Serveur backend détecté" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Le serveur backend ne semble pas être en cours d'exécution" -ForegroundColor Yellow
    Write-Host "   Démarrez-le avec: python run.py ou docker-compose up" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Voulez-vous continuer quand même? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Activer l'environnement virtuel si disponible
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
} elseif (Test-Path "..\venv\Scripts\Activate.ps1") {
    & "..\venv\Scripts\Activate.ps1"
}

# Exécuter les tests
python test_all_api.py $args

Write-Host ""
Write-Host "✅ Tests terminés" -ForegroundColor Green








