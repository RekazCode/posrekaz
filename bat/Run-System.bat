@echo off
REM ========================================================
REM POS System - Run System (with Browser)
REM ========================================================
REM Starts the POS server and opens the browser

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
set "BATCH_FILE=%SCRIPT_DIR%background-start.bat"

REM Start the background server process
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Process -FilePath '%BATCH_FILE%' -WorkingDirectory '%SCRIPT_DIR%' -WindowStyle Hidden"
