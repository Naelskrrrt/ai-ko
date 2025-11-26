#!/bin/bash
# Script pour corriger les permissions et créer/recreer le venv dans WSL

echo "🔧 Correction des permissions du venv..."

cd "$(dirname "$0")" || exit 1

# Vérifier si venv existe
if [ -d "venv" ]; then
    echo "⚠️  Le dossier venv existe déjà"
    echo "🗑️  Suppression de l'ancien venv..."
    rm -rf venv
fi

# Vérifier les permissions du dossier backend
echo "📋 Vérification des permissions..."
ls -la . | head -5

# Créer le venv avec les bonnes permissions
echo "✨ Création du nouveau venv..."
python3 -m venv venv

# Vérifier que la création a réussi
if [ -d "venv" ]; then
    echo "✅ Venv créé avec succès!"
    echo ""
    echo "Pour activer le venv, utilisez:"
    echo "  source venv/bin/activate"
else
    echo "❌ Erreur lors de la création du venv"
    echo ""
    echo "Solutions alternatives:"
    echo "1. Créer le venv dans un autre emplacement:"
    echo "   python3 -m venv ~/venv-ai-ko"
    echo ""
    echo "2. Utiliser un venv existant ailleurs"
    echo ""
    echo "3. Vérifier les permissions avec:"
    echo "   sudo chown -R \$USER:\$USER ."
    exit 1
fi








