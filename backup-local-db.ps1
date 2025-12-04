# Backup Local MongoDB Script
# Use this to create a backup before migration

$LOCAL_DB = "timesheet_db"
$BACKUP_DIR = ".\mongodb-backup"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_PATH = "$BACKUP_DIR\$TIMESTAMP"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Backup Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory
Write-Host "Creating backup directory..." -ForegroundColor Green
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}
New-Item -ItemType Directory -Path $BACKUP_PATH | Out-Null

# Backup
Write-Host "Backing up database: $LOCAL_DB" -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

mongodump --uri="mongodb://localhost:27017/$LOCAL_DB" --out="$BACKUP_PATH"

if ($LASTEXITCODE -eq 0) {
    $backupSize = (Get-ChildItem -Path $BACKUP_PATH -Recurse | Measure-Object -Property Length -Sum).Sum
    $backupSizeMB = [math]::Round($backupSize / 1MB, 2)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backup size: $backupSizeMB MB" -ForegroundColor White
    Write-Host "Location: $BACKUP_PATH" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Backup failed" -ForegroundColor Red
    Write-Host "Make sure MongoDB is running on localhost:27017" -ForegroundColor Yellow
    exit 1
}
