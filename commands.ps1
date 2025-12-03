# ===============================================
# PowerShell Commands Helper - AI-KO Project
# ===============================================
# Usage: . .\commands.ps1
# Then use: Dev, Prod, Up, Down, Logs, etc.
# ===============================================

# Environment switching
function Dev {
    Write-Host "Switching to development environment..." -ForegroundColor Cyan
    .\switch-env.ps1 dev
}

function Prod {
    Write-Host "Switching to production environment..." -ForegroundColor Cyan
    .\switch-env.ps1 prod
}

# Docker commands
function Up {
    Write-Host "Starting all services..." -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml up -d
}

function Down {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    docker-compose down
}

function Restart {
    Write-Host "Restarting all services..." -ForegroundColor Cyan
    Down
    Up
}

function Build {
    Write-Host "Building all services..." -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml up -d --build
}

function Logs {
    param([string]$Service = "")
    if ($Service) {
        docker-compose logs -f $Service
    } else {
        docker-compose logs -f
    }
}

function Ps {
    docker-compose ps
}

function Clean {
    Write-Host "Cleaning up containers and volumes..." -ForegroundColor Red
    $confirmation = Read-Host "This will remove all containers and volumes. Continue? (y/n)"
    if ($confirmation -eq 'y') {
        docker-compose down -v
        docker system prune -f
        Write-Host "Cleanup completed!" -ForegroundColor Green
    }
}

# Database commands
function Migrate {
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    docker-compose exec backend flask db upgrade
}

function MigrateCreate {
    $name = Read-Host "Migration name"
    docker-compose exec backend flask db migrate -m "$name"
}

function DbShell {
    Write-Host "Opening PostgreSQL shell..." -ForegroundColor Cyan
    docker-compose exec postgres psql -U root systeme_intelligent_dev
}

# Development commands
function ShellBackend {
    Write-Host "Opening backend shell..." -ForegroundColor Cyan
    docker-compose exec backend bash
}

function ShellRedis {
    Write-Host "Opening Redis CLI..." -ForegroundColor Cyan
    docker-compose exec redis redis-cli -a root
}

function Test {
    Write-Host "Running tests..." -ForegroundColor Cyan
    docker-compose exec backend pytest
}

function TestCov {
    Write-Host "Running tests with coverage..." -ForegroundColor Cyan
    docker-compose exec backend pytest --cov=app --cov-report=html
}

# Production deployment
function DeployBackend {
    Write-Host "Deploying backend to Railway..." -ForegroundColor Green
    Set-Location backend
    railway up
    Set-Location ..
}

function DeployFrontend {
    Write-Host "Deploying frontend to Vercel..." -ForegroundColor Green
    Set-Location frontend
    vercel --prod
    Set-Location ..
}

# Health checks
function Health {
    Write-Host "Checking services health..." -ForegroundColor Cyan

    try {
        $backend = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "Backend: OK" -ForegroundColor Green
    } catch {
        Write-Host "Backend: DOWN" -ForegroundColor Red
    }

    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        Write-Host "Frontend: OK" -ForegroundColor Green
    } catch {
        Write-Host "Frontend: DOWN" -ForegroundColor Red
    }
}

# Help
function Help {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "  AI-KO Project - Available Commands" -ForegroundColor Cyan
    Write-Host "==========================================`n" -ForegroundColor Cyan

    Write-Host "Environment:" -ForegroundColor Yellow
    Write-Host "  Dev              - Switch to development environment"
    Write-Host "  Prod             - Switch to production environment"

    Write-Host "`nDocker (Development):" -ForegroundColor Yellow
    Write-Host "  Up               - Start all services"
    Write-Host "  Down             - Stop all services"
    Write-Host "  Restart          - Restart all services"
    Write-Host "  Build            - Rebuild all services"
    Write-Host "  Logs [service]   - Show logs (optionally for specific service)"
    Write-Host "  Ps               - Show running services"
    Write-Host "  Clean            - Stop and remove all containers, volumes"

    Write-Host "`nDatabase:" -ForegroundColor Yellow
    Write-Host "  Migrate          - Run database migrations"
    Write-Host "  MigrateCreate    - Create a new migration"
    Write-Host "  DbShell          - Open PostgreSQL shell"

    Write-Host "`nDevelopment:" -ForegroundColor Yellow
    Write-Host "  ShellBackend     - Open backend container shell"
    Write-Host "  ShellRedis       - Open Redis CLI"
    Write-Host "  Test             - Run backend tests"
    Write-Host "  TestCov          - Run tests with coverage"

    Write-Host "`nProduction:" -ForegroundColor Yellow
    Write-Host "  DeployBackend    - Deploy backend to Railway"
    Write-Host "  DeployFrontend   - Deploy frontend to Vercel"

    Write-Host "`nUtility:" -ForegroundColor Yellow
    Write-Host "  Health           - Check services health"
    Write-Host "  Help             - Show this help message"

    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Note: Run '. .\commands.ps1' to load these commands" -ForegroundColor Gray
    Write-Host "==========================================`n" -ForegroundColor Cyan
}

# Show help on load
Write-Host "`n" -NoNewline
Write-Host "AI-KO Commands Loaded!" -ForegroundColor Green
Write-Host "Type 'Help' to see available commands" -ForegroundColor Gray
Write-Host "`n" -NoNewline
