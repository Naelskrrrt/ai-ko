# Script de demarrage en mode developpement (Backend + Frontend)
# Usage: .\start-dev.ps1

Write-Host "Demarrage du projet en mode developpement..." -ForegroundColor Green

# Verifier si .env existe
if (-not (Test-Path ".\.env")) {
    Write-Host "Fichier .env non trouve. Creation depuis env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "Fichier .env cree. Veuillez le configurer avant de continuer." -ForegroundColor Yellow
    Write-Host "Assurez-vous de definir FLASK_ENV=development" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pour demarrer:" -ForegroundColor Cyan
Write-Host "   Backend:  .\start-backend.ps1" -ForegroundColor White
Write-Host "   Frontend: .\start-frontend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Ou dans des fenetres separees:" -ForegroundColor Cyan
Write-Host "   Start-Process powershell -ArgumentList '-NoExit', '-File', 'start-backend.ps1'" -ForegroundColor White
Write-Host "   Start-Process powershell -ArgumentList '-NoExit', '-File', 'start-frontend.ps1'" -ForegroundColor White
Write-Host ""
