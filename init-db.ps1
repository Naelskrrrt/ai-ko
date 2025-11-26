# Script d'initialisation de la base de donnees
# Usage: .\init-db.ps1

Write-Host "Initialisation de la base de donnees..." -ForegroundColor Green

Set-Location backend

# Activer l'environnement virtuel
if (Test-Path "venv") {
    & .\venv\Scripts\Activate.ps1
}
else {
    Write-Host "Erreur: venv non trouve. Executez d'abord start-backend.ps1" -ForegroundColor Red
    exit 1
}

# Charger les variables d'environnement depuis .env
if (Test-Path "..\.env") {
    Get-Content "..\.env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Configuration
$env:FLASK_APP = "run.py"
$env:FLASK_ENV = "development"

# Configurer DATABASE_URL pour PostgreSQL Docker
$postgresRunning = docker ps --filter "name=smart-system-db" --format "{{.Names}}" 2>$null
if ($postgresRunning -eq "smart-system-db") {
    Write-Host "Configuration de DATABASE_URL pour PostgreSQL Docker..." -ForegroundColor Green
    $env:DATABASE_URL = "postgresql://root:root@localhost:5432/systeme_intelligent"
}
else {
    Write-Host "Erreur: PostgreSQL Docker n'est pas en cours d'execution" -ForegroundColor Red
    Write-Host "Demarrez-le avec: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Gray

# Executer les migrations
Write-Host "Execution des migrations..." -ForegroundColor Yellow
flask db upgrade

Write-Host ""
Write-Host "Base de donnees initialisee avec succes!" -ForegroundColor Green



