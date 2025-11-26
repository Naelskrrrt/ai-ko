#!/bin/bash
# Script shell pour faciliter l'exécution du vérificateur MVP

set -e

# Couleurs pour l'output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Vérification de l'état du MVP...${NC}\n"

# Vérifier que Python est installé
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}❌ Python 3 n'est pas installé${NC}"
    exit 1
fi

# Vérifier que le script existe
if [ ! -f "check_mvp_progress.py" ]; then
    echo -e "${YELLOW}❌ check_mvp_progress.py introuvable${NC}"
    exit 1
fi

# Créer le dossier reports s'il n'existe pas
mkdir -p reports

# Générer les rapports
echo -e "${BLUE}📊 Génération des rapports...${NC}\n"

# Rapport Markdown
python3 check_mvp_progress.py --format markdown --output reports/mvp_progress.md
echo -e "${GREEN}✅ Rapport Markdown généré: reports/mvp_progress.md${NC}"

# Rapport HTML
python3 check_mvp_progress.py --format html --output reports/mvp_progress.html
echo -e "${GREEN}✅ Rapport HTML généré: reports/mvp_progress.html${NC}"

# Rapport JSON
python3 check_mvp_progress.py --format json --output reports/mvp_progress.json
echo -e "${GREEN}✅ Rapport JSON généré: reports/mvp_progress.json${NC}"

echo -e "\n${BLUE}📈 Résumé:${NC}"
python3 check_mvp_progress.py --format markdown | head -n 10

echo -e "\n${GREEN}✨ Tous les rapports ont été générés dans le dossier reports/${NC}"
echo -e "${BLUE}💡 Ouvrez reports/mvp_progress.html dans votre navigateur pour voir le rapport visuel${NC}"



