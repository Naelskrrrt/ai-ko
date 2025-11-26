#!/bin/bash
# scripts/restore.sh

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_date>"
    echo "Example: $0 20250121_143000"
    echo ""
    echo "Backups disponibles:"
    ls -1 backups/ | grep postgres | sed 's/postgres_/  - /' | sed 's/.sql.gz//'
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="./backups"

echo "🔄 Restauration AI-KO - $BACKUP_DATE"

# Vérifier que les backups existent
if [ ! -f "$BACKUP_DIR/postgres_$BACKUP_DATE.sql.gz" ]; then
    echo "❌ Backup PostgreSQL introuvable: postgres_$BACKUP_DATE.sql.gz"
    exit 1
fi

# Confirmation
read -p "⚠️  Cette opération va écraser les données actuelles. Continuer? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restauration annulée"
    exit 1
fi

# Restauration PostgreSQL
echo "📥 Restauration PostgreSQL..."
gunzip < "$BACKUP_DIR/postgres_$BACKUP_DATE.sql.gz" | docker-compose exec -T postgres psql -U smart_user systeme_intelligent
echo "✓ PostgreSQL restauré"

# Restauration Redis (si existe)
if [ -f "$BACKUP_DIR/redis_$BACKUP_DATE.rdb.gz" ]; then
    echo "📥 Restauration Redis..."
    docker-compose stop redis
    gunzip < "$BACKUP_DIR/redis_$BACKUP_DATE.rdb.gz" > /tmp/dump.rdb
    docker-compose start redis
    echo "✓ Redis restauré"
fi

# Restauration uploads (si existe)
if [ -f "$BACKUP_DIR/uploads_$BACKUP_DATE.tar.gz" ]; then
    echo "📥 Restauration uploads..."
    mkdir -p volumes
    tar -xzf "$BACKUP_DIR/uploads_$BACKUP_DATE.tar.gz" -C volumes
    echo "✓ Uploads restaurés"
fi

echo ""
echo "✅ Restauration terminée!"



