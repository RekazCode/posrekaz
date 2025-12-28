@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================================
echo        POS System - Reset Admin Password
echo ========================================================
echo.

REM Change to backend directory
cd /d "%~dp0..\backend"

echo Resetting admin password...
echo.
echo    Email: admin@pos.local
echo    New Password: password
echo.

php artisan tinker --execute="$u = App\Models\User::where('email', 'admin@pos.local')->first(); if(!$u) { $u = App\Models\User::first(); if(!$u) { echo 'No users found. Run php artisan db:seed first.'; exit; } } $u->password = bcrypt('password'); $u->is_active = true; $u->save(); echo 'Password reset for: ' . $u->email;"

if %errorlevel% equ 0 (
    echo.
    echo    [OK] Password reset successfully!
    echo.
    echo    You can now login with:
    echo      Email: admin@pos.local (or the first user's email)
    echo      Password: password
) else (
    echo.
    echo    [X] Failed to reset password.
    echo        Make sure the database is set up correctly.
)

echo.
pause
