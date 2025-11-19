#!/bin/bash

# Create a shared Docker network for MeCabal services
# This network persists independently of any docker-compose file

echo "Creating shared MeCabal network..."

# Check if network already exists
if docker network inspect mecabal_network >/dev/null 2>&1; then
  echo "✓ Network 'mecabal_network' already exists"
  docker network inspect mecabal_network --format '{{.Name}}: {{.Driver}}, Created: {{.Created}}'
else
  # Create the network
  docker network create \
    --driver bridge \
    --subnet 172.28.0.0/16 \
    --gateway 172.28.0.1 \
    mecabal_network

  echo "✓ Network 'mecabal_network' created successfully"
fi

echo ""
echo "This network will persist independently of docker-compose files."
echo "Both backend and web-app can be restarted without affecting each other."
echo ""
echo "To remove this network (when all containers are stopped):"
echo "  docker network rm mecabal_network"
