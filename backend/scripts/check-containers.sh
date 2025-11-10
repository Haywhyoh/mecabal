#!/bin/bash

# Quick Container Status Check Script

COMPOSE_FILE="docker-compose.production.yml"

if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "Docker Compose not found!"
    exit 1
fi

echo "=== Container Status ==="
$COMPOSE_CMD -f $COMPOSE_FILE ps

echo ""
echo "=== Stopped Containers ==="
docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}" | grep mecabal || echo "No stopped containers"

echo ""
echo "=== Volume Status ==="
docker volume ls | grep mecabal || echo "No volumes found"

echo ""
echo "=== Recent Container Logs (last 20 lines) ==="
echo "PostgreSQL:"
docker logs --tail 20 mecabal-postgres 2>&1 | tail -5 || echo "No logs"
echo ""
echo "Redis:"
docker logs --tail 20 mecabal-redis 2>&1 | tail -5 || echo "No logs"

