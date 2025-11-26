# Script de génération automatique des fichiers .env
# Usage: .\scripts\generate-env.ps1 -Environment DEV
#        .\scripts\generate-env.ps1 -Environment PROD -FrontendUrl "https://example.com" -BackendUrl "https://api.example.com"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("DEV", "PROD")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl
)

# Fonction pour générer un secret aléatoire
function Generate-Secret {
    param([int]$Length = 32)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $random = New-Object System.Random
    $secret = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $secret += $chars[$random.Next(0, $chars.Length)]
    }
    return $secret
}

# Fonction pour lire une valeur depuis un fichier .env
function Get-EnvValue {
    param(
        [string]$FilePath,
        [string]$Key
    )
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath
        foreach ($line in $content) {
            if ($line -match "^$Key=(.+)$") {
                return $matches[1].Trim()
            }
        }
    }
    return $null
}

# Fonction pour remplacer les placeholders dans un template
function Replace-Template {
    param(
        [string]$Template,
        [hashtable]$Replacements
    )
    $result = $Template
    foreach ($key in $Replacements.Keys) {
        $result = $result -replace "{{$key}}", $Replacements[$key]
    }
    return $result
}

# Vérifier les arguments pour PROD
if ($Environment -eq "PROD" -and -not $FrontendUrl) {
    Write-Host "❌ Erreur: Pour PROD, vous devez spécifier -FrontendUrl" -ForegroundColor Red
    Write-Host "Usage: .\scripts\generate-env.ps1 -Environment PROD -FrontendUrl `"https://example.com`"" -ForegroundColor Yellow
    exit 1
}

# Définir les chemins
$rootDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $rootDir ".env"
$frontendEnvFile = Join-Path $rootDir "frontend" ".env.local"
$templateDir = Join-Path $PSScriptRoot "env-templates"

# Vérifier que les templates existent
$rootTemplate = Join-Path $templateDir "$($Environment.ToLower()).env.template"
$frontendTemplate = Join-Path $templateDir "frontend-$($Environment.ToLower()).env.template"

if (-not (Test-Path $rootTemplate)) {
    Write-Host "❌ Erreur: Template non trouvé: $rootTemplate" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendTemplate)) {
    Write-Host "❌ Erreur: Template non trouvé: $frontendTemplate" -ForegroundColor Red
    exit 1
}

# Lire les valeurs existantes pour les préserver
$existingGoogleClientId = Get-EnvValue $envFile "GOOGLE_CLIENT_ID"
$existingGoogleClientSecret = Get-EnvValue $envFile "GOOGLE_CLIENT_SECRET"
$existingHfToken = Get-EnvValue $envFile "HF_API_TOKEN"
$existingSecretKey = Get-EnvValue $envFile "SECRET_KEY"
$existingJwtSecretKey = Get-EnvValue $envFile "JWT_SECRET_KEY"
$existingNextauthSecret = Get-EnvValue $envFile "NEXTAUTH_SECRET"
$existingBetterAuthSecret = Get-EnvValue $envFile "BETTER_AUTH_SECRET"

# Préparer les remplacements
$replacements = @{}

# Secrets - utiliser existants ou générer
$replacements["SECRET_KEY"] = if ($existingSecretKey) { $existingSecretKey } else { Generate-Secret 64 }
$replacements["JWT_SECRET_KEY"] = if ($existingJwtSecretKey) { $existingJwtSecretKey } else { Generate-Secret 64 }
$replacements["NEXTAUTH_SECRET"] = if ($existingNextauthSecret) { $existingNextauthSecret } else { Generate-Secret 64 }
$replacements["BETTER_AUTH_SECRET"] = if ($existingBetterAuthSecret) { $existingBetterAuthSecret } else { Generate-Secret 64 }

