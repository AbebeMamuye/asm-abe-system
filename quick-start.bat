@echo off
echo ================================================
echo  Asset Management System - Quick Start
echo  Version 2.0.0 - AbeTech
echo ================================================
echo.
echo This will start the system in development mode
echo.

echo Step 1: Starting default-app (Next.js server)...
cd default-app

echo Checking database...
call npx prisma generate
call npx prisma migrate deploy

echo.
echo Starting Next.js server on http://localhost:3000
echo.
echo Admin Credentials:
echo   Username: AbeTech
echo   Password: TechAbe@123
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev
