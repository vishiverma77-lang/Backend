# PowerShell script to update the backend from remote repository
# Target: https://github.com/vishiverma77-lang/Backend

Write-Host "Starting backend repository update..." -ForegroundColor Cyan

# 1. Ensure we are in the correct directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $ScriptDir
Write-Host "Working directory: $ScriptDir" -ForegroundColor Green

# 2. Backup .env file if it exists and hasn't been backed up yet
if (Test-Path -Path ".env") {
    if (-not (Test-Path -Path ".env.bak")) {
        Copy-Item -Path ".env" -Destination ".env.bak" -Force
        Write-Host "Backed up .env to .env.bak" -ForegroundColor Green
    } else {
        Write-Host ".env.bak already exists, skipping backup" -ForegroundColor Yellow
    }
} else {
    Write-Host "Warning: No .env file found to backup!" -ForegroundColor Yellow
}

# 3. Initialize git if not already initialized
if (-not (Test-Path -Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Green
    git init
}

# 4. Check/Set remote origin URL
$RemoteUrl = "https://github.com/vishiverma77-lang/Backend"
$CurrentRemote = git remote get-url origin 2>$null
if ($null -eq $CurrentRemote) {
    Write-Host "Adding remote origin: $RemoteUrl" -ForegroundColor Green
    git remote add origin $RemoteUrl
} else {
    Write-Host "Updating remote origin to: $RemoteUrl" -ForegroundColor Green
    git remote set-url origin $RemoteUrl
}

# 5. Fetch latest changes
Write-Host "Fetching changes from remote..." -ForegroundColor Green
git fetch origin

# 6. Detect default branch (main or master)
$Branches = git branch -r
$DefaultBranch = "main"
if ($Branches -match "origin/master") {
    $DefaultBranch = "master"
}
Write-Host "Detected remote default branch: $DefaultBranch" -ForegroundColor Green

# 7. Reset local repository to match remote
Write-Host "Resetting local files to match remote branch: $DefaultBranch..." -ForegroundColor Green
git reset --hard "origin/$DefaultBranch"

# 8. Restore .env file
if (Test-Path -Path ".env.bak") {
    Copy-Item -Path ".env.bak" -Destination ".env" -Force
    Write-Host "Restored .env from backup" -ForegroundColor Green
}

# 9. Install dependencies
if (Test-Path -Path "package.json") {
    Write-Host "Running npm install..." -ForegroundColor Green
    npm install
}

Write-Host "Backend update completed successfully!" -ForegroundColor Green