# Google OAuth - préserver les valeurs existantes
$replacements["GOOGLE_CLIENT_ID"] = if ($existingGoogleClientId) { $existingGoogleClientId } else { "change_me_google_client_id" }
$replacements["GOOGLE_CLIENT_SECRET"] = if ($existingGoogleClientSecret) { $existingGoogleClientSecret } else { "change_me_google_client_secret" }

# Hugging Face
$replacements["HF_API_TOKEN"] = if ($existingHfToken) { $existingHfToken } else { "change_me_hf_token" }

# URLs selon l'environnement
if ($Environment -eq "DEV") {
    $replacements["FRONTEND_URL"] = "http://localhost:3000"
    $replacements["CORS_ORIGINS"] = "http://localhost:3000"
    $replacements["NEXT_PUBLIC_API_URL"] = "http://localhost:5000"
    $replacements["BACKEND_INTERNAL_URL"] = "http://localhost:5000"
} else {
    # PROD
    $replacements["FRONTEND_URL"] = $FrontendUrl
    $replacements["CORS_ORIGINS"] = if ($FrontendUrl) { "http://localhost:3000,$FrontendUrl" } else { "http://localhost:3000" }
    
    # Pour PROD, déterminer les URLs API
    if ($BackendUrl) {
        $replacements["NEXT_PUBLIC_API_URL"] = $BackendUrl
        $replacements["BACKEND_INTERNAL_URL"] = $BackendUrl
    } else {
        # Si pas de backend séparé, utiliser le même domaine que le frontend
        $replacements["NEXT_PUBLIC_API_URL"] = $FrontendUrl
        $replacements["BACKEND_INTERNAL_URL"] = $FrontendUrl
    }
}

# Faire un backup des fichiers existants
if (Test-Path $envFile) {
    $backupFile = "$envFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $envFile $backupFile
    Write-Host "✅ Backup créé: $backupFile" -ForegroundColor Green
}

if (Test-Path $frontendEnvFile) {
    $backupFile = "$frontendEnvFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $frontendEnvFile $backupFile
    Write-Host "✅ Backup créé: $backupFile" -ForegroundColor Green
}

# Lire et traiter le template racine
$rootTemplateContent = Get-Content $rootTemplate -Raw
$rootEnvContent = Replace-Template -Template $rootTemplateContent -Replacements $replacements

# Lire et traiter le template frontend
$frontendTemplateContent = Get-Content $frontendTemplate -Raw
$frontendEnvContent = Replace-Template -Template $frontendTemplateContent -Replacements $replacements

# Créer le répertoire frontend si nécessaire
$frontendDir = Split-Path $frontendEnvFile -Parent
if (-not (Test-Path $frontendDir)) {
    New-Item -ItemType Directory -Path $frontendDir | Out-Null
}

# Écrire les fichiers
Set-Content -Path $envFile -Value $rootEnvContent -Encoding UTF8
Set-Content -Path $frontendEnvFile -Value $frontendEnvContent -Encoding UTF8

Write-Host ""
Write-Host "✅ Fichiers .env générés avec succès!" -ForegroundColor Green
Write-Host "   - $envFile" -ForegroundColor Cyan
Write-Host "   - $frontendEnvFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
if ($Environment -eq "PROD") {
    Write-Host "   1. Vérifiez les URLs dans les fichiers générés" -ForegroundColor White
    Write-Host "   2. Configurez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET si nécessaire" -ForegroundColor White
    Write-Host "   3. Ajoutez l'URL de redirection dans Google Cloud Console:" -ForegroundColor White
    Write-Host "      $($replacements['FRONTEND_URL'])/api/auth/callback/google" -ForegroundColor Cyan
    Write-Host "   4. Redémarrez le backend pour appliquer les changements" -ForegroundColor White
} else {
    Write-Host "   1. Vérifiez les secrets générés" -ForegroundColor White
    Write-Host "   2. Configurez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET si nécessaire" -ForegroundColor White
    Write-Host "   3. Redémarrez le backend et le frontend" -ForegroundColor White
}
Write-Host ""




