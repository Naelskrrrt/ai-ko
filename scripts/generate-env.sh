#!/bin/bash
# Script de génération automatique des fichiers .env
# Usage: ./scripts/generate-env.sh DEV
#        ./scripts/generate-env.sh PROD "https://example.com" "https://api.example.com"

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour générer un secret aléatoire
generate_secret() {
    local length=${1:-32}
    openssl rand -hex $((length / 2)) | head -c $length
}

# Fonction pour lire une valeur depuis un fichier .env
get_env_value() {
    local file_path="$1"
    local key="$2"
    if [ -f "$file_path" ]; then
        grep "^${key}=" "$file_path" | cut -d '=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || echo ""
    else
        echo ""
    fi
}

# Fonction pour remplacer les placeholders dans un template
replace_template() {
    local template="$1"
    local key="$2"
    local value="$3"
    echo "$template" | sed "s|{{${key}}}|${value}|g"
}

# Vérifier les arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Erreur: Environnement manquant${NC}"
    echo "Usage: $0 DEV"
    echo "       $0 PROD \"https://example.com\" [\"https://api.example.com\"]"
    exit 1
fi

ENVIRONMENT=$(echo "$1" | tr '[:lower:]' '[:upper:]')
FRONTEND_URL="$2"
BACKEND_URL="$3"

# Valider l'environnement
if [ "$ENVIRONMENT" != "DEV" ] && [ "$ENVIRONMENT" != "PROD" ]; then
    echo -e "${RED}❌ Erreur: Environnement doit être DEV ou PROD${NC}"
    exit 1
fi

# Vérifier les arguments pour PROD
if [ "$ENVIRONMENT" = "PROD" ] && [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}❌ Erreur: Pour PROD, vous devez spécifier l'URL du frontend${NC}"
    echo "Usage: $0 PROD \"https://example.com\" [\"https://api.example.com\"]"
    exit 1
fi

# Définir les chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
FRONTEND_ENV_FILE="$ROOT_DIR/frontend/.env.local"
TEMPLATE_DIR="$SCRIPT_DIR/env-templates"

# Vérifier que les templates existent
ROOT_TEMPLATE="$TEMPLATE_DIR/${ENVIRONMENT,,}.env.template"
FRONTEND_TEMPLATE="$TEMPLATE_DIR/frontend-${ENVIRONMENT,,}.env.template"

if [ ! -f "$ROOT_TEMPLATE" ]; then
    echo -e "${RED}❌ Erreur: Template non trouvé: $ROOT_TEMPLATE${NC}"
    exit 1
fi

if [ ! -f "$FRONTEND_TEMPLATE" ]; then
    echo -e "${RED}❌ Erreur: Template non trouvé: $FRONTEND_TEMPLATE${NC}"
    exit 1
fi

# Lire les valeurs existantes pour les préserver
EXISTING_GOOGLE_CLIENT_ID=$(get_env_value "$ENV_FILE" "GOOGLE_CLIENT_ID")
EXISTING_GOOGLE_CLIENT_SECRET=$(get_env_value "$ENV_FILE" "GOOGLE_CLIENT_SECRET")
EXISTING_HF_TOKEN=$(get_env_value "$ENV_FILE" "HF_API_TOKEN")
EXISTING_SECRET_KEY=$(get_env_value "$ENV_FILE" "SECRET_KEY")
EXISTING_JWT_SECRET_KEY=$(get_env_value "$ENV_FILE" "JWT_SECRET_KEY")
EXISTING_NEXTAUTH_SECRET=$(get_env_value "$ENV_FILE" "NEXTAUTH_SECRET")
EXISTING_BETTER_AUTH_SECRET=$(get_env_value "$ENV_FILE" "BETTER_AUTH_SECRET")

# Préparer les remplacements
if [ -n "$EXISTING_SECRET_KEY" ]; then
    SECRET_KEY="$EXISTING_SECRET_KEY"
else
    SECRET_KEY=$(generate_secret 64)
fi

if [ -n "$EXISTING_JWT_SECRET_KEY" ]; then
    JWT_SECRET_KEY="$EXISTING_JWT_SECRET_KEY"
else
    JWT_SECRET_KEY=$(generate_secret 64)
fi

