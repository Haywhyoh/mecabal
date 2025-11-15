#!/bin/bash

# Script to disable automatic backups

set -e

echo "🛑 Disabling Automatic Backups"
echo "=============================="
echo ""

# 1. Disable cron jobs
echo "📅 Step 1: Disabling cron jobs..."
if crontab -l 2>/dev/null | grep -qi backup; then
    echo "   Found backup in user crontab, removing..."
    crontab -l 2>/dev/null | grep -v -i backup | crontab - 2>/dev/null || true
    echo "   ✓ User crontab cleaned"
else
    echo "   ✓ No backup jobs in user crontab"
fi

if sudo crontab -l 2>/dev/null | grep -qi backup; then
    echo "   Found backup in root crontab, removing..."
    sudo crontab -l 2>/dev/null | grep -v -i backup | sudo crontab - 2>/dev/null || true
    echo "   ✓ Root crontab cleaned"
else
    echo "   ✓ No backup jobs in root crontab"
fi

# 2. Disable systemd timers
echo ""
echo "⏰ Step 2: Disabling systemd timers..."
BACKUP_TIMERS=$(systemctl list-timers --all --no-pager 2>/dev/null | grep -i backup | awk '{print $1}' || true)
if [ -n "$BACKUP_TIMERS" ]; then
    echo "$BACKUP_TIMERS" | while read timer; do
        echo "   Stopping and disabling: $timer"
        sudo systemctl stop "$timer" 2>/dev/null || true
        sudo systemctl disable "$timer" 2>/dev/null || true
    done
    echo "   ✓ Backup timers disabled"
else
    echo "   ✓ No backup timers found"
fi

# 3. Rename backup scripts (safer than deleting)
echo ""
echo "📜 Step 3: Disabling backup scripts..."
BACKUP_SCRIPTS=$(find /opt/mecabal -name "*backup*.sh" -o -name "*backup*.py" 2>/dev/null || true)
if [ -n "$BACKUP_SCRIPTS" ]; then
    echo "$BACKUP_SCRIPTS" | while read script; do
        if [ -f "$script" ] && [[ ! "$script" =~ "cleanup-backup" ]]; then
            echo "   Disabling: $script"
            sudo mv "$script" "${script}.disabled" 2>/dev/null || true
        fi
    done
    echo "   ✓ Backup scripts disabled"
else
    echo "   ✓ No backup scripts found to disable"
fi

# 4. Create a backup rotation script to prevent future issues
echo ""
echo "📝 Step 4: Creating backup rotation script..."
cat > /tmp/backup-rotation.sh << 'EOF'
#!/bin/bash
# Backup rotation - keeps only last 3 backups
BACKUP_DIR="/opt/mecabal/backups"
KEEP_COUNT=3

# Remove old backups, keep only KEEP_COUNT most recent
ls -1t "$BACKUP_DIR"/mecabal_backup_*.tar.gz 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs rm -f 2>/dev/null

# Remove empty SQL files
find "$BACKUP_DIR" -name "database_*.sql" -size 0 -delete 2>/dev/null
EOF

echo "   ✓ Backup rotation script created at /tmp/backup-rotation.sh"
echo "   (You can add this to crontab if you want to keep backups but limit them)"

echo ""
echo "✅ Backup disabling complete!"
echo ""
echo "📋 Summary:"
echo "   - Cron jobs: Checked and cleaned"
echo "   - Systemd timers: Checked and disabled"
echo "   - Backup scripts: Disabled (renamed with .disabled)"
echo ""
echo "💡 To re-enable backups later:"
echo "   1. Restore from crontab backup if you made one"
echo "   2. Re-enable systemd timers: sudo systemctl enable <timer-name>"
echo "   3. Rename scripts back: mv <script>.disabled <script>"
echo ""
echo "⚠️  Remember to clean up existing backups:"
echo "   Run: ./scripts/cleanup-backups-aggressive.sh"

