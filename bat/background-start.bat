@echo off
cd /d "%~dp0"

if not exist "logs" mkdir logs
set LOG_FILE=logs\debug_start.log
echo [%date% %time%] Script started > "%LOG_FILE%"

REM --- Find PHP ---
echo [%date% %time%] Finding PHP... >> "%LOG_FILE%"
set "PHP_CMD=php"

REM Try global PHP
%PHP_CMD% -v >nul 2>&1
if %errorlevel% equ 0 goto :FOUND_PHP

REM Try XAMPP default location
if exist "C:\xampp\php\php.exe" (
    set "PHP_CMD=C:\xampp\php\php.exe"
    goto :FOUND_PHP
)

REM Try relative path (assuming we are in htdocs/project)
if exist "..\..\php\php.exe" (
    set "PHP_CMD=..\..\php\php.exe"
    goto :FOUND_PHP
)

echo [%date% %time%] PHP not found in PATH or standard locations >> "%LOG_FILE%"
mshta javascript:alert("Error: PHP not found. Please ensure XAMPP is installed correctly.");close();
exit /b 1

:FOUND_PHP
echo [%date% %time%] Using PHP at: %PHP_CMD% >> "%LOG_FILE%"

REM --- Check if Laravel is already running ---
netstat -an | findstr /C:":8000 " >nul
if %errorlevel% equ 0 (
    echo [%date% %time%] Port 8000 is already in use. System likely running. >> "%LOG_FILE%"
    echo [%date% %time%] Opening browser and exiting... >> "%LOG_FILE%"
    
    REM Use PowerShell to open URL reliably
    powershell -Command "Start-Process 'http://localhost:8000'"
    exit /b 0
)

REM --- Check MySQL with Retry Loop (Max 30 seconds) ---
echo [%date% %time%] Checking MySQL connection... >> "%LOG_FILE%"
set RETRY_COUNT=0
:CHECK_MYSQL
"%PHP_CMD%" -r "$fp = @fsockopen('127.0.0.1', 3306, $errno, $errstr, 1); exit($fp ? 0 : 1);"
if %errorlevel% equ 0 goto :MYSQL_OK

set /a RETRY_COUNT+=1
if %RETRY_COUNT% geq 15 (
    echo [%date% %time%] MySQL unreachable after 15 attempts >> "%LOG_FILE%"
    powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Error: MySQL is not running. Please start XAMPP Database.', 'System Error', 'OK', 'Error')"
    exit /b 1
)

echo [%date% %time%] MySQL not ready, retrying (%RETRY_COUNT%/15)... >> "%LOG_FILE%"
timeout /t 2 >nul
goto :CHECK_MYSQL

:MYSQL_OK
echo [%date% %time%] MySQL is running >> "%LOG_FILE%"

if "%1"=="no-browser" (
    echo [%date% %time%] Skipping browser start (Server-only mode) >> "%LOG_FILE%"
    goto :START_SERVER
)

REM Start Browser
echo [%date% %time%] Opening browser... >> "%LOG_FILE%"
powershell -Command "Start-Process 'http://localhost:8000'"

:START_SERVER
REM Start Server
echo [%date% %time%] Starting Laravel... >> "%LOG_FILE%"
cd Backend
"%PHP_CMD%" artisan serve > "..\logs\laravel.log" 2>&1

if %errorlevel% neq 0 (
    echo [%date% %time%] Laravel exited with error %errorlevel% >> "..\%LOG_FILE%"
)