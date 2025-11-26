# Fix rapide pour l'erreur PageNotFoundError /admin/page
# Usage: .\fix-admin-quick.ps1

Write-Host "🔧 Fix rapide - Erreur /admin/page" -ForegroundColor Cyan
Write-Host ""

cd frontend

Write-Host "1. Nettoyage des caches Next.js..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

Write-Host "   ✓ Caches supprimés" -ForegroundColor Green
Write-Host ""

Write-Host "2. Redémarrage du serveur..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Instructions:" -ForegroundColor Cyan
Write-Host "   1. Le serveur va démarrer" -ForegroundColor White
Write-Host "   2. Attendre que le build soit terminé" -ForegroundColor White
Write-Host "   3. Aller sur http://localhost:3000/login" -ForegroundColor White
Write-Host "   4. Se connecter avec: admin@test.com / admin123" -ForegroundColor White
Write-Host ""

# Démarrer le serveur
pnpm dev


