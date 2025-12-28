@echo off
REM ========================================================
REM POS System - Stop System
REM ========================================================

echo.
echo ========================================================
echo            POS System - Stopping Server
echo ========================================================
echo.

echo Stopping PHP processes...
taskkill /F /IM php.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo    [OK] Server stopped successfully
) else (
    echo    [i] No server was running
)

echo.
echo Press any key to exit...
timeout /t 3 >nul
