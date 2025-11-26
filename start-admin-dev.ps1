# Script PowerShell pour démarrer le dev admin

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " AI-KO - Démarrage environnement Admin" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si les dépendances frontend sont installées
if (-Not (Test-Path "frontend/node_modules")) {
    Write-Host "Installation des dépendances frontend..." -ForegroundColor Yellow
    cd frontend
    pnpm install
    cd ..
    Write-Host "✓ Dépendances frontend installées" -ForegroundColor Green
} else {
    Write-Host "✓ Dépendances frontend déjà installées" -ForegroundColor Green
}

# Vérifier si l'environnement virtuel Python existe
if (-Not (Test-Path "backend/venv")) {
    Write-Host "Création de l'environnement virtuel Python..." -ForegroundColor Yellow
    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
    Write-Host "✓ Environnement virtuel créé" -ForegroundColor Green
} else {
    Write-Host "✓ Environnement virtuel Python existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "Démarrage des serveurs..." -ForegroundColor Cyan
Write-Host ""

# Démarrer le backend dans une nouvelle fenêtre PowerShell
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; python run.py"

# Attendre 3 secondes pour que le backend démarre
Start-Sleep -Seconds 3

# Démarrer le frontend dans une nouvelle fenêtre PowerShell
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm dev"

Write-Host ""
Write-Host "✓ Backend démarré sur http://localhost:5000" -ForegroundColor Green
Write-Host "✓ Frontend démarré sur http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Accès admin: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour créer un admin, exécutez dans le backend:" -ForegroundColor Yellow
Write-Host "python -c ""from app import create_app, db; from app.models.user import User, UserRole; app = create_app(); with app.app_context(): user = User(email='admin@test.com', name='Admin', role=UserRole.ADMIN); user.set_password('admin123'); db.session.add(user); db.session.commit(); print('Admin créé!')""" -ForegroundColor Yellow
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


