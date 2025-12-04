# MongoDB to Atlas Migration Script
# This script exports data from local MongoDB and imports to Atlas

# Configuration
$LOCAL_DB = "timesheet_db"
$BACKUP_DIR = ".\mongodb-backup"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_PATH = "$BACKUP_DIR\$TIMESTAMP"

# Atlas connection string (YOU MUST UPDATE THIS)
$ATLAS_URI = "mongodb+srv://klsbadmin:klsb%40kl%248kl%248@timesheet.ppqcalt.mongodb.net/?appName=Timesheet"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB to Atlas Migration Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Atlas URI is configured
if ($ATLAS_URI -eq "mongodb+srv://username:password@cluster.mongodb.net/") {
    Write-Host "ERROR: Please update the ATLAS_URI variable with your actual Atlas connection string" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your Atlas connection string:" -ForegroundColor Yellow
    Write-Host "1. Go to MongoDB Atlas Dashboard" -ForegroundColor Yellow
    Write-Host "2. Click 'Connect' on your cluster" -ForegroundColor Yellow
    Write-Host "3. Choose 'Connect your application'" -ForegroundColor Yellow
    Write-Host "4. Copy the connection string" -ForegroundColor Yellow
    Write-Host "5. Replace username and password with your credentials" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Step 1: Create backup directory
Write-Host "[Step 1/4] Creating backup directory..." -ForegroundColor Green
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}
New-Item -ItemType Directory -Path $BACKUP_PATH | Out-Null
Write-Host "Backup directory created: $BACKUP_PATH" -ForegroundColor White
Write-Host ""

# Step 2: Export from local MongoDB
Write-Host "[Step 2/4] Exporting data from local MongoDB..." -ForegroundColor Green
Write-Host "Database: $LOCAL_DB" -ForegroundColor White
Write-Host "This may take a few minutes depending on your data size..." -ForegroundColor Yellow
Write-Host ""

$exportCmd = "mongodump --uri=`"mongodb://localhost:27017/$LOCAL_DB`" --out=`"$BACKUP_PATH`""
Write-Host "Running: $exportCmd" -ForegroundColor DarkGray
Invoke-Expression $exportCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to export data from local MongoDB" -ForegroundColor Red
    Write-Host "Make sure MongoDB is running on localhost:27017" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Export completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Show backup size
Write-Host "[Step 3/4] Backup Information" -ForegroundColor Green
$backupSize = (Get-ChildItem -Path $BACKUP_PATH -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)
Write-Host "Backup size: $backupSizeMB MB" -ForegroundColor White
Write-Host "Backup location: $BACKUP_PATH" -ForegroundColor White
Write-Host ""

# Step 4: Import to Atlas
Write-Host "[Step 4/4] Importing data to MongoDB Atlas..." -ForegroundColor Green
Write-Host "Target: Atlas Cluster" -ForegroundColor White
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

$importCmd = "mongorestore --uri=`"$ATLAS_URI`" `"$BACKUP_PATH/$LOCAL_DB`" --db=$LOCAL_DB --drop"
Write-Host "Running: mongorestore --uri=`"<hidden>`" ..." -ForegroundColor DarkGray
Invoke-Expression $importCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to import data to Atlas" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Invalid Atlas connection string" -ForegroundColor Yellow
    Write-Host "- Wrong username/password" -ForegroundColor Yellow
    Write-Host "- Network connectivity issues" -ForegroundColor Yellow
    Write-Host "- IP whitelist not configured in Atlas" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your backup is safe at: $BACKUP_PATH" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env file with the Atlas connection string:" -ForegroundColor White
Write-Host "   MONGODB_URI=$ATLAS_URI$LOCAL_DB" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Restart your application to use Atlas" -ForegroundColor White
Write-Host ""
Write-Host "3. Verify data in Atlas Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Backup retained at: $BACKUP_PATH" -ForegroundColor DarkGray
Write-Host ""
