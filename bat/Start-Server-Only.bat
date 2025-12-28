@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
set "BATCH_FILE=%SCRIPT_DIR%background-start.bat"

powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Process -FilePath '%BATCH_FILE%' -ArgumentList 'no-browser' -WorkingDirectory '%SCRIPT_DIR%' -WindowStyle Hidden"