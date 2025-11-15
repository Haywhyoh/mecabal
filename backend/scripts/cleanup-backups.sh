#!/bin/bash

# Script to clean up old backup files in /opt/mecabal/backups
# Keeps the most recent backups and removes older ones

set -e

BACKUP_DIR="/opt/mecabal/backups"
KEEP_DAYS=7  # Keep backups from the last 7 days
KEEP_COUNT=3  # Always keep at least 3 most recent backups

echo "🧹 Cleaning up old backups in $BACKUP_DIR"
echo "=========================================="
echo ""

# Check current space
echo "📊 Current backup directory size:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "Directory not found"

echo ""
echo "📁 Current backup files:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print $5, $9}' | sort -k2

echo ""
echo "🗑️  Removing backups older than $KEEP_DAYS days..."

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "mecabal_backup_*.tar.gz" -type f -mtime +$KEEP_DAYS -exec ls -lh {} \; | awk '{print "   Will delete: " $5 " - " $9}'
find "$BACKUP_DIR" -name "mecabal_backup_*.tar.gz" -type f -mtime +$KEEP_DAYS -delete

echo ""
echo "🗑️  Keeping only the $KEEP_COUNT most recent backups..."

# Keep only the KEEP_COUNT most recent backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/mecabal_backup_*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$KEEP_COUNT" ]; then
    echo "   Found $BACKUP_COUNT backups, keeping only $KEEP_COUNT most recent"
    ls -1t "$BACKUP_DIR"/mecabal_backup_*.tar.gz 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | while read backup; do
        size=$(du -h "$backup" | cut -f1)
        echo "   Will delete: $size - $backup"
        rm -f "$backup"
    done
else
    echo "   Only $BACKUP_COUNT backups found, all will be kept"
fi

# Also clean up empty SQL files (they show as 0 bytes)
echo ""
echo "🗑️  Removing empty database backup files..."
find "$BACKUP_DIR" -name "database_*.sql" -type f -size 0 -delete

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Backup directory size after cleanup:"
du -sh "$BACKUP_DIR" 2>/dev/null

echo ""
echo "📁 Remaining backup files:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print $5, $9}' | sort -k2 || echo "No backup files remaining"

echo ""
echo "💡 To prevent this in the future, consider:"
echo "   1. Setting up backup rotation in your backup script"
echo "   2. Compressing backups more efficiently"
echo "   3. Storing backups off-server (S3, etc.)"
echo "   4. Running this script as a cron job"

