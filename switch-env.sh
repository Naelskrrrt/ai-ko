#!/bin/bash

# ===============================================
# Script de basculement d'environnement - Linux/Mac
# ===============================================
# Usage: ./switch-env.sh dev   # Basculer vers dev
#        ./switch-env.sh prod  # Basculer vers prod
# ===============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages colorés
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Vérifier les arguments
if [ $# -ne 1 ]; then
    print_color $RED "Erreur: Veuillez spécifier l'environnement (dev ou prod)"
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

ENVIRONMENT=$1

# Valider l'environnement
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    print_color $RED "Erreur: Environnement invalide. Utilisez 'dev' ou 'prod'"
    exit 1
fi

# Banner
print_color $CYAN "\n============================================"
print_color $CYAN "   AI-KO Environment Switcher (Linux/Mac)"
print_color $CYAN "============================================\n"

# Vérifier que le fichier d'environnement existe
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    print_color $RED "Erreur: Le fichier $ENV_FILE n'existe pas!"
    exit 1
fi

# Backup de l'ancien .env si existe
if [ -f ".env" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE=".env.backup.$TIMESTAMP"
    print_color $YELLOW "Sauvegarde de l'ancien .env vers $BACKUP_FILE..."
    cp .env "$BACKUP_FILE"
fi

# Copier le nouveau fichier d'environnement
print_color $GREEN "Basculement vers l'environnement: $ENVIRONMENT"
cp "$ENV_FILE" .env

# Afficher les informations de l'environnement
echo ""
print_color $GREEN "Environnement actif: $ENVIRONMENT"

# Lire quelques variables importantes du fichier .env
FLASK_ENV=$(grep "^FLASK_ENV=" .env | cut -d'=' -f2)
API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env | cut -d'=' -f2)
NODE_ENV=$(grep "^NODE_ENV=" .env | cut -d'=' -f2)

print_color $CYAN "\nConfiguration:"
echo "  - FLASK_ENV: $FLASK_ENV"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - API_URL: $API_URL"

# Instructions suivantes
print_color $YELLOW "\nProchaines étapes:"
if [ "$ENVIRONMENT" = "dev" ]; then
    echo "  1. Démarrer Docker: docker-compose up -d"
    echo "  2. Voir les logs: docker-compose logs -f"
    echo "  3. Arrêter: docker-compose down"
else
    echo "  1. Backend: cd backend && railway up"
    echo "  2. Frontend: cd frontend && railway up"
    echo "  3. Vérifier les variables dans Railway UI"
fi

print_color $CYAN "\n============================================"
print_color $GREEN "Basculement terminé avec succès!"
print_color $CYAN "============================================\n"
