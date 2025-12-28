@echo off
echo.
echo ========================================================
echo        Resetting Admin Password
echo ========================================================
echo.

cd /d "%~dp0\Backend"

echo Resetting user: admin@example.com
echo Password: password123
echo.

php artisan tinker --execute="$u = App\Models\User::where('email', 'admin@example.com')->first(); if(!$u) { $u = new App\Models\User; $u->email = 'admin@example.com'; $u->name = 'Admin User'; } $u->password = bcrypt('password123'); $u->save(); echo 'Done.';"

if %errorlevel% equ 0 (
    echo.
    echo    [OK] Password reset successfully!
) else (
    echo.
    echo    [X] Failed to reset password.
)

echo.
pause