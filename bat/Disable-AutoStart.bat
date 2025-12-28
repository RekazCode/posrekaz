@echo off
echo.
echo ========================================================
echo        Disabling Auto-Start
echo ========================================================
echo.

set "LINK_NAME=Car Dealership System.lnk"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

if exist "%STARTUP_DIR%\%LINK_NAME%" (
    del "%STARTUP_DIR%\%LINK_NAME%"
    echo    [OK] Auto-Start has been disabled.
) else (
    echo    [i] Auto-Start was not enabled.
)

echo.
pause