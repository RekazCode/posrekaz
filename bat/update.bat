@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

echo.
echo ========================================================
echo            POS System - Update
echo ========================================================
echo.

REM Change to project root directory
cd /d "%~dp0.."
set "PROJECT_DIR=%cd%"

if not exist "logs" mkdir logs
set LOG_FILE=logs\update_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo [%date% %time%] Update started > "%LOG_FILE%"

REM --- Find Git ---
set "GIT_CMD=git"
%GIT_CMD% --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] Git not found. Please install Git for Windows.
    echo        Download from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
echo    [OK] Git found
echo.

echo [1/4] Creating backup...
echo.
if not exist "backups" mkdir backups
cd backend
php artisan db:backup >> "..\%LOG_FILE%" 2>&1
if not errorlevel 1 (
    echo    [OK] Database backup created
) else (
    echo    [!] Backup skipped or failed, continuing...
)
cd ..
echo.

echo [2/4] Downloading updates from GitHub...
echo.

REM Configure safe directory
git config --global --add safe.directory "%PROJECT_DIR%" >nul 2>&1

REM Fetch and reset to latest
git fetch origin main >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo    [X] Failed to fetch updates
    echo        Check your internet connection
    echo.
    pause
    exit /b 1
)

git reset --hard origin/main >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo    [X] Failed to apply updates
    echo.
    pause
    exit /b 1
)
echo    [OK] Updates downloaded
echo.

echo [3/4] Updating PHP packages...
echo.
composer -V >nul 2>&1
if %errorlevel% equ 0 (
    cd backend
    composer install --no-dev --optimize-autoloader >> "..\%LOG_FILE%" 2>&1
    if not errorlevel 1 (
        echo    [OK] Packages updated
    ) else (
        echo    [!] Package update had issues
    )
    cd ..
) else (
    echo    [i] Composer not found - skipping package update
)
echo.

echo [4/4] Updating database...
echo.
cd backend
php artisan migrate --force >> "..\%LOG_FILE%" 2>&1
if not errorlevel 1 (
    echo    [OK] Database updated
) else (
    echo    [!] Database update had issues - check %LOG_FILE%
)

REM Clear caches
php artisan config:clear >> "..\%LOG_FILE%" 2>&1
php artisan cache:clear >> "..\%LOG_FILE%" 2>&1
php artisan view:clear >> "..\%LOG_FILE%" 2>&1
echo    [OK] Caches cleared
cd ..
echo.

echo ========================================================
echo            Update Complete!
echo ========================================================
echo.
echo Log file: %LOG_FILE%
echo.
echo Press any key to exit...
timeout /t 5 >nul
