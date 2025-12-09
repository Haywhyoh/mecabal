# Script to start all backend services for development
# Gateway runs in current terminal, other services in new terminals

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting MeCabal Backend Services..." -ForegroundColor Green
Write-Host ""

# Function to start a service in a new terminal
function Start-ServiceInTerminal {
    param(
        [string]$ServiceName,
        [string]$ServiceCommand
    )
    
    Write-Host "Starting $ServiceName in new terminal..." -ForegroundColor Blue
    
    # Start new PowerShell window for each service
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$scriptPath'; Write-Host 'Starting $ServiceName...' -ForegroundColor Green; yarn run $ServiceCommand"
    ) -WindowStyle Normal
    
    Start-Sleep -Seconds 1
}

# Start all services in new terminals
Start-ServiceInTerminal "Auth Service" "start:auth"
Start-ServiceInTerminal "User Service" "start:user"
Start-ServiceInTerminal "Social Service" "start:social"
Start-ServiceInTerminal "Messaging Service" "start:messaging"
Start-ServiceInTerminal "Marketplace Service" "start:marketplace"
Start-ServiceInTerminal "Location Service" "start:location"
Start-ServiceInTerminal "Events Service" "start:events"
Start-ServiceInTerminal "Business Service" "start:business"
Start-ServiceInTerminal "Notification Service" "start:notification"

Write-Host ""
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "Gateway will start in this terminal window."
Write-Host "Other services are running in separate terminal windows."
Write-Host ""
Write-Host "To stop all services, close their respective terminal windows."
Write-Host ""

# Start gateway in current terminal (this will block)
Write-Host "Starting API Gateway..." -ForegroundColor Green
yarn run start:gateway

