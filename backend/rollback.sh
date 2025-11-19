#!/bin/bash

# Rollback Script: Restore previous Docker configuration

set -e

echo "========================================="
echo "MeCabal Backend Rollback"
echo "========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

export COMPOSE_HTTP_TIMEOUT=300

if [ ! -f docker-compose.production.yml.old ]; then
  echo -e "${RED}✗ No backup found (docker-compose.production.yml.old)${NC}"
  echo ""
  echo "Available backups:"
  ls -lah backup_*/docker-compose.production.yml.backup 2>/dev/null || echo "No backups found"
  exit 1
fi

echo -e "${YELLOW}Step 1: Stopping optimized containers...${NC}"
docker-compose -f docker-compose.production.yml down --timeout 60 || docker stop $(docker ps -aq)
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

echo -e "${YELLOW}Step 2: Restoring old configuration...${NC}"
mv docker-compose.production.yml docker-compose.production.yml.optimized
mv docker-compose.production.yml.old docker-compose.production.yml
echo -e "${GREEN}✓ Configuration restored${NC}"
echo ""

echo -e "${YELLOW}Step 3: Starting services with old configuration...${NC}"
docker-compose -f docker-compose.production.yml up -d
echo ""

echo -e "${YELLOW}Step 4: Waiting for services (60s)...${NC}"
sleep 60
echo ""

echo -e "${YELLOW}Step 5: Checking health...${NC}"
docker-compose -f docker-compose.production.yml ps
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Rollback completed${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "You are now running the old 17-container architecture"
echo ""
