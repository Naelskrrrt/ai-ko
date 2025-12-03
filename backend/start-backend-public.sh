#!/bin/bash
# Script Bash pour démarrer le backend avec Ngrok
# Usage: ./start-backend-public.sh

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"
NGROK_CONFIG="$BACKEND_DIR/ngrok.yml"

echo "🚀 Démarrage du backend AI-KO avec Ngrok..."
echo ""

# Vérifier venv
if [ ! -f "$VENV_PYTHON" ]; then
    echo "❌ Erreur : venv non trouvé. Exécutez : python -m venv venv"
    echo "   Puis installez les dépendances : source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Vérifier ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ Erreur : ngrok non installé."
    echo ""
    echo "Installation rapide :"
    echo "  1. Téléchargez depuis https://ngrok.com/download"
    echo "  2. Ou via package manager :"
    echo "     - Linux: sudo snap install ngrok"
    echo "     - Mac: brew install ngrok/ngrok/ngrok"
    echo "  3. Créez un compte gratuit sur https://dashboard.ngrok.com/signup"
    echo "  4. Configurez votre token : ngrok config add-authtoken VOTRE_TOKEN"
    echo ""
    exit 1
fi

# Vérifier ngrok.yml
if [ ! -f "$NGROK_CONFIG" ]; then
    echo "⚠️  Fichier ngrok.yml non trouvé. Création automatique..."
    
    read -p "Entrez votre token Ngrok (depuis https://dashboard.ngrok.com/get-started/your-authtoken) : " token
    
    cat > "$NGROK_CONFIG" <<EOF
version: "2"
authtoken: $token

tunnels:
  backend:
    proto: http
    addr: 5000
    inspect: true
    bind_tls: true
    log_level: info
EOF
    
    echo "✅ Fichier ngrok.yml créé!"
    echo ""
fi

# Démarrer Flask
echo "📦 Démarrage du serveur Flask sur http://localhost:5000..."
cd "$BACKEND_DIR"
source venv/bin/activate
python run.py > /tmp/backend-flask.log 2>&1 &
BACKEND_PID=$!

# Attendre Flask
echo "⏳ Attente du démarrage de Flask (5 secondes)..."
sleep 5

# Vérifier si Flask a démarré
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Erreur : Le backend Flask n'a pas pu démarrer"
    echo "Logs :"
    cat /tmp/backend-flask.log
    exit 1
fi

echo "✅ Backend Flask démarré (PID: $BACKEND_PID)"

# Démarrer Ngrok
echo "🌐 Démarrage du tunnel Ngrok..."
ngrok start backend --config "$NGROK_CONFIG" --log=stdout > /tmp/backend-ngrok.log 2>&1 &
NGROK_PID=$!

echo "⏳ Attente du démarrage de Ngrok (3 secondes)..."
sleep 3

# Vérifier si Ngrok a démarré
if ! kill -0 $NGROK_PID 2>/dev/null; then
    echo "❌ Erreur : Ngrok n'a pas pu démarrer"
    echo "Logs :"
    cat /tmp/backend-ngrok.log
    kill $BACKEND_PID
    exit 1
fi

echo "✅ Tunnel Ngrok démarré (PID: $NGROK_PID)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Dashboard Ngrok : http://127.0.0.1:4040"
echo "🔗 Copiez l'URL publique depuis le dashboard Ngrok"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Prochaines étapes :"
echo "  1. Ouvrez le dashboard Ngrok : http://127.0.0.1:4040"
echo "  2. Copiez l'URL publique (ex: https://abc123.ngrok.io)"
echo "  3. Mettez à jour Vercel avec cette URL :"
echo ""
echo "     Dans Vercel Dashboard → Settings → Environment Variables :"
echo "       BACKEND_INTERNAL_URL = https://votre-url.ngrok.io"
echo "       NEXT_PUBLIC_API_URL = https://votre-url.ngrok.io"
echo ""
echo "  4. Redéployez Vercel : vercel --prod"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💾 PIDs sauvegardés :"
echo "  Backend Flask : $BACKEND_PID"
echo "  Ngrok Tunnel  : $NGROK_PID"
echo ""
echo "🛑 Pour arrêter les services :"
echo "  kill $BACKEND_PID $NGROK_PID"
echo ""
echo "💡 Astuce : L'URL Ngrok change à chaque redémarrage (plan gratuit)"
echo "   Pour une URL fixe, passez au plan Ngrok Pro (\$8/mois)"
echo ""

# Sauvegarder les PIDs dans un fichier
echo "$BACKEND_PID $NGROK_PID" > "$BACKEND_DIR/.backend-pids"

# Ouvrir le dashboard (si disponible)
if command -v xdg-open &> /dev/null; then
    xdg-open http://127.0.0.1:4040 &>/dev/null &
elif command -v open &> /dev/null; then
    open http://127.0.0.1:4040 &>/dev/null &
fi

echo "✨ Tout est prêt! Le backend est maintenant accessible publiquement."
echo ""



