# Script pour nettoyer le cache Next.js et résoudre les problèmes de build

Write-Host "Nettoyage du cache Next.js..." -ForegroundColor Cyan

# Arrêter le serveur de dev s'il tourne
Write-Host "1. Arrêt du serveur (si actif)..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Supprimer les dossiers de cache
Write-Host "2. Suppression des caches..." -ForegroundColor Yellow

if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   ✓ .next supprimé" -ForegroundColor Green
}

if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force .turbo
    Write-Host "   ✓ .turbo supprimé" -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "   ✓ node_modules/.cache supprimé" -ForegroundColor Green
}

# Optionnel: nettoyer node_modules si vraiment nécessaire
$cleanNodeModules = Read-Host "Voulez-vous aussi supprimer node_modules? (o/N)"
if ($cleanNodeModules -eq "o" -or $cleanNodeModules -eq "O") {
    if (Test-Path "node_modules") {
        Write-Host "   Suppression de node_modules..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force node_modules
        Write-Host "   ✓ node_modules supprimé" -ForegroundColor Green
        
        Write-Host "   Réinstallation des dépendances..." -ForegroundColor Yellow
        pnpm install
        Write-Host "   ✓ Dépendances réinstallées" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✓ Nettoyage terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "Redémarrez le serveur avec:" -ForegroundColor Cyan
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""


