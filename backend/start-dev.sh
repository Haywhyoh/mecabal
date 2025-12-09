#!/bin/bash

# Script to start all backend services for development
# Gateway runs in current terminal, other services in new terminals

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting MeCabal Backend Services...${NC}"
echo ""

# Function to start a service in a new terminal (Windows Git Bash)
start_service_in_terminal() {
    local service_name=$1
    local service_command=$2
    
    echo -e "${BLUE}Starting $service_name in new terminal...${NC}"
    
    # For Windows Git Bash, use start command to open new window
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows Git Bash
        start "MeCabal - $service_name" bash -c "cd '$SCRIPT_DIR' && yarn run $service_command; exec bash"
    else
        # Linux/Mac - use gnome-terminal, xterm, or iTerm2
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="MeCabal - $service_name" -- bash -c "cd '$SCRIPT_DIR' && yarn run $service_command; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -T "MeCabal - $service_name" -e bash -c "cd '$SCRIPT_DIR' && yarn run $service_command; exec bash" &
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR' && yarn run $service_command\""
        else
            echo "Warning: Could not open new terminal for $service_name"
        fi
    fi
    
    # Small delay to avoid overwhelming the system
    sleep 1
}

# Start Gateway in current terminal
echo -e "${GREEN}Starting API Gateway in current terminal...${NC}"
echo "Press Ctrl+C to stop the gateway"
echo ""

# Start all other services in new terminals
start_service_in_terminal "Auth Service" "start:auth"
start_service_in_terminal "User Service" "start:user"
start_service_in_terminal "Social Service" "start:social"
start_service_in_terminal "Messaging Service" "start:messaging"
start_service_in_terminal "Marketplace Service" "start:marketplace"
start_service_in_terminal "Location Service" "start:location"
start_service_in_terminal "Events Service" "start:events"
start_service_in_terminal "Business Service" "start:business"
start_service_in_terminal "Notification Service" "start:notification"

echo ""
echo -e "${GREEN}All services are starting!${NC}"
echo "Gateway is running in this terminal."
echo "Other services are running in separate terminal windows."
echo ""
echo "To stop all services, close their respective terminal windows."

# Start gateway in current terminal (this will block)
yarn run start:gateway

