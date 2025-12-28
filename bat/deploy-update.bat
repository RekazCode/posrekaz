@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================================
echo        POS System - Deploy Update to Clients
echo ========================================================
echo.

REM Change to project root directory
cd /d "%~dp0.."
set "PROJECT_DIR=%cd%"

REM Check if Node.js is available
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] Node.js not found!
    echo        Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if Git is available
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] Git not found!
    echo        Please install Git from: https://git-scm.com
    pause
    exit /b 1
)

echo [1/4] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo    [X] npm install failed!
    pause
    exit /b 1
)
echo    [OK] Dependencies installed
cd ..
echo.

echo [2/4] Building frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo    [X] Build failed!
    pause
    exit /b 1
)
cd ..
echo    [OK] Frontend built successfully
echo.

echo [3/4] Copying files to Backend...
xcopy /E /I /Y /Q "frontend\dist\*" "backend\public\" > nul
echo    [OK] Files copied to backend/public
echo.

echo [4/4] Pushing to GitHub...
git add -A
git commit -m "POS Update: Frontend rebuild %date%"
git push origin main

if errorlevel 1 (
    echo    [X] Git push failed!
    echo        Make sure you are logged in to GitHub.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo          Update Deployed Successfully!
echo ========================================================
echo.
echo Clients can now run update.bat to get the latest version.
echo.
pause
