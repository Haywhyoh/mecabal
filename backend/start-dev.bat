@echo off
REM Script to start all backend services for development
REM Gateway runs in current terminal, other services in new terminals

cd /d "%~dp0"

echo Starting MeCabal Backend Services...
echo.

REM Start all services in new command prompt windows
start "MeCabal - Auth Service" cmd /k "cd /d %~dp0 && yarn run start:auth"
timeout /t 1 /nobreak >nul

start "MeCabal - User Service" cmd /k "cd /d %~dp0 && yarn run start:user"
timeout /t 1 /nobreak >nul

start "MeCabal - Social Service" cmd /k "cd /d %~dp0 && yarn run start:social"
timeout /t 1 /nobreak >nul

start "MeCabal - Messaging Service" cmd /k "cd /d %~dp0 && yarn run start:messaging"
timeout /t 1 /nobreak >nul

start "MeCabal - Marketplace Service" cmd /k "cd /d %~dp0 && yarn run start:marketplace"
timeout /t 1 /nobreak >nul

start "MeCabal - Location Service" cmd /k "cd /d %~dp0 && yarn run start:location"
timeout /t 1 /nobreak >nul

start "MeCabal - Events Service" cmd /k "cd /d %~dp0 && yarn run start:events"
timeout /t 1 /nobreak >nul

start "MeCabal - Business Service" cmd /k "cd /d %~dp0 && yarn run start:business"
timeout /t 1 /nobreak >nul

start "MeCabal - Notification Service" cmd /k "cd /d %~dp0 && yarn run start:notification"
timeout /t 1 /nobreak >nul

echo.
echo All services are starting!
echo Gateway will start in this terminal window.
echo Other services are running in separate terminal windows.
echo.
echo To stop all services, close their respective terminal windows.
echo.

REM Start gateway in current terminal (this will block)
yarn run start:gateway





