# Script pour nettoyer le cache Next.js et redémarrer le serveur

Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Cyan

# Supprimer le dossier .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cache .next supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Pas de cache .next à supprimer" -ForegroundColor Yellow
}

# Optionnel: Supprimer node_modules/.cache si présent
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cache node_modules supprimé" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Cache nettoyé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour redémarrer le serveur de développement:" -ForegroundColor Cyan
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host "  ou" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
