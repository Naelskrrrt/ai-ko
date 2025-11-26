#!/bin/bash
# Script pour démarrer ngrok pour le backend (port 5000)
# Usage: ./start-ngrok-backend.sh

echo "🌐 Démarrage de ngrok pour le backend (port 5000)..."
echo ""

# Vérifier si ngrok est installé globalement
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok CLI trouvé: $(which ngrok)"
    echo ""
    echo "🚀 Démarrage du tunnel ngrok pour http://localhost:5000"
    echo "📋 L'URL publique sera affichée ci-dessous"
    echo ""
    echo "⚠️  IMPORTANT: Assurez-vous que le backend est démarré sur le port 5000"
    echo ""
    ngrok http 5000
elif [ -f "frontend/scripts/ngrok-backend.js" ]; then
    echo "⚠️  ngrok CLI non trouvé globalement"
    echo "💡 Utilisation du script Node.js avec @ngrok/ngrok..."
    echo ""
    echo "✅ Script Node.js trouvé"
    echo "⚠️  Assurez-vous que NGROK_AUTHTOKEN est configuré dans .env ou frontend/.env.local"
    echo "⚠️  IMPORTANT: Assurez-vous que le backend est démarré sur le port 5000"
    echo ""
    cd frontend
    node scripts/ngrok-backend.js
else
    echo "❌ ngrok non trouvé"
    echo "💡 Solutions:"
    echo "   1. Installez ngrok globalement: npm install -g ngrok"
    echo "   2. Ou exécutez: cd frontend && pnpm install"
    exit 1
fi

