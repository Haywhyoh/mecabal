# PostGIS Local Setup Guide (Windows - No Docker)

## Overview

This guide will help you set up PostgreSQL with PostGIS extension locally on Windows without using Docker.

---

## Prerequisites

- Windows 10/11
- Administrator access
- ~500MB free disk space

---

## Step 1: Download PostgreSQL with PostGIS

### Option A: PostgreSQL Installer with PostGIS Bundle (Recommended)

1. **Download PostgreSQL Installer**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the latest PostgreSQL installer (v15 or v16 recommended)
   - Or direct link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the welcome screen

3. **Select Components**
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (GUI tool)
   - ✅ Stack Builder (required for PostGIS)
   - ✅ Command Line Tools
   - Click "Next"

4. **Set Installation Directory**
   - Default: `C:\Program Files\PostgreSQL\15\`
   - Click "Next"

5. **Set Data Directory**
   - Default: `C:\Program Files\PostgreSQL\15\data\`
   - Click "Next"

6. **Set Password**
   - Choose a strong password for the `postgres` superuser
   - **IMPORTANT:** Remember this password!
   - Example: `MeCabal_postgres_2025`
   - Click "Next"

7. **Set Port**
   - Default: `5432`
   - Keep default unless you have another PostgreSQL instance
   - Click "Next"

8. **Set Locale**
   - Default: `[Default locale]`
   - Click "Next"

9. **Review and Install**
   - Click "Next" to start installation
   - Wait for installation to complete (5-10 minutes)

10. **Launch Stack Builder**
    - ✅ Check "Launch Stack Builder at exit"
    - Click "Finish"

### Option B: Direct PostGIS Download (Alternative)

If Stack Builder doesn't work, download PostGIS directly:
- Visit: https://postgis.net/windows_downloads/
- Download PostGIS bundle for your PostgreSQL version
- Run the PostGIS installer after PostgreSQL is installed

---

## Step 2: Install PostGIS via Stack Builder

1. **Select Server**
   - Stack Builder will launch automatically
   - Select: `PostgreSQL 15 (x64) on port 5432`
   - Click "Next"

2. **Select PostGIS**
   - Expand "Spatial Extensions"
   - ✅ Check "PostGIS 3.x Bundle for PostgreSQL 15 (x64)"
   - Click "Next"

3. **Select Download Directory**
   - Choose a temporary folder
   - Click "Next"

4. **Download**
   - Wait for download to complete
   - Click "Next"

5. **Install PostGIS**
   - Click "Next" to start PostGIS installation
   - Accept license agreements
   - Keep default settings
   - Enter the `postgres` password when prompted
   - Wait for installation to complete

6. **Finish**
   - Click "Finish"
   - PostGIS is now installed!

---

## Step 3: Create MeCabal Database

### Using pgAdmin (GUI Method)

1. **Open pgAdmin 4**
   - Start Menu → pgAdmin 4
   - Enter your master password (if prompted)

2. **Connect to Server**
   - Expand "Servers" in left sidebar
   - Click on "PostgreSQL 15"
   - Enter the `postgres` password you set during installation

3. **Create Database**
   - Right-click "Databases"
   - Select "Create" → "Database..."
   - Database name: `MeCabal_dev`
   - Owner: `postgres`
   - Click "Save"

4. **Enable PostGIS Extension**
   - Expand "Databases" → "MeCabal_dev"
   - Right-click "MeCabal_dev"
   - Select "Query Tool"
   - Paste and execute:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ```
   - Click "Execute" (F5) or the play button

5. **Verify PostGIS**
   - In the same Query Tool, run:
   ```sql
   SELECT PostGIS_Version();
   ```
   - You should see PostGIS version information

### Using Command Line (psql Method)

1. **Open Command Prompt as Administrator**
   - Press `Win + X`
   - Select "Windows Terminal (Admin)" or "Command Prompt (Admin)"

2. **Navigate to PostgreSQL bin directory**
   ```cmd
   cd "C:\Program Files\PostgreSQL\15\bin"
   ```

3. **Connect to PostgreSQL**
   ```cmd
   psql -U postgres
   ```
   - Enter your `postgres` password when prompted

4. **Create Database**
   ```sql
   CREATE DATABASE MeCabal_dev;
   ```

5. **Connect to Database**
   ```sql
   \c MeCabal_dev
   ```

6. **Enable Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ```

7. **Verify PostGIS**
   ```sql
   SELECT PostGIS_Version();
   SELECT * FROM pg_extension;
   ```

8. **Exit psql**
   ```sql
   \q
   ```

---

## Step 4: Create MeCabal Database User

### Using pgAdmin

1. **Create Role**
   - Expand "PostgreSQL 15"
   - Right-click "Login/Group Roles"
   - Select "Create" → "Login/Group Role..."

2. **Set Name**
   - General tab
   - Name: `MeCabal_user`

3. **Set Password**
   - Definition tab
   - Password: `MeCabal_password`
   - Password expiration: Leave blank

4. **Set Privileges**
   - Privileges tab
   - ✅ Can login?
   - ✅ Create databases?
   - ✅ Create roles?
   - Click "Save"

5. **Grant Database Permissions**
   - Right-click "MeCabal_dev" database
   - Select "Query Tool"
   - Run:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE MeCabal_dev TO MeCabal_user;
   GRANT ALL PRIVILEGES ON SCHEMA public TO MeCabal_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO MeCabal_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO MeCabal_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO MeCabal_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO MeCabal_user;
   ```

