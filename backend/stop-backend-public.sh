#!/bin/bash
# Script pour arrêter le backend et Ngrok
# Usage: ./stop-backend-public.sh

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$BACKEND_DIR/.backend-pids"

echo "🛑 Arrêt du backend et Ngrok..."
echo ""

if [ -f "$PID_FILE" ]; then
    # Lire les PIDs
    read BACKEND_PID NGROK_PID < "$PID_FILE"
    
    # Arrêter Flask
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "⏹️  Arrêt du backend Flask (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ Backend arrêté"
    else
        echo "⚠️  Backend Flask déjà arrêté ou PID invalide"
    fi
    
    # Arrêter Ngrok
    if kill -0 $NGROK_PID 2>/dev/null; then
        echo "⏹️  Arrêt du tunnel Ngrok (PID: $NGROK_PID)..."
        kill $NGROK_PID
        echo "✅ Ngrok arrêté"
    else
        echo "⚠️  Ngrok déjà arrêté ou PID invalide"
    fi
    
    # Supprimer le fichier de PIDs
    rm "$PID_FILE"
    echo ""
    echo "✅ Tous les services ont été arrêtés"
else
    echo "⚠️  Fichier .backend-pids non trouvé"
    echo "   Arrêt manuel des processus Python et Ngrok..."
    
    # Essayer de tuer les processus par nom
    pkill -f "python run.py"
    pkill -f "ngrok"
    
    echo "✅ Processus arrêtés"
fi

echo ""



