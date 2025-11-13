@echo off
echo Starting Backend and Frontend...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
