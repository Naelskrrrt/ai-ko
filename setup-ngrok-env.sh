#!/bin/bash
# Script pour configurer automatiquement les variables d'environnement pour ngrok
# Usage: ./setup-ngrok-env.sh <backend-url> [frontend-url]

if [ -z "$1" ]; then
    echo "❌ Erreur: URL du backend ngrok requise"
    echo "Usage: ./setup-ngrok-env.sh 'https://abc123.ngrok-free.app' ['https://xyz789.ngrok-free.app']"
    exit 1
fi

BACKEND_URL=$1
FRONTEND_URL=$2

echo "🔧 Configuration des variables d'environnement pour ngrok..."
echo ""

# Configuration du frontend
echo "📝 Configuration du frontend..."
FRONTEND_ENV_PATH="frontend/.env.local"

# Créer le fichier .env.local s'il n'existe pas
if [ ! -f "$FRONTEND_ENV_PATH" ]; then
    echo "   Création du fichier $FRONTEND_ENV_PATH"
    touch "$FRONTEND_ENV_PATH"
fi

# Mettre à jour ou ajouter NEXT_PUBLIC_API_URL
if grep -q "NEXT_PUBLIC_API_URL=" "$FRONTEND_ENV_PATH"; then
    # Mettre à jour la ligne existante
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$BACKEND_URL|" "$FRONTEND_ENV_PATH"
    else
        # Linux
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$BACKEND_URL|" "$FRONTEND_ENV_PATH"
    fi
    echo "   ✅ NEXT_PUBLIC_API_URL mis à jour: $BACKEND_URL"
else
    # Ajouter la nouvelle ligne
    echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" >> "$FRONTEND_ENV_PATH"
    echo "   ✅ NEXT_PUBLIC_API_URL ajouté: $BACKEND_URL"
fi

# Configuration du backend (CORS)
if [ -n "$FRONTEND_URL" ]; then
    echo ""
    echo "📝 Configuration du backend (CORS)..."
    BACKEND_ENV_PATH=".env"
    
    if [ ! -f "$BACKEND_ENV_PATH" ]; then
        echo "   ⚠️  Fichier .env non trouvé à la racine"
        echo "   💡 Créez-le depuis env.example"
    else
        if grep -q "CORS_ORIGINS=" "$BACKEND_ENV_PATH"; then
            # Vérifier si l'URL est déjà présente
            if ! grep -q "$FRONTEND_URL" "$BACKEND_ENV_PATH"; then
                # Ajouter l'URL à CORS_ORIGINS
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    # macOS
                    sed -i '' "s|CORS_ORIGINS=\(.*\)|CORS_ORIGINS=\1,$FRONTEND_URL|" "$BACKEND_ENV_PATH"
                else
                    # Linux
                    sed -i "s|CORS_ORIGINS=\(.*\)|CORS_ORIGINS=\1,$FRONTEND_URL|" "$BACKEND_ENV_PATH"
                fi
                echo "   ✅ CORS_ORIGINS mis à jour avec: $FRONTEND_URL"
            else
                echo "   ℹ️  URL frontend déjà présente dans CORS_ORIGINS"
            fi
        else
            echo "   ⚠️  CORS_ORIGINS non trouvé dans .env"
            echo "   💡 Ajoutez manuellement: CORS_ORIGINS=http://localhost:3000,$FRONTEND_URL"
        fi
    fi
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Redémarrez le serveur frontend pour appliquer les changements"
if [ -n "$FRONTEND_URL" ]; then
    echo "   2. Redémarrez le serveur backend pour appliquer les changements CORS"
fi
echo ""




