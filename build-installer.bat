@echo off
echo ================================================
echo  Asset Management System - Installer Builder
echo  Version 2.0.0 - AbeTech
echo ================================================
echo.
echo IMPORTANT: Make sure you have a stable internet connection
echo            Electron (~137 MB) will be downloaded if not cached
echo.
pause

echo Step 1: Cleaning old builds...
if exist "dist" (
    echo Removing old dist folder...
    rmdir /s /q "dist" 2>nul
)
if exist "out" (
    echo Removing old out folder...
    rmdir /s /q "out" 2>nul
)

echo.
echo Step 2: Installing/updating dependencies...
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Some dependencies may not have installed correctly
    echo Continuing anyway...
)

echo.
echo Step 3: Building default-app (Next.js)...
cd default-app
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install default-app dependencies
    cd ..
    pause
    exit /b 1
)

echo Ensuring database is set up...
call npx prisma generate
call npx prisma migrate deploy

echo.
echo Step 4: Building Next.js production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Next.js app
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Step 5: Building Electron Application...
call npm run build:electron
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Electron app
    pause
    exit /b 1
)

echo.
echo Step 6: Creating Windows Installer (NSIS)...
echo This will download Electron if needed (~137 MB)
echo Please be patient, this may take 10-30 minutes...
echo.
call npx electron-builder --win --config electron-builder.yml
if %errorlevel% neq 0 (
    echo.
    echo ================================================
    echo  ERROR: Failed to create installer
    echo ================================================
    echo.
    echo Common issues:
    echo  1. Slow/unstable internet connection
    echo  2. Corrupted electron cache
    echo.
    echo To fix:
    echo  1. Check your internet connection
    echo  2. Clear electron cache: 
    echo     del /s /q "%%LOCALAPPDATA%%\electron"
    echo     del /s /q "%%LOCALAPPDATA%%\electron-builder"
    echo  3. Run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo  BUILD SUCCESSFUL!
echo ================================================
echo.
echo Installer created at:
echo   dist\Asset Management System-2.0.0-Setup.exe
echo.
echo Unpacked version at:
echo   dist\win-unpacked\asset-management-system.exe
echo.
echo You can now:
echo  1. Test the unpacked version
echo  2. Install using the Setup.exe
echo  3. Distribute the installer to other computers
echo.
echo New Admin Credentials:
echo   Username: AbeTech
echo   Password: TechAbe@123
echo.
echo ================================================
pause