### Using Command Line

```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres

-- Create user
CREATE USER MeCabal_user WITH PASSWORD 'MeCabal_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE MeCabal_dev TO MeCabal_user;

-- Connect to MeCabal_dev
\c MeCabal_dev

-- Grant schema permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO MeCabal_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO MeCabal_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO MeCabal_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO MeCabal_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO MeCabal_user;

\q
```

---

## Step 5: Run Initialization Script

1. **Locate the init-db.sql script**
   - Path: `backend\scripts\init-db.sql`

2. **Run the script using psql**
   ```cmd
   cd "C:\Program Files\PostgreSQL\15\bin"
   psql -U postgres -d MeCabal_dev -f "C:\Users\USER\Documents\Adedayo\mecabal\backend\scripts\init-db.sql"
   ```

   Or if you're in your project directory:
   ```cmd
   cd "C:\Users\USER\Documents\Adedayo\mecabal\backend"
   "C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -d MeCabal_dev -f scripts\init-db.sql
   ```

3. **Verify**
   - You should see success messages
   - Confirm PostGIS version is displayed

---

## Step 6: Update Backend Environment Variables

1. **Navigate to backend directory**
   ```cmd
   cd C:\Users\USER\Documents\Adedayo\mecabal\backend
   ```

2. **Edit .env file**
   - Open `backend\.env` in your text editor
   - Update database connection settings:

   ```env
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=MeCabal_user
   DATABASE_PASSWORD=MeCabal_password
   DATABASE_NAME=MeCabal_dev

   # Or use connection URL format
   DATABASE_URL=postgresql://MeCabal_user:MeCabal_password@localhost:5432/MeCabal_dev
   ```

3. **Save the file**

---

## Step 7: Test Connection from Backend

1. **Install dependencies** (if not already done)
   ```cmd
   cd C:\Users\USER\Documents\Adedayo\mecabal\backend
   npm install
   ```

2. **Test database connection**
   ```cmd
   npm run start:dev
   ```

3. **Check logs**
   - You should see: "Database connected successfully"
   - No connection errors

4. **Run migrations** (if needed)
   ```cmd
   npm run migration:run
   ```

---

## Step 8: Add PostgreSQL to PATH (Optional)

To use `psql` from any directory:

1. **Open System Environment Variables**
   - Press `Win + R`
   - Type: `sysdm.cpl`
   - Press Enter

2. **Edit PATH**
   - Click "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\PostgreSQL\15\bin`
   - Click "OK" on all dialogs

3. **Restart Terminal**
   - Close and reopen Command Prompt/PowerShell
   - Test: `psql --version`

---

## Verification Checklist

Run these commands to verify everything is working:

```cmd
cd "C:\Program Files\PostgreSQL\15\bin"

# 1. Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# 2. Check MeCabal_dev database exists
psql -U postgres -c "\l" | findstr MeCabal_dev

# 3. Check PostGIS is installed
psql -U postgres -d MeCabal_dev -c "SELECT PostGIS_Version();"

# 4. Check extensions
psql -U postgres -d MeCabal_dev -c "SELECT extname FROM pg_extension;"

# 5. Test with MeCabal_user
psql -U MeCabal_user -d MeCabal_dev -c "SELECT 1;"

# 6. Test PostGIS functionality
psql -U MeCabal_user -d MeCabal_dev -c "SELECT ST_AsText(ST_GeomFromText('POINT(3.3792 6.5244)', 4326));"
```

**Expected Results:**
- ✅ PostgreSQL version displayed
- ✅ MeCabal_dev database listed
- ✅ PostGIS 3.x version displayed
- ✅ Extensions: postgis, postgis_topology, pg_trgm, uuid-ossp, btree_gist
- ✅ Connection successful with MeCabal_user
- ✅ Point geometry returned

---

## Managing PostgreSQL Service

### Start PostgreSQL
```cmd
# Using Services
services.msc
# Find "postgresql-x64-15", right-click, Start

# Or using Command Prompt (Admin)
net start postgresql-x64-15
```

### Stop PostgreSQL
```cmd
net stop postgresql-x64-15
```

### Restart PostgreSQL
```cmd
net stop postgresql-x64-15 && net start postgresql-x64-15
```

### Check if PostgreSQL is Running
```cmd
sc query postgresql-x64-15
```

---

## Common Issues and Solutions

### Issue 1: "psql: command not found"

