param(
    [string]$RepoName = "calorie-tracker",
    [switch]$Private = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " NutriLog: Auto-Create & Push to GitHub   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Initialize git if not present
Write-Host "`n>>> [1/5] Checking Git repository..." -ForegroundColor Cyan
if (-not (Test-Path ".git")) {
    git init -b main
    Write-Host "Initialized local git repository on branch 'main'." -ForegroundColor Green
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Green
}

# 2. Stage and commit changes
Write-Host "`n>>> [2/5] Staging and committing all project files..." -ForegroundColor Cyan
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "Auto-commit: update project files"
    Write-Host "Committed changes." -ForegroundColor Green
} else {
    Write-Host "Working tree clean; no new uncommitted changes." -ForegroundColor Green
}

# 3. Retrieve GitHub credentials from Windows Credential Manager
Write-Host "`n>>> [3/5] Resolving GitHub credentials..." -ForegroundColor Cyan
$credInput = "protocol=https`nhost=github.com`n"
$credOutput = $credInput | git credential fill
$token = ""
$username = ""

foreach ($line in ($credOutput -split "`n")) {
    $cleanLine = $line.Trim()
    if ($cleanLine -like "username=*") {
        $username = $cleanLine.Substring(9).Trim()
    }
    if ($cleanLine -like "password=*") {
        $token = $cleanLine.Substring(9).Trim()
    }
}

if (-not $token -or -not $username) {
    Write-Error "Could not retrieve GitHub credentials from Git Credential Manager."
    exit 1
}
Write-Host "Authenticated as GitHub user: $username" -ForegroundColor Green

# 4. Automatically create remote repository via GitHub API if not exists
Write-Host "`n>>> [4/5] Ensuring remote repository '$username/$RepoName' exists on GitHub..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "AutoPublishScript"
}

$repoUrl = "https://github.com/$username/$RepoName.git"
$webUrl = "https://github.com/$username/$RepoName"

try {
    $null = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName" -Headers $headers -Method Get -ErrorAction Stop
    Write-Host "Remote repository already exists: $webUrl" -ForegroundColor Green
} catch {
    Write-Host "Creating public repository '$RepoName' on GitHub..." -ForegroundColor Yellow
    $body = @{
        name        = $RepoName
        description = "A vanilla HTML, CSS, and JavaScript calorie & macro tracker with persistent browser storage."
        private     = [bool]$Private
    } | ConvertTo-Json

    try {
        $res = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json"
        Write-Host "Successfully created public repository: $($res.html_url)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create repository: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 5. Link remote and push automatically
Write-Host "`n>>> [5/5] Linking remote 'origin' and pushing code..." -ForegroundColor Cyan
$currentRemote = git remote get-url origin 2>$null
if (-not $currentRemote) {
    git remote add origin $repoUrl
} else {
    git remote set-url origin $repoUrl
}

$currentBranch = (git branch --show-current).Trim()
if (-not $currentBranch) { $currentBranch = "main" }

git push -u origin $currentBranch

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " SUCCESS! Everything created & pushed:    " -ForegroundColor Green
Write-Host " $webUrl" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
