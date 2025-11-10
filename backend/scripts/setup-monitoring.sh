#!/bin/bash

# Setup Container Monitoring Script
# This creates a systemd service or cron job to monitor containers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MONITOR_SCRIPT="$SCRIPT_DIR/monitor-containers.sh"

# Make scripts executable
chmod +x "$SCRIPT_DIR/monitor-containers.sh"
chmod +x "$SCRIPT_DIR/check-containers.sh"
chmod +x "$SCRIPT_DIR/safe-deploy.sh"

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - Create systemd service
    echo "Setting up systemd service for container monitoring..."
    
    SERVICE_FILE="/etc/systemd/system/mecabal-monitor.service"
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=MeCabal Container Monitor
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=$MONITOR_SCRIPT monitor
RemainAfterExit=yes
User=root
WorkingDirectory=$PROJECT_DIR

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
Unit=mecabal-monitor.service

[Install]
WantedBy=multi-user.target
EOF

    # Create timer
    TIMER_FILE="/etc/systemd/system/mecabal-monitor.timer"
    sudo tee $TIMER_FILE > /dev/null <<EOF
[Unit]
Description=MeCabal Container Monitor Timer
Requires=mecabal-monitor.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
Unit=mecabal-monitor.service

[Install]
WantedBy=timers.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable mecabal-monitor.timer
    sudo systemctl start mecabal-monitor.timer
    
    echo "✓ Systemd timer created and enabled"
    echo "  Check status: sudo systemctl status mecabal-monitor.timer"
    echo "  View logs: sudo journalctl -u mecabal-monitor.service -f"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - Create launchd plist
    echo "Setting up launchd service for container monitoring..."
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.mecabal.monitor.plist"
    
    cat > $PLIST_FILE <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mecabal.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$MONITOR_SCRIPT</string>
        <string>monitor</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

    launchctl load $PLIST_FILE
    echo "✓ Launchd service created and loaded"
    
else
    # Fallback to cron
    echo "Setting up cron job for container monitoring..."
    
    CRON_JOB="*/5 * * * * $MONITOR_SCRIPT monitor >> $PROJECT_DIR/logs/monitor.log 2>&1"
    
    (crontab -l 2>/dev/null | grep -v "$MONITOR_SCRIPT"; echo "$CRON_JOB") | crontab -
    
    echo "✓ Cron job created (runs every 5 minutes)"
    echo "  View cron: crontab -l"
fi

echo ""
echo "=== Monitoring Setup Complete ==="
echo "The monitoring script will check containers every 5 minutes"
echo "and automatically restart any that have stopped."

