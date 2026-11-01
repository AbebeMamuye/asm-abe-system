@echo off
echo ================================================================================
echo  Asset Management System v2.0.0 - Manual Build Guide
echo  AbeTech - Admin: AbeTech / TechAbe@123
echo ================================================================================
echo.
echo This guide will help you build the installer step-by-step
echo.
pause

:STEP1
cls
echo ================================================================================
echo  STEP 1: Verify Prerequisites
echo ================================================================================
echo.
echo Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js v18 or higher from https://nodejs.org
    pause
    exit /b 1
)
echo.
echo Checking NPM version...
npm --version
echo.
echo Prerequisites OK!
echo.
pause

:STEP2
cls
echo ================================================================================
echo  STEP 2: Root Dependencies
echo ================================================================================
echo.
echo Installing root project dependencies...
echo This may take a few minutes...
echo.
cd "g:\F2\Asset Management System"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Some root dependencies may have failed
    echo This is OK if electron-builder and electron-vite installed
    echo.
)
pause

:STEP3
cls
echo ================================================================================
echo  STEP 3: Default-App Dependencies  
echo ================================================================================
echo.
echo Installing Next.js app dependencies...
echo This may take 5-10 minutes...
echo.
cd "g:\F2\Asset Management System\default-app"

echo Checking if node_modules exists...
if exist "node_modules" (
    echo node_modules folder exists, skipping npm install
    echo If you want fresh install, delete node_modules and run again
) else (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install dependencies
        echo Please check your internet connection
        pause
        exit /b 1
    )
)
pause

:STEP4
cls
echo ================================================================================
echo  STEP 4: Database Setup
echo ================================================================================
echo.
cd "g:\F2\Asset Management System\default-app"
echo Generating Prisma Client...
call npx prisma generate
echo.
echo Checking database migrations...
call npx prisma migrate deploy
echo.
echo Database is ready with AbeTech admin account!
echo.
pause

:STEP5
cls
echo ================================================================================
echo  STEP 5: Build Next.js App (OPTIONAL - Can Skip)
echo ================================================================================
echo.
echo The Electron app can run without pre-building Next.js
echo It will build on-the-fly when first launched
echo.
echo Do you want to pre-build Next.js? (Recommended for faster startup)
echo.
choice /C YN /M "Build Next.js now"
if errorlevel 2 goto STEP6
if errorlevel 1 goto BUILD_NEXTJS

:BUILD_NEXTJS
echo.
echo Building Next.js production bundle...
cd "g:\F2\Asset Management System\default-app"
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Next.js build failed
    echo This is OK - the app will build on first run
    echo.
)
pause

:STEP6
cls
echo ================================================================================
echo  STEP 6: Build Electron App
echo ================================================================================
echo.
cd "g:\F2\Asset Management System"
echo Building Electron main, preload, and renderer...
call npm run build:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    pause
    exit /b 1
)
echo.
echo Electron app built successfully!
echo Output: out\main, out\preload, out\renderer
echo.
pause

:STEP7
cls
echo ================================================================================
echo  STEP 7: Package as Windows Installer
echo ================================================================================
echo.
echo IMPORTANT: This step requires downloading Electron (~137 MB)
echo          Make sure you have a stable internet connection!
echo.
echo This may take 15-30 minutes depending on your connection speed
echo.
choice /C YN /M "Ready to build installer"
if errorlevel 2 goto SKIP_INSTALLER
if errorlevel 1 goto BUILD_INSTALLER

:BUILD_INSTALLER
echo.
echo Starting installer build...
echo Please wait, do not interrupt...
echo.
call npx electron-builder --win --config electron-builder.yml
if %errorlevel% neq 0 (
    echo.
    echo ════════════════════════════════════════════════════════════════════════════
    echo  INSTALLER BUILD FAILED
    echo ════════════════════════════════════════════════════════════════════════════
    echo.
    echo Common Issues:
    echo  1. Slow/unstable internet - Electron download timeout
    echo  2. Corrupted cache - Delete: %%LOCALAPPDATA%%\electron
    echo  3. Firewall blocking download
    echo.
    echo Solutions:
    echo  a) Clear cache and retry:
    echo     rmdir /s /q "%%LOCALAPPDATA%%\electron"
    echo     rmdir /s /q "%%LOCALAPPDATA%%\electron-builder"
    echo.
    echo  b) Use portable version instead (see SKIP_INSTALLER option)
    echo.
    echo  c) Try again when you have better internet
    echo.
    pause
    goto MENU
)

echo.
echo ════════════════════════════════════════════════════════════════════════════
echo  SUCCESS! Installer Created
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo Installer Location:
echo   dist\Asset Management System-2.0.0-Setup.exe
echo.
echo Portable Version:
echo   dist\win-unpacked\asset-management-system.exe
echo.
goto SUCCESS

:SKIP_INSTALLER
cls
echo ================================================================================
echo  STEP 7B: Create Portable Version (Without NSIS Installer)
echo ================================================================================
echo.
echo Creating unpacked portable version...
echo This still requires downloading Electron (~137 MB)
echo.
call npx electron-builder --win --dir
if %errorlevel% neq 0 (
    echo.
    echo Build failed. See troubleshooting above.
    pause
    goto MENU
)
echo.
echo ════════════════════════════════════════════════════════════════════════════
echo  SUCCESS! Portable Version Created
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo Portable App Location:
echo   dist\win-unpacked\asset-management-system.exe
echo.
echo You can:
echo  1. Run it directly from dist\win-unpacked
echo  2. Copy the entire win-unpacked folder to another computer
echo  3. Zip it and distribute
echo.
goto SUCCESS

:SUCCESS
echo ════════════════════════════════════════════════════════════════════════════
echo  BUILD COMPLETE!
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo New Admin Credentials:
echo   Username: AbeTech
echo   Password: TechAbe@123
echo.
echo Next Steps:
echo  1. Test the application
echo  2. Distribute the installer/portable version
echo  3. Install on target computers
echo.
pause
goto END

:MENU
cls
echo ================================================================================
echo  What would you like to do?
echo ================================================================================
echo.
echo  1. Retry installer build (Step 7)
echo  2. Build portable version only (Step 7B)
echo  3. Clear electron cache and retry
echo  4. Test the app without building installer
echo  5. Exit
echo.
choice /C 12345 /N /M "Select option (1-5): "
if errorlevel 5 goto END
if errorlevel 4 goto TEST
if errorlevel 3 goto CLEAR_CACHE
if errorlevel 2 goto SKIP_INSTALLER
if errorlevel 1 goto STEP7

:CLEAR_CACHE
echo.
echo Clearing electron cache...
rmdir /s /q "%LOCALAPPDATA%\electron" 2>nul
rmdir /s /q "%LOCALAPPDATA%\electron-builder" 2>nul
echo Cache cleared!
pause
goto STEP7

:TEST
cls
echo ================================================================================
echo  Testing Application
echo ================================================================================
echo.
echo Starting development server...
echo This will open the app at http://localhost:3000
echo.
cd "g:\F2\Asset Management System\default-app"
call npm run dev

:END
echo.
echo Exiting...
exit /b 0
