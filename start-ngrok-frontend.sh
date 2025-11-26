#!/bin/bash
# Script pour démarrer ngrok pour le frontend (port 3000)
# Usage: ./start-ngrok-frontend.sh

echo "🌐 Démarrage de ngrok pour le frontend (port 3000)..."
echo ""

# Vérifier si ngrok est installé globalement
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok CLI trouvé: $(which ngrok)"
    echo ""
    echo "🚀 Démarrage du tunnel ngrok pour http://localhost:3000"
    echo "📋 L'URL publique sera affichée ci-dessous"
    echo ""
    ngrok http 3000
elif [ -f "frontend/scripts/ngrok-frontend.js" ]; then
    echo "⚠️  ngrok CLI non trouvé globalement"
    echo "💡 Utilisation du script Node.js avec @ngrok/ngrok..."
    echo ""
    echo "✅ Script Node.js trouvé"
    echo "⚠️  Assurez-vous que NGROK_AUTHTOKEN est configuré dans .env ou frontend/.env.local"
    echo ""
    cd frontend
    node scripts/ngrok-frontend.js
else
    echo "❌ ngrok non trouvé"
    echo "💡 Solutions:"
    echo "   1. Installez ngrok globalement: npm install -g ngrok"
    echo "   2. Ou exécutez: cd frontend && pnpm install"
    exit 1
fi

