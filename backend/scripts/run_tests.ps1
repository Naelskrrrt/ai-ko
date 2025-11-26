# Script PowerShell pour exécuter les tests AI-KO
# Usage: .\scripts\run_tests.ps1 [options]

param(
    [Parameter(Position=0)]
    [string]$Mode = "all"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🧪 EXÉCUTION DES TESTS AI-KO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Fonction d'aide
function Show-Help {
    Write-Host ""
    Write-Host "Usage: .\scripts\run_tests.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  all        Exécuter tous les tests (par défaut)"
    Write-Host "  api        Exécuter uniquement les tests API"
    Write-Host "  unit       Exécuter uniquement les tests unitaires"
    Write-Host "  cov        Exécuter les tests avec couverture détaillée"
    Write-Host "  fast       Exécuter les tests rapides uniquement"
    Write-Host "  verbose    Exécuter les tests en mode verbose"
    Write-Host "  help       Afficher cette aide"
    Write-Host ""
}

# Vérifier que pytest est installé
$pytestExists = Get-Command pytest -ErrorAction SilentlyContinue
if (-not $pytestExists) {
    Write-Host "❌ pytest n'est pas installé" -ForegroundColor Red
    Write-Host "Installer avec: pip install pytest pytest-cov pytest-env"
    exit 1
}

switch ($Mode) {
    "all" {
        Write-Host "📋 Exécution de tous les tests..." -ForegroundColor Green
        pytest tests/
    }

    "api" {
        Write-Host "🌐 Exécution des tests API..." -ForegroundColor Green
        pytest tests/api/ -m api
    }

    "unit" {
        Write-Host "🔬 Exécution des tests unitaires..." -ForegroundColor Green
        pytest tests/ -m unit
    }

    "cov" {
        Write-Host "📊 Exécution des tests avec couverture..." -ForegroundColor Green
        pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
        Write-Host ""
        Write-Host "📈 Rapport de couverture généré dans: htmlcov/index.html" -ForegroundColor Yellow
    }

    "fast" {
        Write-Host "⚡ Exécution des tests rapides..." -ForegroundColor Green
        pytest tests/ -m "not slow"
    }

    "verbose" {
        Write-Host "📝 Exécution des tests en mode verbose..." -ForegroundColor Green
        pytest tests/ -vv -s
    }

    "help" {
        Show-Help
        exit 0
    }

    default {
        Write-Host "❌ Option invalide: $Mode" -ForegroundColor Red
        Show-Help
        exit 1
    }
}

# Vérifier le résultat
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "✅ TESTS RÉUSSIS !" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "❌ TESTS ÉCHOUÉS" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    exit 1
}
