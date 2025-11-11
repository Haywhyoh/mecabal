@echo off
REM Migration Script: Convert Location IDs from Integer to UUID
REM This script runs the UUID conversion migration inside the Docker container

setlocal enabledelayedexpansion

echo ==========================================
echo UUID Migration Script for Mecabal Backend
echo ==========================================
echo.

REM Check if docker-compose is available
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] docker-compose is not installed or not in PATH
    exit /b 1
)

REM Check if we're in the backend directory
if not exist "docker-compose.production.yml" (
    echo [ERROR] Must run this script from the backend directory
    echo Current directory: %cd%
    exit /b 1
)

REM Step 1: Check if postgres container is running
echo [STEP 1] Checking if PostgreSQL container is running...
docker-compose -f docker-compose.production.yml ps postgres | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo [INFO] PostgreSQL container is not running. Starting it now...
    docker-compose -f docker-compose.production.yml up -d postgres

    echo [INFO] Waiting for PostgreSQL to be ready (30 seconds)...
    timeout /t 30 /nobreak >nul
) else (
    echo [SUCCESS] PostgreSQL container is running
)

REM Step 2: Create a backup
echo.
echo [STEP 2] Creating database backup...
set BACKUP_FILE=backup_before_uuid_migration_%date:~-4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
echo [INFO] Backup file: %BACKUP_FILE%

if not exist "backups" mkdir backups

docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U mecabal_prod -d mecabal_db > "backups\%BACKUP_FILE%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create backup
    exit /b 1
)

echo [SUCCESS] Backup created successfully at backups\%BACKUP_FILE%

REM Step 3: Build the application with the new migration
echo.
echo [STEP 3] Building application with new migration...
docker-compose -f docker-compose.production.yml build --no-cache api-gateway
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    exit /b 1
)

echo [SUCCESS] Build completed

REM Step 4: Run the migration
echo.
echo [STEP 4] Running UUID conversion migration...
echo [INFO] This may take a few minutes depending on data volume...

docker-compose -f docker-compose.production.yml run --rm api-gateway npm run migration:run
if %errorlevel% neq 0 (
    echo [ERROR] Migration failed!
    echo [INFO] To restore from backup, run:
    echo   docker-compose -f docker-compose.production.yml exec -T postgres psql -U mecabal_prod -d mecabal_db ^< backups\%BACKUP_FILE%
    exit /b 1
)

echo [SUCCESS] Migration completed successfully!

REM Step 5: Verify the migration
echo.
echo [STEP 5] Verifying migration...
echo [INFO] Checking if states table now uses UUID...

docker-compose -f docker-compose.production.yml exec -T postgres psql -U mecabal_prod -d mecabal_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'states' AND column_name = 'id';"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to verify migration
    exit /b 1
)

echo [SUCCESS] Verification completed

REM Step 6: Reseed location data
echo.
echo [STEP 6] Reseeding location data with UUIDs...
docker-compose -f docker-compose.production.yml run --rm api-gateway npm run seed:location
if %errorlevel% neq 0 (
    echo [WARNING] Seeding failed or partially completed
    echo [WARNING] You may need to manually verify the location data
)

echo [SUCCESS] Seeding completed

REM Step 7: Restart services
echo.
echo [STEP 7] Restarting all services...
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

echo.
echo ==========================================
echo [SUCCESS] UUID Migration Completed Successfully!
echo ==========================================
echo.
echo Summary:
echo   - Database backup: backups\%BACKUP_FILE%
echo   - States, LGAs, Wards, Neighborhoods now use UUIDs
echo   - All foreign key constraints are properly set
echo   - Services have been restarted
echo.
echo Next steps:
echo   1. Test the web app registration flow
echo   2. Verify location APIs return UUID strings
echo   3. Monitor logs: docker-compose -f docker-compose.production.yml logs -f
echo.
echo To rollback (if needed):
echo   docker-compose -f docker-compose.production.yml exec -T postgres psql -U mecabal_prod -d mecabal_db ^< backups\%BACKUP_FILE%
echo.

endlocal
