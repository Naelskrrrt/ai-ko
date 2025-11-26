#!/bin/bash
# scripts/logs.sh

SERVICE=${1:-all}

if [ "$SERVICE" = "all" ]; then
    echo "📋 Logs de tous les services (Ctrl+C pour quitter)"
    docker-compose logs -f
else
    echo "📋 Logs du service: $SERVICE (Ctrl+C pour quitter)"
    docker-compose logs -f $SERVICE
fi



