# Script de demarrage Frontend Next.js
# Usage: .\start-frontend.ps1

Write-Host "Demarrage du Frontend Next.js..." -ForegroundColor Green

Set-Location frontend

# Verifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances Node.js..." -ForegroundColor Yellow
    pnpm install
}

# Demarrer Next.js
Write-Host ""
Write-Host "Frontend demarre sur http://localhost:3000" -ForegroundColor Green
Write-Host "Mode: Developpement (hot-reload active)" -ForegroundColor Gray
Write-Host "Appuyez sur Ctrl+C pour arreter" -ForegroundColor Gray
Write-Host ""
pnpm dev
