# Start All Services Script
# This script starts the backend, web frontend, and mobile app in separate PowerShell windows

Write-Host "Starting KLSB Timesheet Management System..." -ForegroundColor Green

# Start Backend
Write-Host "`nStarting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\User\Desktop\KLSB-In-House\backend'; Write-Host 'Backend Server' -ForegroundColor Green; npm run dev"

# Wait a bit for backend to initialize
Start-Sleep -Seconds 3

# Start Web Frontend
Write-Host "Starting Web Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\User\Desktop\KLSB-In-House\web-frontend'; Write-Host 'Web Frontend' -ForegroundColor Green; npm run dev"

# Start Mobile App
Write-Host "Starting Mobile App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\User\Desktop\KLSB-In-House\mobile-app'; Write-Host 'Mobile App' -ForegroundColor Green; npm start"

Write-Host "`n✅ All services are starting in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Web App: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Mobile: Scan QR code in Expo window" -ForegroundColor Yellow
Write-Host "`nPress any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
