@echo off
title Car Dealership System - Installation
cls

echo.
echo ========================================================
echo        Car Dealership System - Installation
echo ========================================================
echo.

REM Change to script directory
cd /d "%~dp0"

echo [1/4] Checking Requirements...
echo.

REM Check PHP
php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] PHP not found. Please install XAMPP
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo    [OK] PHP found
echo.

echo [2/4] Checking installation files...
echo.
if not exist "Backend" (
    echo    [X] Backend folder not found!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

if not exist "Backend\vendor" (
    echo    [X] Dependencies missing! Package may be corrupted.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo    [OK] All files present
echo.

echo [3/4] Setting up environment...
echo.
cd Backend
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo    [OK] .env file created
        
        echo    [i] Generating application keys...
        call php artisan key:generate --force
        call php artisan jwt:secret --force

        echo    [OK] Environment configured
    ) else (
        echo    [X] .env.example not found!
        echo.
        echo Press any key to exit...
        pause >nul
        cd ..
        exit /b 1
    )
) else (
    echo    [i] .env file already exists
    echo    [i] Checking application keys...
    call php artisan key:generate
    call php artisan jwt:secret
)
cd ..
echo.

REM Create directories
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups

echo [4/4] Setting up database...
echo.
set /p run_migrate="    Run database setup now? (Y/N): "
if /i "%run_migrate%"=="Y" (
    cd Backend
    php artisan migrate --force
    if %errorlevel% equ 0 (
        echo    [OK] Database setup complete
        set /p run_seed="    Add sample data? (Y/N): "
        if /i "%run_seed%"=="Y" (
            php artisan db:seed
        )
    ) else (
        echo    [!] Migration failed - check your database settings
    )
    cd ..
) else (
    echo    [i] Database setup skipped
)
echo.

echo ========================================================
echo          Installation Complete!
echo ========================================================
echo.
echo Next steps:
echo   1. Start MySQL from XAMPP Control Panel
echo   2. Edit Backend\.env (database settings if needed)
echo   3. Run: START.bat
echo   4. System will open at: http://localhost:8000
echo.
echo For updates: Use Settings - System Update button
echo ========================================================
echo.
echo Press any key to exit...
pause >nul
