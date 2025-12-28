@echo off
REM ========================================================
REM POS System - Start Server Only (No Browser)
REM ========================================================
REM Starts the POS server without opening the browser
REM Useful for auto-start on Windows login

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
set "BATCH_FILE=%SCRIPT_DIR%background-start.bat"

REM Start the background server process with no-browser flag
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Process -FilePath '%BATCH_FILE%' -ArgumentList 'no-browser' -WorkingDirectory '%SCRIPT_DIR%' -WindowStyle Hidden"
