#!/bin/bash
# Script pour recréer complètement le venv dans WSL

set -e

echo "🔧 Recréation complète du venv..."
echo ""

cd "$(dirname "$0")" || exit 1

# Supprimer complètement l'ancien venv
if [ -d "venv" ]; then
    echo "🗑️  Suppression de l'ancien venv (incomplet)..."
    rm -rf venv
    echo "✅ Ancien venv supprimé"
    echo ""
fi

# Vérifier Python
echo "🐍 Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé!"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✅ $PYTHON_VERSION"
echo ""

# Créer le venv
echo "✨ Création du nouveau venv..."
python3 -m venv venv

# Vérifier que le venv a été créé correctement
if [ ! -d "venv" ]; then
    echo "❌ Erreur: Le venv n'a pas été créé"
    exit 1
fi

# Vérifier que activate existe
if [ ! -f "venv/bin/activate" ]; then
    echo "❌ Erreur: Le fichier activate n'existe pas"
    echo "💡 Tentative de réparation..."
    
    # Essayer de recréer avec --without-pip puis installer pip
    rm -rf venv
    python3 -m venv --without-pip venv
    source venv/bin/activate
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python get-pip.py
    rm get-pip.py
    deactivate
    
    if [ ! -f "venv/bin/activate" ]; then
        echo "❌ Impossible de créer le venv correctement"
        exit 1
    fi
fi

echo "✅ Venv créé avec succès!"
echo ""

# Afficher les informations
echo "📋 Contenu de venv/bin/:"
ls -la venv/bin/ | head -10
echo ""

# Vérifier les permissions
OWNER=$(stat -c '%U' venv 2>/dev/null || stat -f '%Su' venv 2>/dev/null || echo "unknown")
echo "👤 Propriétaire: $OWNER"
echo ""

# Si le venv appartient à root, corriger
if [ "$OWNER" = "root" ]; then
    echo "⚠️  Le venv appartient à root, correction..."
    sudo chown -R $USER:$USER venv
    echo "✅ Permissions corrigées"
    echo ""
fi

echo "🎉 Venv prêt à être utilisé!"
echo ""
echo "📦 Pour activer et installer les dépendances:"
echo "   source venv/bin/activate"
echo "   pip install --upgrade pip"
echo "   pip install -r requirements.txt"
echo ""
echo "🚀 Pour démarrer le backend:"
echo "   source venv/bin/activate"
echo "   python run.py"








