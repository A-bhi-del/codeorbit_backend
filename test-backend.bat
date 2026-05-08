@echo off
echo ========================================
echo   Testing Backend Connection
echo ========================================
echo.

echo Checking if backend is running on port 5000...
echo.

curl -s http://localhost:5000/api/auth/check >nul 2>&1

if %errorlevel% equ 0 (
    echo [SUCCESS] Backend is RUNNING on port 5000!
    echo.
    echo Next steps:
    echo 1. Hard refresh browser: Ctrl + Shift + R
    echo 2. Try accepting friend request again
    echo.
) else (
    echo [ERROR] Backend is NOT running!
    echo.
    echo To start backend:
    echo 1. cd codeorbit_backend
    echo 2. npm run dev
    echo 3. Wait for "Server running on port 5000"
    echo.
)

pause
