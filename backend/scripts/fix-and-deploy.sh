#!/bin/bash

# Quick Fix and Deploy Script
# Resolves git conflicts and deploys the latest code

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Quick Fix and Deploy${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗${NC} Not in backend directory!"
    echo "Please cd to ~/mecabal/backend first"
    exit 1
fi

echo -e "${YELLOW}This script will:${NC}"
echo "  1. Backup any modified files"
echo "  2. Discard local changes"
echo "  3. Pull latest code from git"
echo "  4. Deploy the updated backend"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

# Create backup directory
BACKUP_DIR="./git-conflict-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo -e "${BLUE}Step 1: Backing up modified files...${NC}"

# Get list of modified files
MODIFIED_FILES=$(git diff --name-only 2>/dev/null || echo "")

if [ -n "$MODIFIED_FILES" ]; then
    echo "Modified files found:"
    echo "$MODIFIED_FILES"

    # Backup each modified file
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            mkdir -p "$BACKUP_DIR/$(dirname "$file")"
            cp "$file" "$BACKUP_DIR/$file"
            echo -e "${GREEN}✓${NC} Backed up: $file"
        fi
    done <<< "$MODIFIED_FILES"

    echo ""
    echo -e "${GREEN}✓${NC} Backups saved to: $BACKUP_DIR"
else
    echo "No modified files to backup"
fi

echo ""
echo -e "${BLUE}Step 2: Discarding local changes...${NC}"

# Reset all changes
git reset --hard HEAD
echo -e "${GREEN}✓${NC} Local changes discarded"

echo ""
echo -e "${BLUE}Step 3: Pulling latest code...${NC}"

# Pull latest code
if git pull origin main; then
    echo -e "${GREEN}✓${NC} Code updated successfully"
    NEW_COMMIT=$(git rev-parse --short HEAD)
    echo "Current commit: $NEW_COMMIT"
else
    echo -e "${RED}✗${NC} Git pull failed!"
    echo "Please check your internet connection and try again"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 4: Preparing deployment...${NC}"

# Make deploy script executable
chmod +x scripts/deploy.sh
echo -e "${GREEN}✓${NC} Deploy script is executable"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Ready to Deploy!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Your code is now up to date."
echo "Backup of old files: $BACKUP_DIR"
echo ""

# Ask if user wants to deploy now
read -p "Deploy now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${BLUE}Starting deployment...${NC}"
    echo ""

    # Run deployment with skip-pull since we just pulled
    ./scripts/deploy.sh --skip-pull
else
    echo ""
    echo -e "${YELLOW}Skipping deployment${NC}"
    echo "To deploy later, run:"
    echo "  cd ~/mecabal/backend"
    echo "  ./scripts/deploy.sh --skip-pull"
fi
