#!/bin/bash
# Script d'installation des hooks Git pour le projet ai-ko
# Usage: ./scripts/install-hooks.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo "📦 Installation des hooks Git..."

# Créer le répertoire hooks si nécessaire
mkdir -p "$GIT_HOOKS_DIR"

# Copier le hook pre-push
if [ -f "$SCRIPT_DIR/git-hooks/pre-push" ]; then
    cp "$SCRIPT_DIR/git-hooks/pre-push" "$GIT_HOOKS_DIR/pre-push"
    chmod +x "$GIT_HOOKS_DIR/pre-push"
    echo "✅ Hook pre-push installé"
else
    echo "❌ Hook pre-push non trouvé"
fi

echo ""
echo "🎉 Installation terminée!"
echo ""
echo "Les hooks suivants sont maintenant actifs:"
echo "  - pre-push: Vérifie le backend avant push vers main"
echo ""
echo "Pour désactiver temporairement: git push --no-verify"
