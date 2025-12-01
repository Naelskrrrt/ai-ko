# Script PowerShell pour synchroniser la base de données locale vers la production
# Usage: .\scripts\sync_db_to_prod.ps1 [--dry-run] [--update-existing]

param(
    [switch]$DryRun,
    [switch]$UpdateExisting,
    [string]$LocalDbUrl,
    [string]$ProdDbUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Synchronisation DB Locale -> Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend")) {
    Write-Host "Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Aller dans le répertoire backend
Set-Location backend

# Activer l'environnement virtuel
if (Test-Path "venv") {
    Write-Host "Activation de l'environnement virtuel..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}
else {
    Write-Host "Erreur: venv non trouvé. Exécutez d'abord start-backend.ps1" -ForegroundColor Red
    exit 1
}

# Charger les variables d'environnement depuis .env
if (Test-Path "..\.env") {
    Write-Host "Chargement des variables d'environnement..." -ForegroundColor Yellow
    Get-Content "..\.env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Vérifier que PostgreSQL Docker est en cours d'exécution
$postgresRunning = docker ps --filter "name=smart-system-db" --format "{{.Names}}" 2>$null
if ($postgresRunning -ne "smart-system-db") {
    Write-Host "Avertissement: PostgreSQL Docker n'est pas en cours d'exécution" -ForegroundColor Yellow
    Write-Host "Démarrez-le avec: docker-compose up -d postgres" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Voulez-vous continuer quand même? (o/n)"
    if ($continue -ne "o" -and $continue -ne "O") {
        exit 1
    }
}

# Construire les arguments pour le script Python
$pythonArgs = @()

if ($DryRun) {
    $pythonArgs += "--dry-run"
    Write-Host "Mode: DRY RUN (aucune modification ne sera effectuée)" -ForegroundColor Yellow
}

if ($UpdateExisting) {
    $pythonArgs += "--update-existing"
    Write-Host "Mode: UPDATE (les enregistrements existants seront mis à jour)" -ForegroundColor Yellow
}

if ($LocalDbUrl) {
    $pythonArgs += "--local-db-url"
    $pythonArgs += $LocalDbUrl
}

if ($ProdDbUrl) {
    $pythonArgs += "--prod-db-url"
    $pythonArgs += $ProdDbUrl
}
else {
    # Vérifier que DATABASE_URL_PROD est défini
    if (-not $env:DATABASE_URL_PROD) {
        Write-Host "Erreur: DATABASE_URL_PROD n'est pas défini" -ForegroundColor Red
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  1. Ajouter DATABASE_URL_PROD dans votre fichier .env" -ForegroundColor Yellow
        Write-Host "  2. Utiliser -ProdDbUrl pour spécifier l'URL directement" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Exemple:" -ForegroundColor Yellow
        Write-Host "  DATABASE_URL_PROD=postgresql://user:pass@host:5432/dbname" -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""
Write-Host "Exécution du script de synchronisation..." -ForegroundColor Green
Write-Host ""

# Exécuter le script Python
python scripts/sync_db_to_prod.py $pythonArgs

$exitCode = $LASTEXITCODE

# Retourner au répertoire racine
Set-Location ..

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✓ Synchronisation terminée avec succès!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "✗ Erreur lors de la synchronisation" -ForegroundColor Red
    exit $exitCode
}

