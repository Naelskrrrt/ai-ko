# Script PowerShell pour faciliter l'exécution du vérificateur MVP

Write-Host "🔍 Vérification de l'état du MVP..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que Python est installé
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python trouvé: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé ou pas dans le PATH" -ForegroundColor Yellow
    exit 1
}

# Vérifier que le script existe
if (-not (Test-Path "check_mvp_progress.py")) {
    Write-Host "❌ check_mvp_progress.py introuvable" -ForegroundColor Yellow
    exit 1
}

# Créer le dossier reports s'il n'existe pas
if (-not (Test-Path "reports")) {
    New-Item -ItemType Directory -Path "reports" | Out-Null
}

# Générer les rapports
Write-Host "📊 Génération des rapports..." -ForegroundColor Cyan
Write-Host ""

# Rapport Markdown
python check_mvp_progress.py --format markdown --output reports/mvp_progress.md
Write-Host "✅ Rapport Markdown généré: reports/mvp_progress.md" -ForegroundColor Green

# Rapport HTML
python check_mvp_progress.py --format html --output reports/mvp_progress.html
Write-Host "✅ Rapport HTML généré: reports/mvp_progress.html" -ForegroundColor Green

# Rapport JSON
python check_mvp_progress.py --format json --output reports/mvp_progress.json
Write-Host "✅ Rapport JSON généré: reports/mvp_progress.json" -ForegroundColor Green

Write-Host ""
Write-Host "📈 Résumé:" -ForegroundColor Cyan
python check_mvp_progress.py --format markdown | Select-Object -First 10

Write-Host ""
Write-Host "✨ Tous les rapports ont été générés dans le dossier reports/" -ForegroundColor Green
Write-Host "💡 Ouvrez reports/mvp_progress.html dans votre navigateur pour voir le rapport visuel" -ForegroundColor Cyan



