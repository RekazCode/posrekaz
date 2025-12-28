@echo off
REM ========================================================
REM POS System - Background Server Starter
REM ========================================================
REM This script is called by Run-System.bat and Start-Server-Only.bat
REM It runs in the background and starts the Laravel server

cd /d "%~dp0.."
set "PROJECT_DIR=%cd%"

if not exist "logs" mkdir logs
set LOG_FILE=logs\server_%date:~-4,4%%date:~-10,2%%date:~-7,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo [%date% %time%] POS Server starting... >> "%LOG_FILE%"

REM --- Find PHP ---
set "PHP_CMD=php"

REM Try global PHP first
%PHP_CMD% -v >nul 2>&1
if %errorlevel% equ 0 goto :FOUND_PHP

REM Try XAMPP default location
if exist "C:\xampp\php\php.exe" (
    set "PHP_CMD=C:\xampp\php\php.exe"
    goto :FOUND_PHP
)

REM Try relative path (assuming we are in htdocs/POS)
if exist "..\..\php\php.exe" (
    set "PHP_CMD=..\..\php\php.exe"
    goto :FOUND_PHP
)

echo [%date% %time%] ERROR: PHP not found >> "%LOG_FILE%"
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('PHP not found. Please ensure XAMPP is installed correctly.', 'POS System Error', 'OK', 'Error')"
exit /b 1

:FOUND_PHP
echo [%date% %time%] Using PHP: %PHP_CMD% >> "%LOG_FILE%"

REM --- Check if server is already running ---
netstat -an | findstr /C:":8000 " | findstr /C:"LISTENING" >nul
if %errorlevel% equ 0 (
    echo [%date% %time%] Port 8000 already in use - server likely running >> "%LOG_FILE%"
    if not "%1"=="no-browser" (
        powershell -Command "Start-Process 'http://localhost:8000'"
    )
    exit /b 0
)

REM --- Check MySQL Connection ---
echo [%date% %time%] Checking MySQL connection... >> "%LOG_FILE%"
set RETRY_COUNT=0

:CHECK_MYSQL
"%PHP_CMD%" -r "$fp = @fsockopen('127.0.0.1', 3306, $errno, $errstr, 2); exit($fp ? 0 : 1);"
if %errorlevel% equ 0 goto :MYSQL_OK

set /a RETRY_COUNT+=1
if %RETRY_COUNT% geq 15 (
    echo [%date% %time%] MySQL not available after 15 attempts >> "%LOG_FILE%"
    powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('MySQL is not running. Please start XAMPP and ensure MySQL is running.', 'POS System Error', 'OK', 'Error')"
    exit /b 1
)

echo [%date% %time%] Waiting for MySQL (%RETRY_COUNT%/15)... >> "%LOG_FILE%"
timeout /t 2 >nul
goto :CHECK_MYSQL

:MYSQL_OK
echo [%date% %time%] MySQL is ready >> "%LOG_FILE%"

REM --- Open Browser (unless no-browser flag is set) ---
if not "%1"=="no-browser" (
    echo [%date% %time%] Opening browser... >> "%LOG_FILE%"
    powershell -Command "Start-Process 'http://localhost:8000'"
)

REM --- Start Laravel Server ---
echo [%date% %time%] Starting Laravel server... >> "%LOG_FILE%"
cd backend
"%PHP_CMD%" artisan serve --host=localhost --port=8000 >> "..\logs\laravel.log" 2>&1

echo [%date% %time%] Server stopped with exit code %errorlevel% >> "..\%LOG_FILE%"
