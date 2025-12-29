@echo off
title POS System - Installation
cls
chcp 65001 >nul 2>&1

echo.
echo ========================================================
echo            POS System - Installation
echo ========================================================
echo.

REM Change to project root directory (parent of bat folder)
cd /d "%~dp0.."
set "PROJECT_DIR=%cd%"

echo [1/5] Checking Requirements...
echo.

REM Check PHP
php -v >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\xampp\php\php.exe" (
        set "PATH=C:\xampp\php;%PATH%"
    ) else (
        echo    [X] PHP not found. Please install XAMPP
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
)
echo    [OK] PHP found

REM Check Composer
where composer >nul 2>&1
if %errorlevel% neq 0 (
    echo    [!] Composer not found - will skip dependency installation
    set "COMPOSER_AVAILABLE=0"
) else (
    call composer -V >nul 2>&1
    echo    [OK] Composer found
    set "COMPOSER_AVAILABLE=1"
)
echo.
pause

echo [2/5] Checking installation files...
echo.
if not exist "backend" (
    echo    [X] Backend folder not found!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo    [OK] Backend folder found

if not exist "frontend" (
    echo    [!] Frontend folder not found - will use pre-built version
) else (
    echo    [OK] Frontend folder found
)
echo.
pause

echo [3/5] Installing dependencies...
echo.
if "%COMPOSER_AVAILABLE%"=="1" (
    cd backend
    echo    Installing PHP dependencies...
    call composer install
    if errorlevel 1 (
        echo    [!] Composer install had issues, continuing...
    ) else (
        echo    [OK] PHP dependencies installed
    )
    cd ..
) else (
    if not exist "backend\vendor" (
        echo    [X] Dependencies missing and Composer not available!
        echo        Please install Composer or use a pre-packaged version.
        pause >nul
        exit /b 1
    )
    echo    [OK] Using existing dependencies
)
echo.

echo [4/5] Setting up environment...
echo.
cd backend
pause
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo    [OK] .env file created
        
        echo    Generating application keys...
        php artisan key:generate --force >nul 2>&1
        echo    [OK] Application key generated
    ) else (
        echo    [X] .env.example not found!
        echo.
        echo Press any key to exit...
        pause >nul
        cd ..
        exit /b 1
    )
) else (
    echo    [OK] .env file already exists
)
cd ..

REM Create required directories
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups
echo    [OK] Directories created
pause
echo.

echo [5/5] Setting up database...
echo.
set /p run_migrate="    Run database setup now? (Y/N): "
if /i "%run_migrate%"=="Y" (
    
    REM Create Database if not exists
    echo    Creating database if missing...
    set "MYSQL_CMD=mysql"
    if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_CMD=C:\xampp\mysql\bin\mysql.exe"
    
    "%MYSQL_CMD%" -u root -e "CREATE DATABASE IF NOT EXISTS pos_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
    if %errorlevel% neq 0 (
        echo    [!] Could not create database automatically. Please ensure MySQL is running.
    ) else (
        echo    [OK] Database checked/created
    )

    cd backend
    echo    Running migrations...
    php artisan migrate --force
    if %errorlevel% equ 0 (
        echo    [OK] Database tables created
        echo.
        set /p run_seed="    Add initial data (admin user, etc.)? (Y/N): "
        if /i "%run_seed%"=="Y" (
            php artisan db:seed
            echo    [OK] Initial data added
            echo.
            echo    Default Admin Login:
            echo      Email: admin@pos.local
            echo      Password: password
        )
    ) else (
        echo    [!] Migration failed - check database settings in backend\.env
    )
    cd ..
) else (
    echo    [i] Database setup skipped
)
pause
echo.

echo ========================================================
echo            Installation Complete!
echo ========================================================
echo.
echo Next steps:
echo   1. Start MySQL from XAMPP Control Panel
echo   2. Edit backend\.env if needed (database settings)
echo   3. Run: Run-System.bat
echo   4. System will open at: http://localhost:8000
echo.
echo Default Login:
echo   Email: admin@pos.local
echo   Password: password
echo ========================================================
echo.
echo Press any key to exit...
pause >nul