if [ -n "$EXISTING_NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET="$EXISTING_NEXTAUTH_SECRET"
else
    NEXTAUTH_SECRET=$(generate_secret 64)
fi

if [ -n "$EXISTING_BETTER_AUTH_SECRET" ]; then
    BETTER_AUTH_SECRET="$EXISTING_BETTER_AUTH_SECRET"
else
    BETTER_AUTH_SECRET=$(generate_secret 64)
fi

GOOGLE_CLIENT_ID="${EXISTING_GOOGLE_CLIENT_ID:-change_me_google_client_id}"
GOOGLE_CLIENT_SECRET="${EXISTING_GOOGLE_CLIENT_SECRET:-change_me_google_client_secret}"
HF_API_TOKEN="${EXISTING_HF_TOKEN:-change_me_hf_token}"

# URLs selon l'environnement
if [ "$ENVIRONMENT" = "DEV" ]; then
    FRONTEND_URL_VALUE="http://localhost:3000"
    CORS_ORIGINS="http://localhost:3000"
    NEXT_PUBLIC_API_URL="http://localhost:5000"
    BACKEND_INTERNAL_URL="http://localhost:5000"
else
    # PROD
    FRONTEND_URL_VALUE="$FRONTEND_URL"
    if [ -n "$FRONTEND_URL" ]; then
        CORS_ORIGINS="http://localhost:3000,$FRONTEND_URL"
    else
        CORS_ORIGINS="http://localhost:3000"
    fi
    
    # Pour PROD, déterminer les URLs API
    if [ -n "$BACKEND_URL" ]; then
        NEXT_PUBLIC_API_URL="$BACKEND_URL"
        BACKEND_INTERNAL_URL="$BACKEND_URL"
    else
        # Si pas de backend séparé, utiliser le même domaine que le frontend
        NEXT_PUBLIC_API_URL="$FRONTEND_URL"
        BACKEND_INTERNAL_URL="$FRONTEND_URL"
    fi
fi

# Faire un backup des fichiers existants
if [ -f "$ENV_FILE" ]; then
    BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
fi

if [ -f "$FRONTEND_ENV_FILE" ]; then
    BACKUP_FILE="${FRONTEND_ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$FRONTEND_ENV_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
fi

# Lire et traiter le template racine
ROOT_TEMPLATE_CONTENT=$(cat "$ROOT_TEMPLATE")
ROOT_ENV_CONTENT="$ROOT_TEMPLATE_CONTENT"
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "SECRET_KEY" "$SECRET_KEY")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "JWT_SECRET_KEY" "$JWT_SECRET_KEY")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "HF_API_TOKEN" "$HF_API_TOKEN")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "FRONTEND_URL" "$FRONTEND_URL_VALUE")
ROOT_ENV_CONTENT=$(replace_template "$ROOT_ENV_CONTENT" "CORS_ORIGINS" "$CORS_ORIGINS")

# Lire et traiter le template frontend
FRONTEND_TEMPLATE_CONTENT=$(cat "$FRONTEND_TEMPLATE")
FRONTEND_ENV_CONTENT="$FRONTEND_TEMPLATE_CONTENT"
FRONTEND_ENV_CONTENT=$(replace_template "$FRONTEND_ENV_CONTENT" "NEXT_PUBLIC_API_URL" "$NEXT_PUBLIC_API_URL")
FRONTEND_ENV_CONTENT=$(replace_template "$FRONTEND_ENV_CONTENT" "BACKEND_INTERNAL_URL" "$BACKEND_INTERNAL_URL")

# Créer le répertoire frontend si nécessaire
FRONTEND_DIR=$(dirname "$FRONTEND_ENV_FILE")
mkdir -p "$FRONTEND_DIR"

# Écrire les fichiers
echo "$ROOT_ENV_CONTENT" > "$ENV_FILE"
echo "$FRONTEND_ENV_CONTENT" > "$FRONTEND_ENV_FILE"

echo ""
echo -e "${GREEN}✅ Fichiers .env générés avec succès!${NC}"
echo -e "   ${CYAN}- $ENV_FILE${NC}"
echo -e "   ${CYAN}- $FRONTEND_ENV_FILE${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
if [ "$ENVIRONMENT" = "PROD" ]; then
    echo -e "   ${NC}1. Vérifiez les URLs dans les fichiers générés"
    echo -e "   ${NC}2. Configurez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET si nécessaire"
    echo -e "   ${NC}3. Ajoutez l'URL de redirection dans Google Cloud Console:"
    echo -e "      ${CYAN}${FRONTEND_URL_VALUE}/api/auth/callback/google${NC}"
    echo -e "   ${NC}4. Redémarrez le backend pour appliquer les changements"
else
    echo -e "   ${NC}1. Vérifiez les secrets générés"
    echo -e "   ${NC}2. Configurez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET si nécessaire"
    echo -e "   ${NC}3. Redémarrez le backend et le frontend"
fi
echo ""




