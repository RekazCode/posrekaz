@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo.
echo ========================================================
echo        POS System - Enable Auto-Start
echo ========================================================
echo.

set "LINK_NAME=POS System.lnk"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_PATH=%~dp0Start-Server-Only.bat"
set "WORK_DIR=%~dp0"

echo Creating shortcut in Windows Startup folder...
echo Location: %STARTUP_DIR%
echo.

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_DIR%\%LINK_NAME%'); $s.TargetPath = '%TARGET_PATH%'; $s.WorkingDirectory = '%WORK_DIR%'; $s.Description = 'POS System Auto-Start'; $s.Save()"

if exist "%STARTUP_DIR%\%LINK_NAME%" (
    echo    [OK] Success!
    echo.
    echo    The POS System will now start automatically when you log in.
    echo.
    echo    Note: Make sure XAMPP MySQL is also set to auto-start:
    echo      1. Open XAMPP Control Panel
    echo      2. Click "Config" button
    echo      3. Check "Autostart MySQL"
    echo.
) else (
    echo    [X] Failed to create shortcut.
    echo        Try running as Administrator.
)

echo.
pause
