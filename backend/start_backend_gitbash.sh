#!/bin/bash
# Script pour démarrer le backend Flask dans Git Bash

set -e

echo "🚀 Démarrage du Backend Flask..."
echo ""

# Aller dans le répertoire backend
cd "$(dirname "$0")" || exit 1

# Vérifier si venv existe
if [ ! -d "venv" ]; then
    echo "⚠️  L'environnement virtuel n'existe pas"
    echo "💡 Créez-le avec: python -m venv venv"
    exit 1
fi

# Vérifier si activate existe (Windows ou Linux)
if [ -f "venv/Scripts/activate" ]; then
    # Windows (Git Bash)
    ACTIVATE_SCRIPT="venv/Scripts/activate"
elif [ -f "venv/bin/activate" ]; then
    # Linux/WSL
    ACTIVATE_SCRIPT="venv/bin/activate"
else
    echo "⚠️  Le venv est incomplet (fichier activate manquant)"
    echo "💡 Recréez-le avec: python -m venv venv"
    exit 1
fi

# Activer l'environnement virtuel
echo "🔌 Activation de l'environnement virtuel..."
source "$ACTIVATE_SCRIPT"

# Vérifier que Python fonctionne
if ! command -v python &> /dev/null; then
    echo "❌ Python n'est pas disponible dans le venv"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "venv/Lib/site-packages/flask" ] && [ ! -d "venv/lib/python*/site-packages/flask" ]; then
    echo "📦 Installation des dépendances..."
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# Charger les variables d'environnement depuis .env si disponible
if [ -f "../.env" ]; then
    echo "📝 Chargement des variables d'environnement depuis .env..."
    set -a
    source ../.env
    set +a
elif [ -f ".env" ]; then
    echo "📝 Chargement des variables d'environnement depuis .env..."
    set -a
    source .env
    set +a
fi

# Configuration par défaut
export FLASK_APP=run.py
export FLASK_ENV=development

# Vérifier la base de données et exécuter les migrations
echo "🗄️  Vérification de la base de données..."
flask db upgrade 2>/dev/null || echo "⚠️  Avertissement: Problème avec les migrations (peut être normal si la DB n'existe pas encore)"

# Démarrer Flask
echo ""
echo "✅ Backend démarré sur http://localhost:5000"
echo "📚 Documentation Swagger: http://localhost:5000/api/docs/swagger/"
echo "🏥 Health check: http://localhost:5000/health"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""
python run.py








