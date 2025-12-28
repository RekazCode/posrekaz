@echo off
echo Stopping System...
taskkill /F /IM php.exe >nul 2>&1
echo System Stopped.
timeout /t 2 >nul