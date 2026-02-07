@echo off
echo ============================================
echo   VISITOR MANAGEMENT - SERVER STARTER
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download from: https://nodejs.org
    pause
    exit /b 1
)

:: Check if PM2 is installed
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing PM2 globally...
    npm install -g pm2
    echo.
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    echo.
)

:: Create logs directory
if not exist "logs" mkdir logs

:: Stop existing instance (if running)
pm2 delete visitor-api >nul 2>nul

:: Start with PM2
echo [INFO] Starting Visitor Management API...
pm2 start ecosystem.config.js
echo.

:: Save PM2 process list
pm2 save
echo.

echo ============================================
echo   SERVER STARTED SUCCESSFULLY!
echo ============================================
echo.
echo   API URL:     http://localhost:3001/api
echo   Health:      http://localhost:3001/api/health
echo.
echo   View Logs:   pm2 logs visitor-api
echo   Monitor:     pm2 monit
echo   Stop:        pm2 stop visitor-api
echo   Restart:     pm2 restart visitor-api
echo.
echo   To auto-start on Windows boot:
echo   pm2-startup install
echo   pm2 save
echo.
echo ============================================
pause
