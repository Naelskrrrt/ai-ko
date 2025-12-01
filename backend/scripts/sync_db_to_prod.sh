#!/bin/bash
# Script Bash pour synchroniser la base de données locale vers la production
# Usage: ./scripts/sync_db_to_prod.sh [--dry-run] [--update-existing]

set -e

DRY_RUN=""
UPDATE_EXISTING=""
LOCAL_DB_URL=""
PROD_DB_URL=""

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN="--dry-run"
            echo "Mode: DRY RUN (aucune modification ne sera effectuée)"
            shift
            ;;
        --update-existing)
            UPDATE_EXISTING="--update-existing"
            echo "Mode: UPDATE (les enregistrements existants seront mis à jour)"
            shift
            ;;
        --local-db-url)
            LOCAL_DB_URL="$1 $2"
            shift 2
            ;;
        --prod-db-url)
            PROD_DB_URL="$1 $2"
            shift 2
            ;;
        *)
            echo "Argument inconnu: $1"
            exit 1
            ;;
    esac
done

echo "========================================"
echo "Synchronisation DB Locale -> Production"
echo "========================================"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "backend" ]; then
    echo "Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Aller dans le répertoire backend
cd backend

# Activer l'environnement virtuel
if [ -d "venv" ]; then
    echo "Activation de l'environnement virtuel..."
    source venv/bin/activate
else
    echo "Erreur: venv non trouvé. Exécutez d'abord start-backend.sh"
    exit 1
fi

# Charger les variables d'environnement depuis .env
if [ -f "../.env" ]; then
    echo "Chargement des variables d'environnement..."
    set -a
    source ../.env
    set +a
fi

# Vérifier que PostgreSQL Docker est en cours d'exécution
if ! docker ps --filter "name=smart-system-db" --format "{{.Names}}" | grep -q "smart-system-db"; then
    echo "Avertissement: PostgreSQL Docker n'est pas en cours d'exécution"
    echo "Démarrez-le avec: docker-compose up -d postgres"
    echo ""
    read -p "Voulez-vous continuer quand même? (o/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        exit 1
    fi
fi

# Vérifier que DATABASE_URL_PROD est défini (si --prod-db-url n'est pas fourni)
if [ -z "$PROD_DB_URL" ] && [ -z "$DATABASE_URL_PROD" ]; then
    echo "Erreur: DATABASE_URL_PROD n'est pas défini"
    echo ""
    echo "Options:"
    echo "  1. Ajouter DATABASE_URL_PROD dans votre fichier .env"
    echo "  2. Utiliser --prod-db-url pour spécifier l'URL directement"
    echo ""
    echo "Exemple:"
    echo "  DATABASE_URL_PROD=postgresql://user:pass@host:5432/dbname"
    exit 1
fi

echo ""
echo "Exécution du script de synchronisation..."
echo ""

# Exécuter le script Python
python scripts/sync_db_to_prod.py $DRY_RUN $UPDATE_EXISTING $LOCAL_DB_URL $PROD_DB_URL

EXIT_CODE=$?

# Retourner au répertoire racine
cd ..

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✓ Synchronisation terminée avec succès!"
else
    echo ""
    echo "✗ Erreur lors de la synchronisation"
    exit $EXIT_CODE
fi

