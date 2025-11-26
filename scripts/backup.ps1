# scripts/backup.ps1
# Script de backup pour Windows PowerShell

$BACKUP_DIR = "./backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "💾 Démarrage backup AI-KO - $DATE" -ForegroundColor Cyan

# Créer répertoire de backup
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Backup PostgreSQL
Write-Host "📦 Backup PostgreSQL..." -ForegroundColor Yellow
docker-compose exec -T postgres pg_dump -U smart_user systeme_intelligent | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"
Write-Host "✓ PostgreSQL sauvegardé: postgres_$DATE.sql.gz" -ForegroundColor Green

# Backup Redis
Write-Host "📦 Backup Redis..." -ForegroundColor Yellow
try {
    docker-compose exec -T redis redis-cli --rdb - 2>$null | gzip > "$BACKUP_DIR/redis_$DATE.rdb.gz"
    Write-Host "✓ Redis sauvegardé: redis_$DATE.rdb.gz" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backup Redis échoué" -ForegroundColor Yellow
}

# Backup uploads
if (Test-Path "volumes/backend_uploads") {
    Write-Host "📦 Backup uploads..." -ForegroundColor Yellow
    Compress-Archive -Path "volumes/backend_uploads" -DestinationPath "$BACKUP_DIR/uploads_$DATE.zip" -Force
    Write-Host "✓ Uploads sauvegardés: uploads_$DATE.zip" -ForegroundColor Green
}

# Afficher la taille des backups
Write-Host "`n📊 Backups créés:" -ForegroundColor Cyan
Get-ChildItem $BACKUP_DIR | Where-Object { $_.Name -like "*$DATE*" } | Format-Table Name, Length, LastWriteTime -AutoSize

Write-Host "`n✅ Backup terminé: $BACKUP_DIR" -ForegroundColor Green
Write-Host "`n🔄 Pour restaurer:" -ForegroundColor Cyan
Write-Host "  .\scripts\restore.ps1 $DATE" -ForegroundColor White



