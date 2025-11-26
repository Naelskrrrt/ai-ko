#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Démarrage backup AI-KO - $DATE"

# Créer répertoire de backup
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "📦 Backup PostgreSQL..."
docker-compose exec -T postgres pg_dump -U smart_user systeme_intelligent | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"
echo "✓ PostgreSQL sauvegardé: postgres_$DATE.sql.gz"

# Backup Redis (optionnel)
echo "📦 Backup Redis..."
docker-compose exec -T redis redis-cli --rdb - 2>/dev/null | gzip > "$BACKUP_DIR/redis_$DATE.rdb.gz"
echo "✓ Redis sauvegardé: redis_$DATE.rdb.gz"

# Backup uploads (si le volume existe)
if [ -d "volumes/backend_uploads" ]; then
    echo "📦 Backup uploads..."
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C volumes backend_uploads
    echo "✓ Uploads sauvegardés: uploads_$DATE.tar.gz"
fi

# Afficher la taille des backups
echo ""
echo "📊 Taille des backups:"
ls -lh "$BACKUP_DIR" | tail -n 3

echo ""
echo "✅ Backup terminé: $BACKUP_DIR"
echo ""
echo "🔄 Pour restaurer:"
echo "  PostgreSQL: gunzip < $BACKUP_DIR/postgres_$DATE.sql.gz | docker-compose exec -T postgres psql -U smart_user systeme_intelligent"
echo "  Redis: gunzip < $BACKUP_DIR/redis_$DATE.rdb.gz | docker-compose exec -T redis redis-cli --pipe"



