@echo off
echo ================================================================================
echo  Asset Management System - Enterprise Upgrade v2.0.0
echo  AbeTech - Professional Asset Management Solution
echo ================================================================================
echo.
echo This script will upgrade your database to the enterprise schema
echo and apply all new features.
echo.
echo IMPORTANT: This will reset your database and add comprehensive test data.
echo            If you have existing data you want to keep, back it up first!
echo.
pause

echo.
echo ================================================================================
echo Step 1: Backing up current database
echo ================================================================================
echo.

cd default-app

if exist "prisma\dev.db" (
    echo Creating backup...
    copy "prisma\dev.db" "prisma\dev_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.db" /Y
    echo ✓ Backup created
) else (
    echo No existing database found, skipping backup
)

echo.
echo ================================================================================
echo Step 2: Generating Prisma Client with new schema
echo ================================================================================
echo.
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated

echo.
echo ================================================================================
echo Step 3: Applying database migrations
echo ================================================================================
echo.
call npx prisma migrate reset --force
if %errorlevel% neq 0 (
    echo ERROR: Failed to apply migrations
    pause
    exit /b 1
)
echo ✓ Migrations applied

echo.
echo ================================================================================
echo Step 4: Seeding database with comprehensive test data
echo ================================================================================
echo.
call npx prisma db seed
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database
    pause
    exit /b 1
)
echo ✓ Database seeded successfully

cd ..

echo.
echo ================================================================================
echo  ✓ ENTERPRISE UPGRADE COMPLETE!
echo ================================================================================
echo.
echo Your Asset Management System has been upgraded to v2.0.0 Enterprise Edition
echo.
echo 📊 NEW FEATURES ADDED:
echo    • Service layer architecture
echo    • Enhanced security with audit logging
echo    • Multi-role user management (ADMIN, MANAGER, STAFF, VIEWER)
echo    • Advanced inventory tracking with barcodes and serial numbers
echo    • Comprehensive maintenance management
echo    • Low stock notifications
echo    • Enhanced database schema (13 tables)
echo    • Production-ready configuration
echo.
echo 🔐 NEW LOGIN CREDENTIALS:
echo    ┌─────────────────────────────────────────────────┐
echo    │ Role      │ Username    │ Password          │
echo    ├─────────────────────────────────────────────────┤
echo    │ ADMIN     │ AbeTech     │ TechAbe@123      │
echo    │ MANAGER   │ manager     │ Manager@123      │
echo    │ STAFF     │ staff       │ Staff@123        │
echo    │ VIEWER    │ viewer      │ Viewer@123       │
echo    └─────────────────────────────────────────────────┘
echo.
echo 📚 DOCUMENTATION AVAILABLE:
echo    • ENTERPRISE-ARCHITECTURE.md  - System architecture
echo    • API-DOCUMENTATION.md        - Complete API reference
echo    • PRODUCTION-DEPLOYMENT.md    - Production deployment guide
echo    • ENTERPRISE-UPGRADE-SUMMARY.md - What's new in v2.0
echo    • README.md                   - Getting started guide
echo.
echo 🚀 NEXT STEPS:
echo    1. Run quick-start.bat to test the system
echo    2. Review the new documentation
echo    3. Build installer with build-installer.bat
echo    4. Deploy to production using PRODUCTION-DEPLOYMENT.md guide
echo.
echo ================================================================================
echo.
pause
