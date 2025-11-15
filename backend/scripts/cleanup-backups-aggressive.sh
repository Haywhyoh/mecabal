#!/bin/bash

# Aggressive backup cleanup - keeps only the 2 most recent backups
# Use this if you need to free up space immediately

set -e

BACKUP_DIR="/opt/mecabal/backups"
KEEP_COUNT=2  # Keep only 2 most recent backups

echo "🚨 AGGRESSIVE BACKUP CLEANUP"
echo "============================="
echo ""
echo "⚠️  WARNING: This will keep only the $KEEP_COUNT most recent backups!"
echo ""

# Check current space
echo "📊 Current backup directory size:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "Directory not found"

echo ""
echo "📁 Current backup files:"
ls -lht "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print $5, $9}' || echo "No backup files found"

echo ""
read -p "Continue with aggressive cleanup? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo ""
echo "🗑️  Keeping only the $KEEP_COUNT most recent backups..."

# Get list of backups sorted by modification time (newest first)
BACKUP_FILES=$(ls -1t "$BACKUP_DIR"/mecabal_backup_*.tar.gz 2>/dev/null)

if [ -z "$BACKUP_FILES" ]; then
    echo "   No backup files found"
    exit 0
fi

BACKUP_COUNT=$(echo "$BACKUP_FILES" | wc -l)
echo "   Found $BACKUP_COUNT backup files"

# Keep the KEEP_COUNT most recent, delete the rest
KEEP_FILES=$(echo "$BACKUP_FILES" | head -n $KEEP_COUNT)
DELETE_FILES=$(echo "$BACKUP_FILES" | tail -n +$((KEEP_COUNT + 1)))

echo ""
echo "✅ Keeping these backups:"
echo "$KEEP_FILES" | while read backup; do
    size=$(du -h "$backup" | cut -f1)
    echo "   ✓ $size - $(basename $backup)"
done

echo ""
echo "🗑️  Deleting these backups:"
TOTAL_DELETED=0
echo "$DELETE_FILES" | while read backup; do
    if [ -n "$backup" ] && [ -f "$backup" ]; then
        size=$(du -h "$backup" | cut -f1)
        echo "   ✗ $size - $(basename $backup)"
        rm -f "$backup"
    fi
done

# Clean up empty SQL files
echo ""
echo "🗑️  Removing empty database backup files..."
find "$BACKUP_DIR" -name "database_*.sql" -type f -size 0 -delete

echo ""
echo "✅ Aggressive cleanup complete!"
echo ""
echo "📊 Backup directory size after cleanup:"
du -sh "$BACKUP_DIR" 2>/dev/null

echo ""
echo "📁 Remaining backup files:"
ls -lht "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print $5, $9}' || echo "No backup files remaining"

