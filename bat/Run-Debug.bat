@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================================
echo        POS System - Debug Mode
echo ========================================================
echo.
echo This script runs the server in the foreground so you can see errors.
echo.

cd /d "%~dp0"
call background-start.bat

echo.
echo Server process finished.
pause
