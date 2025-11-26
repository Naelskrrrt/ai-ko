# Script de demarrage Backend Flask
# Usage: .\start-backend.ps1

Write-Host "Demarrage du Backend Flask..." -ForegroundColor Green

Set-Location backend

# Verifier si venv existe
if (-not (Test-Path "venv")) {
    Write-Host "Creation de l'environnement virtuel Python..." -ForegroundColor Yellow
    python -m venv venv
}

# Activer l'environnement virtuel
Write-Host "Activation de l'environnement virtuel..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Installer les dependances si necessaire
Write-Host "Installation des dependances Python..." -ForegroundColor Yellow
python -m pip install -q -r requirements.txt

# Charger les variables d'environnement depuis .env
if (Test-Path "..\.env") {
    Write-Host "Chargement des variables d'environnement depuis .env..." -ForegroundColor Yellow
    Get-Content "..\.env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Configuration des variables d'environnement
$env:FLASK_APP = "run.py"
$env:FLASK_ENV = "development"

# Configurer DATABASE_URL si non defini (utiliser PostgreSQL Docker ou SQLite)
if (-not $env:DATABASE_URL) {
    # Essayer de se connecter a PostgreSQL Docker
    try {
        $postgresRunning = docker ps --filter "name=smart-system-db" --format "{{.Names}}" 2>$null
        if ($postgresRunning -eq "smart-system-db") {
            Write-Host "PostgreSQL Docker detecte, configuration de DATABASE_URL..." -ForegroundColor Green
            $env:DATABASE_URL = "postgresql://root:root@localhost:5432/systeme_intelligent"
        }
        else {
            Write-Host "PostgreSQL Docker non detecte, utilisation de SQLite..." -ForegroundColor Yellow
            Write-Host "Pour utiliser PostgreSQL, demarrez Docker: docker-compose up -d postgres" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "Docker non disponible, utilisation de SQLite..." -ForegroundColor Yellow
    }
}

# Verifier la base de donnees et executer les migrations
Write-Host "Verification de la base de donnees..." -ForegroundColor Yellow
Write-Host "DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Gray
flask db upgrade

# Demarrer Flask
Write-Host ""
Write-Host "Backend demarre sur http://localhost:5000" -ForegroundColor Green
Write-Host "Mode: Developpement (reload active)" -ForegroundColor Gray
Write-Host "Appuyez sur Ctrl+C pour arreter" -ForegroundColor Gray
Write-Host ""
flask run --host=0.0.0.0 --port=5000 --reload
