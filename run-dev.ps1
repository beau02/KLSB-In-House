# Start both backend and frontend servers
Write-Host "=== Starting Timesheet System ===" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '=== BACKEND SERVER ===' -ForegroundColor Green; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '=== FRONTEND SERVER ===' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "=== System Started ===" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit and stop all servers..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop all node processes when script exits
Write-Host "Stopping servers..." -ForegroundColor Red
Get-Process | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process -Force
Write-Host "All servers stopped." -ForegroundColor Red
