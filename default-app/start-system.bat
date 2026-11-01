@echo off
TITLE Health Center Inventory System - Bootloader
echo ===================================================
echo   HEALTH CENTER INVENTORY SYSTEM - LOCAL TERMINAL
echo ===================================================
echo.

:: 1. Start PostgreSQL Service (Windows)
echo [1/3] Starting Database Service...
net start postgresql-x64-15 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Warning: PostgreSQL service might already be running or name differs.
    echo [!] Attempting to proceed...
) else (
    echo [OK] Database service started.
)

:: 2. Check for Production Build
if not exist ".next" (
    echo [2/3] First-time setup detected. Building application...
    npm run build
) else (
    echo [2/3] Production build found.
)

:: 3. Start Application with PM2
echo [3/3] Launching System Process Manager...
pm2 start ecosystem.config.js
if %ERRORLEVEL% NEQ 0 (
    echo [!] PM2 not found? Trying standard npm start...
    npm start
) else (
    echo [OK] System is running in background.
)

echo.
echo ===================================================
echo   SYSTEM READY
echo   Access via: http://localhost:3000
echo   Network Access: Check your Local IP (ipconfig)
echo ===================================================
echo.
pause
