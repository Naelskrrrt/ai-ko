#!/bin/bash

# Script pour exécuter les tests
# Usage: ./scripts/run_tests.sh [options]

set -e

echo "=========================================="
echo "🧪 EXÉCUTION DES TESTS AI-KO"
echo "=========================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo ""
    echo "Usage: ./scripts/run_tests.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  all        Exécuter tous les tests (par défaut)"
    echo "  api        Exécuter uniquement les tests API"
    echo "  unit       Exécuter uniquement les tests unitaires"
    echo "  cov        Exécuter les tests avec couverture détaillée"
    echo "  fast       Exécuter les tests rapides uniquement"
    echo "  verbose    Exécuter les tests en mode verbose"
    echo "  help       Afficher cette aide"
    echo ""
}

# Vérifier que pytest est installé
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}❌ pytest n'est pas installé${NC}"
    echo "Installer avec: pip install pytest pytest-cov pytest-env"
    exit 1
fi

# Par défaut, exécuter tous les tests
MODE=${1:-all}

case $MODE in
    all)
        echo -e "${GREEN}📋 Exécution de tous les tests...${NC}"
        pytest tests/
        ;;

    api)
        echo -e "${GREEN}🌐 Exécution des tests API...${NC}"
        pytest tests/api/ -m api
        ;;

    unit)
        echo -e "${GREEN}🔬 Exécution des tests unitaires...${NC}"
        pytest tests/ -m unit
        ;;

    cov)
        echo -e "${GREEN}📊 Exécution des tests avec couverture...${NC}"
        pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
        echo ""
        echo -e "${YELLOW}📈 Rapport de couverture généré dans: htmlcov/index.html${NC}"
        ;;

    fast)
        echo -e "${GREEN}⚡ Exécution des tests rapides...${NC}"
        pytest tests/ -m "not slow"
        ;;

    verbose)
        echo -e "${GREEN}📝 Exécution des tests en mode verbose...${NC}"
        pytest tests/ -vv -s
        ;;

    help|--help|-h)
        show_help
        exit 0
        ;;

    *)
        echo -e "${RED}❌ Option invalide: $MODE${NC}"
        show_help
        exit 1
        ;;
esac

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✅ TESTS RÉUSSIS !"
    echo -e "==========================================${NC}"
else
    echo ""
    echo -e "${RED}=========================================="
    echo "❌ TESTS ÉCHOUÉS"
    echo -e "==========================================${NC}"
    exit 1
fi
