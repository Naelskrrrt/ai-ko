#!/bin/bash
# Script pour installer python3-venv et créer le venv dans WSL

set -e

echo "🔧 Installation de python3-venv et création du venv..."
echo ""

cd "$(dirname "$0")" || exit 1

# Vérifier si python3-venv est installé
echo "🔍 Vérification de python3-venv..."
if ! python3 -m venv --help &> /dev/null; then
    echo "⚠️  python3-venv n'est pas installé"
    echo "📦 Installation de python3-venv..."
    
    # Détecter la distribution Linux
    if command -v apt &> /dev/null; then
        # Ubuntu/Debian
        PYTHON_VERSION=$(python3 --version | grep -oP '\d+\.\d+' | head -1)
        echo "   Installation de python${PYTHON_VERSION}-venv..."
        sudo apt update
        sudo apt install -y python${PYTHON_VERSION}-venv python3-pip
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        sudo yum install -y python3-venv
    elif command -v dnf &> /dev/null; then
        # Fedora
        sudo dnf install -y python3-venv
    else
        echo "❌ Distribution Linux non reconnue"
        echo "   Installez manuellement python3-venv pour votre distribution"
        exit 1
    fi
    
    echo "✅ python3-venv installé"
    echo ""
else
    echo "✅ python3-venv est déjà installé"
    echo ""
fi

# Supprimer l'ancien venv s'il existe
if [ -d "venv" ]; then
    echo "🗑️  Suppression de l'ancien venv..."
    rm -rf venv
    echo "✅ Ancien venv supprimé"
    echo ""
fi

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
    echo "❌ Erreur: Le fichier activate n'existe toujours pas"
    echo "💡 Vérifiez que python3-venv est correctement installé"
    exit 1
fi

echo "✅ Venv créé avec succès!"
echo ""

# Vérifier les permissions
OWNER=$(stat -c '%U' venv 2>/dev/null || stat -f '%Su' venv 2>/dev/null || echo "unknown")
echo "👤 Propriétaire: $OWNER"

# Si le venv appartient à root, corriger
if [ "$OWNER" = "root" ]; then
    echo "⚠️  Le venv appartient à root, correction..."
    sudo chown -R $USER:$USER venv
    echo "✅ Permissions corrigées"
fi

echo ""
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








