@echo off

echo.
echo ========================================================
echo        Preparing Client Package
echo ========================================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

set "TEMP_DIR=%TEMP%\car-dealer-ship-client"
set "ZIP_NAME=car-dealer-ship-client.zip"

echo [1/5] Installing Backend dependencies...
cd Backend
if not exist "vendor" (
    composer install --no-dev --optimize-autoloader
    if errorlevel 1 (
        echo    [X] Composer install failed
        pause
        exit /b 1
    )
)
cd ..
echo    [OK] Backend dependencies ready
echo.

echo [2/5] Building frontend...
cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo    [X] Build failed
    pause
    exit /b 1
)
cd ..
echo    [OK] Frontend built
echo.

echo [3/5] Copying files...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

xcopy /E /I /Y /Q "%PROJECT_DIR%Backend" "%TEMP_DIR%\Backend" > nul
xcopy /E /I /Y /Q "%PROJECT_DIR%frontend\dist" "%TEMP_DIR%\Backend\public" > nul
xcopy /E /I /Y /Q "%PROJECT_DIR%git" "%TEMP_DIR%\git" > nul

copy /Y "%PROJECT_DIR%INSTALL.bat" "%TEMP_DIR%\" > nul
copy /Y "%PROJECT_DIR%START.bat" "%TEMP_DIR%\" > nul
copy /Y "%PROJECT_DIR%update.bat" "%TEMP_DIR%\" > nul

echo    [OK] Files copied
echo.

echo [4/5] Cleaning up...
if exist "%TEMP_DIR%\Backend\.env" del /q "%TEMP_DIR%\Backend\.env"
if exist "%TEMP_DIR%\Backend\storage\logs\*.*" del /q "%TEMP_DIR%\Backend\storage\logs\*.*" 2>nul

echo    [OK] Cleaned
echo.

echo [5/5] Creating package...
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%PROJECT_DIR%\%ZIP_NAME%' -Force" 2>nul

if exist "%PROJECT_DIR%\%ZIP_NAME%" (
    echo.
    echo ========================================================
    echo          Package Ready!
    echo ========================================================
    echo.
    echo File: %ZIP_NAME%
    echo Location: %PROJECT_DIR%
    echo.
    echo Ready to send to client!
    echo.
) else (
    echo    [X] Failed to create package
)

rmdir /s /q "%TEMP_DIR%" 2>nul
pause
