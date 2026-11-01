@echo off
title Asset Management System (Production Web Server)
cd /d "%~dp0"
echo ========================================================
echo   Asset Management System (AMIS / ASM) - Production
echo   Addis Ababa City Administration Public Property Authority
echo ========================================================
echo.
echo Starting Web Server on Port 5002...
echo.
node bin/ams-web.js
pause

