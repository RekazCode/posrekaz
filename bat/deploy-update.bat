@echo off
echo.
echo ========================================================
echo        Deploying Update to Clients
echo ========================================================
echo.

echo [1/3] Building Frontend...
cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo    [X] Build failed!
    pause
    exit /b 1
)
cd ..
echo    [OK] Frontend built successfully
echo.

echo [2/3] Copying files to Backend...
xcopy /E /I /Y /Q "frontend\dist" "Backend\public" > nul
echo    [OK] Files copied to Backend/public
echo.

echo [3/3] Pushing to GitHub...
git add Backend/public
git commit -m "System Update: Frontend Rebuild"
git push origin main

if errorlevel 1 (
    echo    [X] Git push failed!
    echo        Make sure you are logged in to GitHub.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo        Update Deployed Successfully!
echo ========================================================
echo.
echo Clients can now use the "System Update" button.
echo.
pause