**Solution:** Add PostgreSQL to PATH (see Step 8) or use full path:
```cmd
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres
```

### Issue 2: "password authentication failed"

**Solution:**
- Make sure you're using the correct password
- Reset password if needed:
```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
\q
```

### Issue 3: "could not connect to server"

**Solution:**
- Check if PostgreSQL service is running
- Open Services: `services.msc`
- Find "postgresql-x64-15", ensure it's "Running"
- If not, right-click and select "Start"

### Issue 4: "extension "postgis" does not exist"

**Solution:**
- Reinstall PostGIS using Stack Builder
- Or download PostGIS bundle from https://postgis.net/windows_downloads/
- Make sure you selected the correct PostgreSQL version

### Issue 5: Port 5432 already in use

**Solution:**
- Another PostgreSQL or service is using port 5432
- Either stop the other service, or
- Install PostgreSQL on a different port (e.g., 5433)
- Update .env file accordingly

### Issue 6: "Permission denied" errors

**Solution:**
- Run Command Prompt as Administrator
- Or grant proper permissions to MeCabal_user (see Step 4)

---

## Connecting with GUI Tools

### pgAdmin 4 (Already Installed)

1. Open pgAdmin 4
2. Expand "Servers" → "PostgreSQL 15"
3. Expand "Databases" → "MeCabal_dev"
4. Right-click "MeCabal_dev" → "Query Tool"
5. Run your SQL queries

### DBeaver (Alternative - Free)

1. Download: https://dbeaver.io/download/
2. Install and open DBeaver
3. Click "Database" → "New Database Connection"
4. Select "PostgreSQL"
5. Enter connection details:
   - Host: `localhost`
   - Port: `5432`
   - Database: `MeCabal_dev`
   - Username: `MeCabal_user`
   - Password: `MeCabal_password`
6. Click "Test Connection"
7. Click "Finish"

### Visual Studio Code (With PostgreSQL Extension)

1. Install extension: "PostgreSQL" by Chris Kolkman
2. Click PostgreSQL icon in sidebar
3. Click "+" to add connection
4. Enter connection details
5. Save and connect

---

## Backup and Restore

### Create Backup

```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
pg_dump -U postgres -d MeCabal_dev -F c -f "C:\Backups\MeCabal_dev_backup.dump"
```

### Restore Backup

```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
pg_restore -U postgres -d MeCabal_dev -c "C:\Backups\MeCabal_dev_backup.dump"
```

### Backup with SQL Format

```cmd
pg_dump -U postgres -d MeCabal_dev -f "C:\Backups\MeCabal_dev_backup.sql"
```

### Restore SQL Format

```cmd
psql -U postgres -d MeCabal_dev -f "C:\Backups\MeCabal_dev_backup.sql"
```

---

## Uninstall (If Needed)

1. **Stop PostgreSQL Service**
   ```cmd
   net stop postgresql-x64-15
   ```

2. **Uninstall via Control Panel**
   - Settings → Apps → PostgreSQL 15
   - Click "Uninstall"

3. **Remove Data Directory** (optional)
   - Delete: `C:\Program Files\PostgreSQL\15\data`

4. **Remove Installation Directory** (optional)
   - Delete: `C:\Program Files\PostgreSQL\15`

---

## Performance Tuning for Development

Edit `postgresql.conf` for better local performance:

**Location:** `C:\Program Files\PostgreSQL\15\data\postgresql.conf`

```conf
# Increase shared memory for better performance
shared_buffers = 256MB

# Increase work memory for complex queries
work_mem = 16MB

# Increase maintenance memory for faster indexing
maintenance_work_mem = 128MB

# Enable query logging (for debugging)
logging_collector = on
log_statement = 'all'
log_directory = 'pg_log'
```

**Restart PostgreSQL after changes:**
```cmd
net stop postgresql-x64-15 && net start postgresql-x64-15
```

---

## Next Steps

1. ✅ PostgreSQL with PostGIS installed locally
2. ✅ MeCabal_dev database created
3. ✅ PostGIS extensions enabled
4. ✅ MeCabal_user created with permissions
5. ✅ Backend .env file updated
6. ✅ Connection verified

**Now you can:**
- Start developing location entities
- Run migrations
- Test geospatial queries
- Use pgAdmin to manage your database

---

## Quick Reference Commands

```cmd
# Connect to database
psql -U MeCabal_user -d MeCabal_dev

# List databases
\l

# Connect to different database
\c database_name

# List tables
\dt

# Describe table
\d table_name

# List extensions
\dx

# Check PostGIS version
SELECT PostGIS_Version();

# Exit
\q
```

---

## Resources

- [PostgreSQL Windows Documentation](https://www.postgresql.org/docs/current/install-windows.html)
- [PostGIS Installation](https://postgis.net/install/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [PostgreSQL Command Line Tools](https://www.postgresql.org/docs/current/reference-client.html)

---

**Document Version:** 1.0
**Last Updated:** October 17, 2025
**Platform:** Windows 10/11
