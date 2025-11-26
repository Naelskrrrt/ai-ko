#!/bin/bash

# Script d'initialisation de la base de données
# Usage: ./scripts/init_database.sh

set -e

echo "=========================================="
echo "🚀 INITIALISATION BASE DE DONNÉES"
echo "=========================================="

echo ""
echo "📦 Étape 1: Exécution des migrations..."
flask db upgrade

echo ""
echo "🌱 Étape 2: Enrichissement des données..."
python scripts/seed_niveaux_matieres.py

echo ""
echo "=========================================="
echo "✅ INITIALISATION TERMINÉE !"
echo "=========================================="
echo ""
echo "📊 Vous pouvez maintenant :"
echo "  - Accéder à Swagger UI: http://localhost:5000/api/docs/swagger/"
echo "  - Tester les endpoints: /api/niveaux, /api/matieres, etc."
echo ""
