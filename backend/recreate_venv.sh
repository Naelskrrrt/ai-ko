#!/bin/bash
# Script pour supprimer et recréer le venv dans WSL
# Résout le problème où le venv appartient à root

set -e

echo "🔧 Correction du problème de permissions du venv..."
echo ""

cd "$(dirname "$0")" || exit 1

# Vérifier si venv existe et qui en est le propriétaire
if [ -d "venv" ]; then
    OWNER=$(stat -c '%U' venv 2>/dev/null || stat -f '%Su' venv 2>/dev/null || echo "unknown")
    echo "⚠️  Le dossier venv existe (propriétaire: $OWNER)"
    
    if [ "$OWNER" = "root" ] || [ "$OWNER" = "unknown" ]; then
        echo "🔐 Le venv appartient à root - suppression nécessaire"
        echo "🗑️  Suppression de l'ancien venv..."
        
        # Essayer de supprimer sans sudo d'abord
        if rm -rf venv 2>/dev/null; then
            echo "✅ Ancien venv supprimé"
        else
            echo "⚠️  Permission refusée, tentative avec sudo..."
            sudo rm -rf venv
            echo "✅ Ancien venv supprimé (avec sudo)"
        fi
        echo ""
    else
        echo "✅ Le venv appartient à $OWNER, mais on le recrée quand même pour être sûr"
        rm -rf venv
        echo ""
    fi
fi

# Créer le venv avec les bonnes permissions
echo "✨ Création du nouveau venv avec les bonnes permissions..."
python3 -m venv venv

# Vérifier que la création a réussi
if [ -d "venv" ]; then
    # Vérifier le propriétaire
    NEW_OWNER=$(stat -c '%U' venv 2>/dev/null || stat -f '%Su' venv 2>/dev/null || echo "unknown")
    echo "✅ Venv créé avec succès! (propriétaire: $NEW_OWNER)"
    echo ""
    
    # Si le venv appartient toujours à root, essayer de changer le propriétaire
    if [ "$NEW_OWNER" = "root" ]; then
        echo "⚠️  Le venv appartient toujours à root, correction des permissions..."
        sudo chown -R $USER:$USER venv
        echo "✅ Permissions corrigées"
        echo ""
    fi
    
    echo "📦 Pour installer les dépendances, utilisez:"
    echo "   source venv/bin/activate"
    echo "   pip install --upgrade pip"
    echo "   pip install -r requirements.txt"
    echo ""
    echo "🚀 Pour démarrer le backend:"
    echo "   source venv/bin/activate"
    echo "   python run.py"
else
    echo "❌ Erreur lors de la création du venv"
    echo ""
    echo "💡 Solution alternative: Créer le venv dans votre home WSL"
    echo "   python3 -m venv ~/venv-ai-ko"
    echo "   source ~/venv-ai-ko/bin/activate"
    exit 1
fi

