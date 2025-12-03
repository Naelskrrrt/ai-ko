# ===============================================
# Script de basculement d'environnement - Windows PowerShell
# ===============================================
# Usage: .\switch-env.ps1 dev   # Basculer vers dev
#        .\switch-env.ps1 prod  # Basculer vers prod
# ===============================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"

# Couleurs pour les messages
function Write-ColorOutput($message, $color = "White") {
    Write-Host $message -ForegroundColor $color
}

# Banner
Write-ColorOutput "`n============================================" "Cyan"
Write-ColorOutput "   AI-KO Environment Switcher (Windows)" "Cyan"
Write-ColorOutput "============================================`n" "Cyan"

# Vérifier que les fichiers d'environnement existent
$envFile = ".env.$Environment"
if (-Not (Test-Path $envFile)) {
    Write-ColorOutput "Erreur: Le fichier $envFile n'existe pas!" "Red"
    exit 1
}

# Backup de l'ancien .env si existe
if (Test-Path ".env") {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = ".env.backup.$timestamp"
    Write-ColorOutput "Sauvegarde de l'ancien .env vers $backupFile..." "Yellow"
    Copy-Item ".env" $backupFile
}

# Copier le nouveau fichier d'environnement
Write-ColorOutput "Basculement vers l'environnement: $Environment" "Green"
Copy-Item $envFile ".env" -Force

# Afficher les informations de l'environnement
Write-ColorOutput "`nEnvironnement actif: " "White" -NoNewline
Write-ColorOutput "$Environment" "Green"

# Lire quelques variables importantes du fichier .env
$content = Get-Content ".env"
$flaskEnv = ($content | Select-String "^FLASK_ENV=").ToString().Split("=")[1]
$apiUrl = ($content | Select-String "^NEXT_PUBLIC_API_URL=").ToString().Split("=")[1]
$nodeEnv = ($content | Select-String "^NODE_ENV=").ToString().Split("=")[1]

Write-ColorOutput "`nConfiguration:" "Cyan"
Write-ColorOutput "  - FLASK_ENV: $flaskEnv" "White"
Write-ColorOutput "  - NODE_ENV: $nodeEnv" "White"
Write-ColorOutput "  - API_URL: $apiUrl" "White"

# Instructions suivantes
Write-ColorOutput "`nProchaines étapes:" "Yellow"
if ($Environment -eq "dev") {
    Write-ColorOutput "  1. Démarrer Docker: docker-compose up -d" "White"
    Write-ColorOutput "  2. Voir les logs: docker-compose logs -f" "White"
    Write-ColorOutput "  3. Arrêter: docker-compose down" "White"
} else {
    Write-ColorOutput "  1. Backend: cd backend && railway up" "White"
    Write-ColorOutput "  2. Frontend: cd frontend && railway up" "White"
    Write-ColorOutput "  3. Vérifier les variables dans Railway UI" "White"
}

Write-ColorOutput "`n============================================" "Cyan"
Write-ColorOutput "Basculement terminé avec succès!" "Green"
Write-ColorOutput "============================================`n" "Cyan"
