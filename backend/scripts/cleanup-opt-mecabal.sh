#!/bin/bash

# Script to investigate and clean up /opt/mecabal (228GB!)

set -e

echo "🔍 Investigating /opt/mecabal (228GB usage)"
echo "============================================"
echo ""

# Check what's in /opt/mecabal
echo "📁 Top-level directories in /opt/mecabal:"
sudo du -h --max-depth=1 /opt/mecabal 2>/dev/null | sort -rh | head -20

echo ""
echo "📁 Detailed breakdown:"
echo ""

# Check for common space hogs
echo "🔍 Checking for common space hogs..."

# 1. Check for node_modules
echo "📦 node_modules directories:"
find /opt/mecabal -type d -name "node_modules" -exec du -sh {} \; 2>/dev/null | sort -rh | head -10

# 2. Check for .next build directories (Next.js)
echo ""
echo "📦 .next build directories:"
find /opt/mecabal -type d -name ".next" -exec du -sh {} \; 2>/dev/null | sort -rh | head -10

# 3. Check for dist directories
echo ""
echo "📦 dist directories:"
find /opt/mecabal -type d -name "dist" -exec du -sh {} \; 2>/dev/null | sort -rh | head -10

# 4. Check for large log files
echo ""
echo "📝 Large log files (>100MB):"
find /opt/mecabal -type f -name "*.log" -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | head -20

# 5. Check for backup files
echo ""
echo "💾 Backup files (.tar.gz, .sql, .backup):"
find /opt/mecabal -type f \( -name "*.tar.gz" -o -name "*.sql" -o -name "*.backup" -o -name "*.dump" \) -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | head -20

# 6. Check for Docker-related files
echo ""
echo "🐳 Docker-related files:"
find /opt/mecabal -type f -name "Dockerfile*" -o -name "docker-compose*.yml" 2>/dev/null | head -5
du -sh /opt/mecabal/*/docker 2>/dev/null | sort -rh | head -10

# 7. Check for large files in general
echo ""
echo "📄 Largest files (>1GB):"
find /opt/mecabal -type f -size +1G -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | head -20

echo ""
echo "💡 Next steps:"
echo "   1. Review the output above"
echo "   2. Identify what can be safely deleted"
echo "   3. Run cleanup commands for specific directories"

