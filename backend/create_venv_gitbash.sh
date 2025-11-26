#!/bin/bash
# Script pour créer le venv dans Git Bash

set -e

echo "🔧 Création de l'environnement virtuel Python..."
echo ""

cd "$(dirname "$0")" || exit 1

# Vérifier Python
echo "🐍 Vérification de Python..."
if ! command -v python &> /dev/null; then
    echo "❌ Python n'est pas installé ou pas dans le PATH!"
    echo "💡 Installez Python depuis https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python --version 2>&1)
echo "✅ $PYTHON_VERSION"
echo ""

# Supprimer l'ancien venv s'il existe
if [ -d "venv" ]; then
    echo "🗑️  Suppression de l'ancien venv..."
    rm -rf venv
    echo "✅ Ancien venv supprimé"
    echo ""
fi

# Créer le venv
echo "✨ Création du nouveau venv..."
python -m venv venv

# Vérifier que le venv a été créé correctement
if [ ! -d "venv" ]; then
    echo "❌ Erreur: Le venv n'a pas été créé"
    exit 1
fi

# Vérifier que activate existe
if [ -f "venv/Scripts/activate" ]; then
    ACTIVATE_FILE="venv/Scripts/activate"
elif [ -f "venv/bin/activate" ]; then
    ACTIVATE_FILE="venv/bin/activate"
else
    echo "❌ Erreur: Le fichier activate n'existe pas"
    exit 1
fi

echo "✅ Venv créé avec succès!"
echo "📁 Fichier activate: $ACTIVATE_FILE"
echo ""

echo "🎉 Venv prêt à être utilisé!"
echo ""
echo "📦 Pour activer et installer les dépendances:"
echo "   source $ACTIVATE_FILE"
echo "   pip install --upgrade pip"
echo "   pip install -r requirements.txt"
echo ""
echo "🚀 Pour démarrer le backend:"
echo "   source $ACTIVATE_FILE"
echo "   python run.py"
echo ""
echo "   Ou utilisez: ./start_backend_gitbash.sh"








