#!/bin/bash
# Script pour exécuter tous les tests API

set -e

echo "🚀 Démarrage des tests API complets"
echo "===================================="

# Vérifier que le serveur backend est en cours d'exécution
if ! curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "⚠️  Le serveur backend ne semble pas être en cours d'exécution"
    echo "   Démarrez-le avec: python run.py ou docker-compose up"
    echo ""
    read -p "Voulez-vous continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Activer l'environnement virtuel si disponible
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Exécuter les tests
python test_all_api.py "$@"

echo ""
echo "✅ Tests terminés"








