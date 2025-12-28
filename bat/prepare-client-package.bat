@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================================
echo        POS System - Prepare Client Package
echo ========================================================
echo.

REM Change to project root directory
cd /d "%~dp0.."
set "PROJECT_DIR=%cd%"

set "TEMP_DIR=%TEMP%\pos-client-package"
set "ZIP_NAME=pos-client.zip"

REM Check requirements
echo Checking requirements...
composer -V >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] Composer not found. Please install Composer.
    pause
    exit /b 1
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] Node.js not found. Please install Node.js.
    pause
    exit /b 1
)
echo    [OK] All requirements met
echo.

echo [1/6] Installing backend dependencies...
cd backend
if not exist "vendor" (
    composer install --no-dev --optimize-autoloader
    if errorlevel 1 (
        echo    [X] Composer install failed
        pause
        exit /b 1
    )
) else (
    echo    [i] Dependencies already installed
)
cd ..
echo    [OK] Backend dependencies ready
echo.

echo [2/6] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo    [X] npm install failed
    pause
    exit /b 1
)
cd ..
echo    [OK] Frontend dependencies ready
echo.

echo [3/6] Building frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo    [X] Build failed
    pause
    exit /b 1
)
cd ..
echo    [OK] Frontend built
echo.

echo [4/6] Preparing package directory...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"
mkdir "%TEMP_DIR%\backend"
mkdir "%TEMP_DIR%\bat"
mkdir "%TEMP_DIR%\logs"
mkdir "%TEMP_DIR%\backups"
echo    [OK] Directories created
echo.

echo [5/6] Copying files...

REM Copy backend (excluding dev files)
xcopy /E /I /Y /Q "backend\app" "%TEMP_DIR%\backend\app" > nul
xcopy /E /I /Y /Q "backend\bootstrap" "%TEMP_DIR%\backend\bootstrap" > nul
xcopy /E /I /Y /Q "backend\config" "%TEMP_DIR%\backend\config" > nul
xcopy /E /I /Y /Q "backend\database" "%TEMP_DIR%\backend\database" > nul
xcopy /E /I /Y /Q "backend\lang" "%TEMP_DIR%\backend\lang" > nul
xcopy /E /I /Y /Q "backend\public" "%TEMP_DIR%\backend\public" > nul
xcopy /E /I /Y /Q "backend\resources" "%TEMP_DIR%\backend\resources" > nul
xcopy /E /I /Y /Q "backend\routes" "%TEMP_DIR%\backend\routes" > nul
xcopy /E /I /Y /Q "backend\storage" "%TEMP_DIR%\backend\storage" > nul
xcopy /E /I /Y /Q "backend\vendor" "%TEMP_DIR%\backend\vendor" > nul

REM Copy backend root files
copy /Y "backend\artisan" "%TEMP_DIR%\backend\" > nul
copy /Y "backend\composer.json" "%TEMP_DIR%\backend\" > nul
copy /Y "backend\composer.lock" "%TEMP_DIR%\backend\" > nul
copy /Y "backend\.env.example" "%TEMP_DIR%\backend\" > nul
copy /Y "backend\.htaccess" "%TEMP_DIR%\backend\" > nul 2>nul

REM Copy built frontend to backend public
xcopy /E /I /Y /Q "frontend\dist\*" "%TEMP_DIR%\backend\public\" > nul

REM Copy bat files
copy /Y "bat\INSTALL.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\Run-System.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\Stop-System.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\Start-Server-Only.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\background-start.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\update.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\Reset-Admin.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\Enable-AutoStart.bat" "%TEMP_DIR%\bat\" > nul
copy /Y "bat\Disable-AutoStart.bat" "%TEMP_DIR%\bat\" > nul

REM Create root shortcuts
echo @echo off > "%TEMP_DIR%\INSTALL.bat"
echo cd /d "%%~dp0bat" >> "%TEMP_DIR%\INSTALL.bat"
echo call INSTALL.bat >> "%TEMP_DIR%\INSTALL.bat"

echo @echo off > "%TEMP_DIR%\START.bat"
echo cd /d "%%~dp0bat" >> "%TEMP_DIR%\START.bat"
echo call Run-System.bat >> "%TEMP_DIR%\START.bat"

echo @echo off > "%TEMP_DIR%\STOP.bat"
echo cd /d "%%~dp0bat" >> "%TEMP_DIR%\STOP.bat"
echo call Stop-System.bat >> "%TEMP_DIR%\STOP.bat"

echo @echo off > "%TEMP_DIR%\UPDATE.bat"
echo cd /d "%%~dp0bat" >> "%TEMP_DIR%\UPDATE.bat"
echo call update.bat >> "%TEMP_DIR%\UPDATE.bat"

echo    [OK] Files copied
echo.

echo [6/6] Cleaning up and creating ZIP...

REM Clean sensitive and dev files
if exist "%TEMP_DIR%\backend\.env" del /q "%TEMP_DIR%\backend\.env"
if exist "%TEMP_DIR%\backend\storage\logs\*.log" del /q "%TEMP_DIR%\backend\storage\logs\*.log" 2>nul
if exist "%TEMP_DIR%\backend\storage\framework\cache\data\*" rmdir /s /q "%TEMP_DIR%\backend\storage\framework\cache\data" 2>nul
mkdir "%TEMP_DIR%\backend\storage\framework\cache\data" 2>nul

REM Create ZIP
if exist "%PROJECT_DIR%\%ZIP_NAME%" del /q "%PROJECT_DIR%\%ZIP_NAME%"
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%PROJECT_DIR%\%ZIP_NAME%' -Force"

if exist "%PROJECT_DIR%\%ZIP_NAME%" (
    echo.
    echo ========================================================
    echo            Package Ready!
    echo ========================================================
    echo.
    echo File: %ZIP_NAME%
    echo Location: %PROJECT_DIR%
    echo.
    
    REM Show file size
    for %%A in ("%PROJECT_DIR%\%ZIP_NAME%") do (
        set /a SIZE=%%~zA / 1048576
        echo Size: !SIZE! MB
    )
    echo.
    echo Ready to send to client!
    echo.
) else (
    echo    [X] Failed to create package
)

REM Cleanup temp directory
rmdir /s /q "%TEMP_DIR%" 2>nul

pause
