@echo off
echo.
echo ========================================
echo   KLSB Timesheet System - Starting...
echo ========================================
echo.
start "KLSB Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "KLSB Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Backend Server: http://localhost:5000
echo Frontend Server: http://localhost:3000
echo.
echo Check the separate windows for server logs.
echo.
