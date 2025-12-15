#!/bin/bash

# Script to fix port conflict on port 3000
# This script identifies and resolves what's using port 3000

set -e

echo "🔍 Checking what's using port 3000..."

# Method 1: Check using lsof
if command -v lsof &> /dev/null; then
    echo "Using lsof to check port 3000..."
    PROCESSES=$(sudo lsof -i :3000 2>/dev/null || true)
    if [ -n "$PROCESSES" ]; then
        echo "Found processes using port 3000:"
        echo "$PROCESSES"
        PIDS=$(echo "$PROCESSES" | awk 'NR>1 {print $2}' | sort -u)
        for PID in $PIDS; do
            if [ -n "$PID" ] && [ "$PID" != "PID" ]; then
                echo "⚠️  Process $PID is using port 3000"
                # Check if it's a Docker container
                if docker ps --format "{{.ID}}" | grep -q "$PID" 2>/dev/null; then
                    echo "   This appears to be a Docker container process"
                else
                    # Check process details
                    if ps -p "$PID" > /dev/null 2>&1; then
                        echo "   Process details:"
                        ps -p "$PID" -o pid,ppid,cmd
                        read -p "   Kill process $PID? (y/N): " -n 1 -r
                        echo
                        if [[ $REPLY =~ ^[Yy]$ ]]; then
                            echo "   Killing process $PID..."
                            sudo kill -9 "$PID" 2>/dev/null || true
                            echo "   ✓ Process $PID killed"
                        fi
                    fi
                fi
            fi
        done
    else
        echo "✓ No processes found using port 3000 (via lsof)"
    fi
fi

# Method 2: Check using netstat
if command -v netstat &> /dev/null; then
    echo ""
    echo "Using netstat to check port 3000..."
    NETSTAT_OUTPUT=$(sudo netstat -tulpn | grep :3000 || true)
    if [ -n "$NETSTAT_OUTPUT" ]; then
        echo "Found processes using port 3000:"
        echo "$NETSTAT_OUTPUT"
    else
        echo "✓ No processes found using port 3000 (via netstat)"
    fi
fi

# Method 3: Check for duplicate Docker containers
echo ""
echo "🔍 Checking for duplicate or stale Docker containers..."
STALE_CONTAINERS=$(docker ps -a --filter "name=mecabal" --filter "status=exited" --format "{{.ID}} {{.Names}} {{.Status}}" || true)
if [ -n "$STALE_CONTAINERS" ]; then
    echo "Found stale containers:"
    echo "$STALE_CONTAINERS"
    echo ""
    read -p "Remove stale containers? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker ps -a --filter "name=mecabal" --filter "status=exited" -q | xargs -r docker rm -f
        echo "✓ Stale containers removed"
    fi
fi

# Check for containers using port 3000
echo ""
echo "🔍 Checking for containers using port 3000..."
CONTAINERS_ON_3000=$(docker ps --format "{{.ID}} {{.Names}} {{.Ports}}" | grep ":3000" || true)
if [ -n "$CONTAINERS_ON_3000" ]; then
    echo "Found containers using port 3000:"
    echo "$CONTAINERS_ON_3000"
else
    echo "✓ No containers found using port 3000"
fi

# Final check
echo ""
echo "🔍 Final port check..."
if command -v lsof &> /dev/null; then
    FINAL_CHECK=$(sudo lsof -i :3000 2>/dev/null || true)
    if [ -z "$FINAL_CHECK" ]; then
        echo "✅ Port 3000 is now free!"
        echo ""
        echo "You can now restart the backend container:"
        echo "  docker-compose -f docker-compose.production.yml restart backend"
        echo "  OR"
        echo "  docker-compose -f docker-compose.production.yml down"
        echo "  docker-compose -f docker-compose.production.yml up -d"
    else
        echo "⚠️  Port 3000 is still in use:"
        echo "$FINAL_CHECK"
        echo ""
        echo "Please manually resolve the port conflict before restarting services."
    fi
else
    echo "⚠️  Cannot verify port status (lsof not available)"
    echo "Please manually check if port 3000 is free before restarting services."
fi

