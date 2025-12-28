@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================================
echo        POS System - Disable Auto-Start
echo ========================================================
echo.

set "LINK_NAME=POS System.lnk"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

if exist "%STARTUP_DIR%\%LINK_NAME%" (
    del "%STARTUP_DIR%\%LINK_NAME%"
    echo    [OK] Auto-Start has been disabled.
    echo.
    echo    The POS System will no longer start automatically.
) else (
    echo    [i] Auto-Start was not enabled.
)

echo.
pause
