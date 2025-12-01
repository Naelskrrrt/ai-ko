# Script PowerShell pour configurer les variables d'environnement sur Vercel

Write-Host "🔧 Configuration des variables d'environnement sur Vercel..." -ForegroundColor Cyan

$PROJECT_NAME = "frontend"

Write-Host "📝 Ajout des variables d'environnement..." -ForegroundColor Yellow

# Backend URL interne (pour les appels côté serveur)
Write-Host "Adding BACKEND_INTERNAL_URL..." -ForegroundColor Gray
"http://147.93.90.223:5000" | vercel env add BACKEND_INTERNAL_URL production

# API URL publique (pour les appels côté client) - vide pour utiliser la détection automatique
Write-Host "Adding NEXT_PUBLIC_API_URL..." -ForegroundColor Gray
"http://147.93.90.223:5000" | vercel env add NEXT_PUBLIC_API_URL production

# NextAuth configuration
Write-Host "Adding NEXTAUTH_SECRET..." -ForegroundColor Gray
"J6kL9mN2oP5qR8sT1uV4wX7yZ0aB3cD6eF9gH2iJ5kL8mN1oP4qR7sT0u" | vercel env add NEXTAUTH_SECRET production

# Better Auth configuration
Write-Host "Adding BETTER_AUTH_SECRET..." -ForegroundColor Gray
"M3nO6pQ9rS2tU5vW8xY1zA4bC7dE0fG3hI6jK9lM2nO5pQ8rS1tU4vW7x" | vercel env add BETTER_AUTH_SECRET production

# Google OAuth
Write-Host "Adding GOOGLE_CLIENT_ID..." -ForegroundColor Gray
if (-not $env:GOOGLE_CLIENT_ID) {
    Write-Host "❌ Erreur: GOOGLE_CLIENT_ID n'est pas défini dans les variables d'environnement" -ForegroundColor Red
    exit 1
}
$env:GOOGLE_CLIENT_ID | vercel env add GOOGLE_CLIENT_ID production

Write-Host "Adding GOOGLE_CLIENT_SECRET..." -ForegroundColor Gray
if (-not $env:GOOGLE_CLIENT_SECRET) {
    Write-Host "❌ Erreur: GOOGLE_CLIENT_SECRET n'est pas défini dans les variables d'environnement" -ForegroundColor Red
    exit 1
}
$env:GOOGLE_CLIENT_SECRET | vercel env add GOOGLE_CLIENT_SECRET production

Write-Host ""
Write-Host "✅ Variables d'environnement configurées avec succès!" -ForegroundColor Green
Write-Host "🔄 Redéploiement en cours pour appliquer les changements..." -ForegroundColor Yellow
Write-Host ""

# Redéployer automatiquement
vercel --prod --yes

Write-Host ""
Write-Host "🎉 Déploiement terminé!" -ForegroundColor Green
