#!/bin/bash

# Script to find and disable automatic backups

echo "🔍 Finding Backup Process"
echo "========================="
echo ""

# 1. Check cron jobs
echo "📅 Checking cron jobs:"
echo "----------------------"
crontab -l 2>/dev/null | grep -i backup || echo "   No backup cron jobs found in current user crontab"
echo ""

# Check root crontab
echo "📅 Checking root cron jobs:"
echo "--------------------------"
sudo crontab -l 2>/dev/null | grep -i backup || echo "   No backup cron jobs found in root crontab"
echo ""

# Check system-wide cron
echo "📅 Checking system-wide cron jobs:"
echo "----------------------------------"
sudo grep -r "backup\|mecabal_backup" /etc/cron.d/ /etc/cron.daily/ /etc/cron.weekly/ /etc/cron.monthly/ 2>/dev/null | grep -v "^#" || echo "   No backup jobs in system cron directories"
echo ""

# 2. Check systemd timers
echo "⏰ Checking systemd timers:"
echo "--------------------------"
systemctl list-timers --all 2>/dev/null | grep -i backup || echo "   No backup timers found"
echo ""

# 3. Check for backup scripts in common locations
echo "📜 Looking for backup scripts:"
echo "------------------------------"
find /opt/mecabal -name "*backup*.sh" -o -name "*backup*.py" 2>/dev/null | head -10
find /root -name "*backup*.sh" -o -name "*backup*.py" 2>/dev/null | head -10
find /home -name "*backup*.sh" -o -name "*backup*.py" 2>/dev/null | head -10
echo ""

# 4. Check running processes
echo "🔄 Checking for running backup processes:"
echo "----------------------------------------"
ps aux | grep -i backup | grep -v grep || echo "   No backup processes currently running"
echo ""

# 5. Check for backup scripts in /opt/mecabal
echo "📁 Checking /opt/mecabal for backup scripts:"
echo "--------------------------------------------"
ls -lah /opt/mecabal/*.sh /opt/mecabal/scripts/*.sh 2>/dev/null | grep -i backup || echo "   No backup scripts found in /opt/mecabal"
echo ""

echo "💡 To disable backups:"
echo "   1. If found in crontab: crontab -e (or sudo crontab -e for root)"
echo "   2. Comment out or delete the backup line"
echo "   3. If systemd timer: sudo systemctl stop <timer-name> && sudo systemctl disable <timer-name>"
echo "   4. If script in /opt/mecabal: rename or delete the script"

