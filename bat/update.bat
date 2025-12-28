@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo        System Update
echo ========================================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

if not exist "logs" mkdir logs
set LOG_FILE=logs\update_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo [%date% %time%] Update started > "%LOG_FILE%"

echo [1/4] Creating backup...
echo.
if not exist "backups" mkdir backups
cd Backend
php artisan db:backup >> "..\%LOG_FILE%" 2>&1
if not errorlevel 1 (
    echo    [OK] Backup created
) else (
    echo    [!] Backup failed, continuing...
)
cd ..
echo.

echo [2/4] Downloading updates...
echo.
set "GIT_PATH=git\bin\git.exe"
if exist "%GIT_PATH%" (
    set "GIT_EXE=%PROJECT_DIR%%GIT_PATH%"
    
    REM Fix for "dubious ownership" error
    "%PROJECT_DIR%git\bin\git.exe" config --global --add safe.directory "*" >nul 2>&1
    
    "%PROJECT_DIR%git\bin\git.exe" fetch origin main >> "%LOG_FILE%" 2>&1
    "%PROJECT_DIR%git\bin\git.exe" reset --hard origin/main >> "%LOG_FILE%" 2>&1
    
    if not errorlevel 1 (
        echo    [OK] Updates downloaded
    ) else (
        echo    [X] Download failed
        echo [%date% %time%] Git pull failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
) else (
    echo    [X] Git not found
    pause
    exit /b 1
)
echo.

echo [3/4] Updating packages...
echo.
cd Backend
composer install --no-dev --optimize-autoloader >> "..\%LOG_FILE%" 2>&1
if not errorlevel 1 (
    echo    [OK] Packages updated
) else (
    echo    [X] Package update failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [4/4] Updating database...
echo.
cd Backend
php artisan migrate --force >> "..\%LOG_FILE%" 2>&1
if not errorlevel 1 (
    echo    [OK] Database updated
) else (
    echo    [X] Database update failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================================
echo          Update Complete!
echo ========================================================
echo.
echo Log file: %LOG_FILE%
echo.
timeout /t 5
exit /b 0
