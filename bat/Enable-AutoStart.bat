@echo off
cd /d "%~dp0"
echo.
echo ========================================================
echo        Enabling Auto-Start
echo ========================================================
echo.

set "LINK_NAME=Car Dealership System.lnk"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_PATH=%~dp0Start-Server-Only.bat"
set "WORK_DIR=%~dp0"

echo Creating shortcut in: %STARTUP_DIR%

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_DIR%\%LINK_NAME%'); $s.TargetPath = '%TARGET_PATH%'; $s.WorkingDirectory = '%WORK_DIR%'; $s.Save()"

if exist "%STARTUP_DIR%\%LINK_NAME%" (
    echo.
    echo    [OK] Success! The system will now start automatically when you log in.
    echo    Note: Make sure XAMPP (MySQL) is also set to start automatically.
) else (
    echo.
    echo    [X] Failed to create shortcut.
)
echo.
pause