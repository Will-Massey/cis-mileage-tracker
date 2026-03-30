# Render Deployment Script for CIS Mileage Tracker
# Run from project root: .\scripts\deploy-render.ps1

param(
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$OnlyBackend,
    [switch]$OnlyFrontend
)

$ErrorActionPreference = "Stop"

Write-Host "=== CIS Mileage Tracker - Render Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed"
    exit 1
}

# Get git info
$branch = git rev-parse --abbrev-ref HEAD
$commit = git rev-parse --short HEAD

Write-Host "Current branch: $branch" -ForegroundColor Yellow
Write-Host "Current commit: $commit" -ForegroundColor Yellow
Write-Host ""

# Build verification
if (-not $SkipBuild) {
    Write-Host "=== Building Frontend ===" -ForegroundColor Green
    Set-Location frontend
    
    if (-not (Test-Path node_modules)) {
        Write-Host "Installing dependencies..."
        npm install
    }
    
    Write-Host "Building production bundle..."
    npm run build
    
    if (-not $?) {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    Set-Location ..
    Write-Host "Frontend build successful!" -ForegroundColor Green
    Write-Host ""
}

# Backend verification
if (-not $OnlyFrontend) {
    Write-Host "=== Verifying Backend ===" -ForegroundColor Green
    Set-Location backend
    
    if (-not (Test-Path node_modules)) {
        Write-Host "Installing dependencies..."
        npm install
    }
    
    Write-Host "Generating Prisma client..."
    npx prisma generate
    
    Set-Location ..
    Write-Host "Backend verification complete!" -ForegroundColor Green
    Write-Host ""
}

# Git push
if (-not $SkipPush) {
    Write-Host "=== Pushing to GitHub ===" -ForegroundColor Green
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "Uncommitted changes detected. Committing..." -ForegroundColor Yellow
        git add .
        git commit -m "Deploy: Mobile features + GPS tracking [skip ci]"
    }
    
    Write-Host "Pushing to origin/$branch..."
    git push origin $branch
    
    if (-not $?) {
        Write-Error "Git push failed"
        exit 1
    }
    
    Write-Host "Push successful!" -ForegroundColor Green
    Write-Host ""
}

# Deployment summary
Write-Host "=== Deployment Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend will auto-deploy from: https://github.com/<your-repo>" -ForegroundColor White
Write-Host "Frontend will auto-deploy from: https://github.com/<your-repo>" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Monitor the deployment logs" -ForegroundColor White
Write-Host "3. Once deployed, visit: https://mileage-tracker.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "Mobile testing:" -ForegroundColor Yellow
Write-Host "1. cd mobile && npm install" -ForegroundColor White
Write-Host "2. npm run build" -ForegroundColor White
Write-Host "3. npx cap sync" -ForegroundColor White
Write-Host "4. npx cap open android (or ios)" -ForegroundColor White
Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
