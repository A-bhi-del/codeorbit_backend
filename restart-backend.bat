@echo off
echo ========================================
echo   CodeOrbit Backend Restart Script
echo ========================================
echo.
echo Stopping any running backend processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *codeorbit_backend*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
echo.
cd /d "%~dp0"
npm run dev
