@echo off
chcp 65001 >nul
title Create Distribution Package
color 0E

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║              Create Customer Distribution Package                ║
echo ║                  إنشاء حزمة التوزيع للزبون                       ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Get the parent directory (POS root)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "SOURCE_DIR=%%~fI\"
set "DIST_DIR=%SOURCE_DIR%dist"
set "PACKAGE_NAME=POS-System"
set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%"

echo Source directory: %SOURCE_DIR%
echo Distribution directory: %DIST_DIR%
echo.

:: Create dist directory
if exist "%DIST_DIR%" rmdir /S /Q "%DIST_DIR%"
mkdir "%DIST_DIR%\%PACKAGE_NAME%"

echo [1/6] Copying backend files...
echo [1/6] نسخ ملفات الخلفية...

:: Copy backend (excluding development files)
xcopy /E /I /Y "%SOURCE_DIR%backend" "%DIST_DIR%\%PACKAGE_NAME%\backend" ^
    /EXCLUDE:%SCRIPT_DIR%exclude-list.txt >nul 2>&1

if not exist "%SCRIPT_DIR%exclude-list.txt" (
    :: Create exclude list if not exists
    echo .git> "%SCRIPT_DIR%exclude-list.txt"
    echo node_modules>> "%SCRIPT_DIR%exclude-list.txt"
    echo .env>> "%SCRIPT_DIR%exclude-list.txt"
    echo tests>> "%SCRIPT_DIR%exclude-list.txt"
    echo .phpunit>> "%SCRIPT_DIR%exclude-list.txt"
    echo storage\logs\>> "%SCRIPT_DIR%exclude-list.txt"
    echo storage\framework\cache\>> "%SCRIPT_DIR%exclude-list.txt"
    echo storage\framework\sessions\>> "%SCRIPT_DIR%exclude-list.txt"
    echo storage\framework\views\>> "%SCRIPT_DIR%exclude-list.txt"
    
    :: Retry copy with exclude list
    xcopy /E /I /Y "%SOURCE_DIR%backend" "%DIST_DIR%\%PACKAGE_NAME%\backend" ^
        /EXCLUDE:%SCRIPT_DIR%exclude-list.txt >nul 2>&1
)

:: Copy .env.example
copy "%SOURCE_DIR%backend\.env.example" "%DIST_DIR%\%PACKAGE_NAME%\backend\.env.example" >nul

echo    Backend files copied
echo.

echo [2/6] Building frontend for production...
echo [2/6] بناء الواجهة للإنتاج...

cd /d "%SOURCE_DIR%frontend"
call npm run build >nul 2>&1

if exist "dist" (
    :: Copy built frontend to backend public
    xcopy /E /I /Y "dist\*" "%DIST_DIR%\%PACKAGE_NAME%\backend\public" >nul
    echo    Frontend built and deployed
) else (
    echo    [WARNING] Frontend build failed, copying source files
    xcopy /E /I /Y "%SOURCE_DIR%frontend\dist" "%DIST_DIR%\%PACKAGE_NAME%\backend\public" >nul 2>&1
)

echo.

echo [3/6] Creating directory structure...
echo [3/6] إنشاء هيكل المجلدات...

mkdir "%DIST_DIR%\%PACKAGE_NAME%\backups" 2>nul
mkdir "%DIST_DIR%\%PACKAGE_NAME%\logs" 2>nul
mkdir "%DIST_DIR%\%PACKAGE_NAME%\backend\storage\logs" 2>nul
mkdir "%DIST_DIR%\%PACKAGE_NAME%\backend\storage\framework\cache" 2>nul
mkdir "%DIST_DIR%\%PACKAGE_NAME%\backend\storage\framework\sessions" 2>nul
mkdir "%DIST_DIR%\%PACKAGE_NAME%\backend\storage\framework\views" 2>nul
mkdir "%DIST_DIR%\%PACKAGE_NAME%\backend\bootstrap\cache" 2>nul

echo    Directory structure created
echo.

echo [4/6] Copying scripts and documentation...
echo [4/6] نسخ السكربتات والتوثيق...

:: Copy installation scripts
copy "%SOURCE_DIR%install.bat" "%DIST_DIR%\%PACKAGE_NAME%\" >nul
copy "%SOURCE_DIR%update.bat" "%DIST_DIR%\%PACKAGE_NAME%\" >nul
copy "%SOURCE_DIR%start.bat" "%DIST_DIR%\%PACKAGE_NAME%\" >nul
copy "%SOURCE_DIR%INSTALLATION_GUIDE.md" "%DIST_DIR%\%PACKAGE_NAME%\" >nul

:: Copy PowerShell scripts
mkdir "%DIST_DIR%\%PACKAGE_NAME%\scripts" 2>nul
copy "%SOURCE_DIR%scripts\Install-POS.ps1" "%DIST_DIR%\%PACKAGE_NAME%\scripts\" >nul

echo    Scripts copied
echo.

echo [5/6] Creating version file...
echo [5/6] إنشاء ملف الإصدار...

:: Copy version file
if exist "%SOURCE_DIR%backend\version.json" (
    copy "%SOURCE_DIR%backend\version.json" "%DIST_DIR%\%PACKAGE_NAME%\backend\" >nul
)

echo    Version file created
echo.

echo [6/6] Creating ZIP archive...
echo [6/6] إنشاء ملف ZIP...

cd /d "%DIST_DIR%"

:: Use PowerShell to create ZIP
powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%' -DestinationPath '%PACKAGE_NAME%-%TIMESTAMP%.zip' -Force"

if exist "%PACKAGE_NAME%-%TIMESTAMP%.zip" (
    echo.
    echo ╔══════════════════════════════════════════════════════════════════╗
    echo ║                Package Created Successfully!                     ║
    echo ║                   تم إنشاء الحزمة بنجاح!                         ║
    echo ╚══════════════════════════════════════════════════════════════════╝
    echo.
    echo Package location:
    echo %DIST_DIR%\%PACKAGE_NAME%-%TIMESTAMP%.zip
    echo.
    echo Package contents:
    echo محتويات الحزمة:
    echo   - backend/          : Laravel application
    echo   - backups/          : Backup directory
    echo   - logs/             : Log directory
    echo   - scripts/          : Installation scripts
    echo   - install.bat       : Installation wizard
    echo   - update.bat        : Update script
    echo   - start.bat         : Application launcher
    echo   - INSTALLATION_GUIDE.md : Installation guide
    echo.
) else (
    echo [ERROR] Failed to create ZIP archive
)

:: Open dist folder
explorer "%DIST_DIR%"

cd /d "%SOURCE_DIR%"
pause
