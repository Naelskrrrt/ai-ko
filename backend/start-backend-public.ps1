# Script PowerShell pour démarrer le backend avec Ngrok
# Usage: .\start-backend-public.ps1

# Configuration
$BACKEND_DIR = $PSScriptRoot
$VENV_PYTHON = "$BACKEND_DIR\venv\Scripts\python.exe"
$NGROK_CONFIG = "$BACKEND_DIR\ngrok.yml"

Write-Host "🚀 Démarrage du backend AI-KO avec Ngrok..." -ForegroundColor Green
Write-Host ""

# Vérifier que le venv existe
if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "❌ Erreur : venv non trouvé. Exécutez d'abord : python -m venv venv" -ForegroundColor Red
    Write-Host "   Puis installez les dépendances : .\venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Vérifier que ngrok est installé
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Erreur : ngrok n'est pas installé." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation rapide :" -ForegroundColor Yellow
    Write-Host "  1. Téléchargez depuis https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Ou via Chocolatey : choco install ngrok" -ForegroundColor White
    Write-Host "  3. Créez un compte gratuit sur https://dashboard.ngrok.com/signup" -ForegroundColor White
    Write-Host "  4. Configurez votre token : ngrok config add-authtoken VOTRE_TOKEN" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Vérifier que le fichier ngrok.yml existe
if (-not (Test-Path $NGROK_CONFIG)) {
    Write-Host "⚠️  Fichier ngrok.yml non trouvé. Création automatique..." -ForegroundColor Yellow
    
    # Demander le token
    $token = Read-Host "Entrez votre token Ngrok (depuis https://dashboard.ngrok.com/get-started/your-authtoken)"
    
    # Créer ngrok.yml
    @"
version: "2"
authtoken: $token

tunnels:
  backend:
    proto: http
    addr: 5000
    inspect: true
    bind_tls: true
    log_level: info
"@ | Out-File -FilePath $NGROK_CONFIG -Encoding UTF8
    
    Write-Host "✅ Fichier ngrok.yml créé!" -ForegroundColor Green
    Write-Host ""
}

# Démarrer Flask
Write-Host "📦 Démarrage du serveur Flask sur http://localhost:5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$BACKEND_DIR'; .\venv\Scripts\Activate.ps1; Write-Host '🐍 Backend Flask démarré' -ForegroundColor Green; python run.py"

# Attendre que Flask démarre
Write-Host "⏳ Attente du démarrage de Flask (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Démarrer Ngrok
Write-Host "🌐 Démarrage du tunnel Ngrok..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "Write-Host '🌐 Tunnel Ngrok démarré' -ForegroundColor Green; ngrok start backend --config '$NGROK_CONFIG'"

# Attendre que Ngrok démarre
Write-Host "⏳ Attente du démarrage de Ngrok (3 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Backend et Ngrok démarrés avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Dashboard Ngrok : " -NoNewline -ForegroundColor Yellow
Write-Host "http://127.0.0.1:4040" -ForegroundColor White
Write-Host "🔗 Copiez l'URL publique depuis le dashboard Ngrok" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "  1. Ouvrez le dashboard Ngrok (ouverture automatique...)" -ForegroundColor White
Write-Host "  2. Copiez l'URL publique (ex: https://abc123.ngrok.io)" -ForegroundColor White
Write-Host "  3. Mettez à jour Vercel avec cette URL :" -ForegroundColor White
Write-Host ""
Write-Host "     Dans Vercel Dashboard → Settings → Environment Variables :" -ForegroundColor Gray
Write-Host "       BACKEND_INTERNAL_URL = https://votre-url.ngrok.io" -ForegroundColor White
Write-Host "       NEXT_PUBLIC_API_URL = https://votre-url.ngrok.io" -ForegroundColor White
Write-Host ""
Write-Host "  4. Redéployez Vercel : " -NoNewline -ForegroundColor White
Write-Host "vercel --prod" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Astuce : L'URL Ngrok change à chaque redémarrage (plan gratuit)" -ForegroundColor Yellow
Write-Host "   Pour une URL fixe, passez au plan Ngrok Pro ($8/mois)" -ForegroundColor Yellow
Write-Host ""

# Ouvrir le dashboard Ngrok automatiquement
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:4040"

Write-Host "✨ Tout est prêt! Le backend est maintenant accessible publiquement." -ForegroundColor Green
Write-Host ""



