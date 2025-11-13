# Create Admin User Script
# Run this after the backend server is running

Write-Host "Creating Admin User..." -ForegroundColor Green

$body = @{
    email = "admin@example.com"
    password = "admin123"
    firstName = "Admin"
    lastName = "User"
    role = "admin"
    department = "IT"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "`n✅ Admin user created successfully!" -ForegroundColor Green
    Write-Host "`nLogin Credentials:" -ForegroundColor Cyan
    Write-Host "Email: admin@example.com" -ForegroundColor Yellow
    Write-Host "Password: admin123" -ForegroundColor Yellow
    Write-Host "`nYou can now login to the web app at http://localhost:3000" -ForegroundColor Gray
}
catch {
    Write-Host "`n❌ Error creating admin user:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Message -like "*ConnectFailure*" -or $_.Exception.Message -like "*refused*") {
        Write-Host "`nMake sure the backend server is running on http://localhost:5000" -ForegroundColor Yellow
        Write-Host "Run: cd backend; npm run dev" -ForegroundColor Yellow
    }
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
