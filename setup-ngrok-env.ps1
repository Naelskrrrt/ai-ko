# Script pour configurer automatiquement les variables d'environnement pour ngrok
# Usage: .\setup-ngrok-env.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl = ""
)

Write-Host "🔧 Configuration des variables d'environnement pour ngrok..." -ForegroundColor Green
Write-Host ""

# Vérifier que l'URL backend est fournie
if (-not $BackendUrl) {
    Write-Host "❌ Erreur: URL du backend ngrok requise" -ForegroundColor Red
    Write-Host "Usage: .\setup-ngrok-env.ps1 -BackendUrl 'https://abc123.ngrok-free.app'" -ForegroundColor Yellow
    exit 1
}

# Configuration du frontend
Write-Host "📝 Configuration du frontend..." -ForegroundColor Cyan
$frontendEnvPath = "frontend\.env.local"

# Créer le fichier .env.local s'il n'existe pas
if (-not (Test-Path $frontendEnvPath)) {
    Write-Host "   Création du fichier $frontendEnvPath" -ForegroundColor Yellow
    New-Item -Path $frontendEnvPath -ItemType File -Force | Out-Null
}

# Lire le contenu existant
$frontendContent = ""
if (Test-Path $frontendEnvPath) {
    $frontendContent = Get-Content $frontendEnvPath -Raw
}

# Mettre à jour ou ajouter NEXT_PUBLIC_API_URL
if ($frontendContent -match "NEXT_PUBLIC_API_URL=") {
    $frontendContent = $frontendContent -replace "NEXT_PUBLIC_API_URL=.*", "NEXT_PUBLIC_API_URL=$BackendUrl"
    Write-Host "   ✅ NEXT_PUBLIC_API_URL mis à jour: $BackendUrl" -ForegroundColor Green
} else {
    $frontendContent += "`nNEXT_PUBLIC_API_URL=$BackendUrl`n"
    Write-Host "   ✅ NEXT_PUBLIC_API_URL ajouté: $BackendUrl" -ForegroundColor Green
}

# Écrire le fichier
Set-Content -Path $frontendEnvPath -Value $frontendContent.Trim()

# Configuration du backend (CORS)
if ($FrontendUrl) {
    Write-Host ""
    Write-Host "📝 Configuration du backend (CORS)..." -ForegroundColor Cyan
    $backendEnvPath = ".env"
    
    if (-not (Test-Path $backendEnvPath)) {
        Write-Host "   ⚠️  Fichier .env non trouvé à la racine" -ForegroundColor Yellow
        Write-Host "   💡 Créez-le depuis env.example" -ForegroundColor Yellow
    } else {
        $backendContent = Get-Content $backendEnvPath -Raw
        
        if ($backendContent -match "CORS_ORIGINS=") {
            # Vérifier si l'URL est déjà présente
            if ($backendContent -notmatch [regex]::Escape($FrontendUrl)) {
                $backendContent = $backendContent -replace "CORS_ORIGINS=(.*)", "CORS_ORIGINS=`$1,$FrontendUrl"
                Write-Host "   ✅ CORS_ORIGINS mis à jour avec: $FrontendUrl" -ForegroundColor Green
                Set-Content -Path $backendEnvPath -Value $backendContent
            } else {
                Write-Host "   ℹ️  URL frontend déjà présente dans CORS_ORIGINS" -ForegroundColor Cyan
            }
        } else {
            Write-Host "   ⚠️  CORS_ORIGINS non trouvé dans .env" -ForegroundColor Yellow
            Write-Host "   💡 Ajoutez manuellement: CORS_ORIGINS=http://localhost:3000,$FrontendUrl" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Redémarrez le serveur frontend pour appliquer les changements" -ForegroundColor White
if ($FrontendUrl) {
    Write-Host "   2. Redémarrez le serveur backend pour appliquer les changements CORS" -ForegroundColor White
}
Write-Host ""




