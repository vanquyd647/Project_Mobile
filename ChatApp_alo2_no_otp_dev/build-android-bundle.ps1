#!/usr/bin/env pwsh
# Build Android Bundle (AAB) for Google Play Store
# Usage: .\build-android-bundle.ps1

Write-Host "🚀 Starting Android Bundle Build..." -ForegroundColor Green
Write-Host ""

# Check if android directory exists
if (-Not (Test-Path "android")) {
    Write-Host "❌ Error: android directory not found!" -ForegroundColor Red
    exit 1
}

# Navigate to android directory
Set-Location android

Write-Host "📦 Step 1/3: Cleaning previous builds..." -ForegroundColor Cyan
.\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Clean failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Clean completed" -ForegroundColor Green
Write-Host ""

Write-Host "🔨 Step 2/3: Building Release Bundle (AAB)..." -ForegroundColor Cyan
.\gradlew app:bundleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Build completed" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step 3/3: Checking output..." -ForegroundColor Cyan

$aabPath = "app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $aabInfo = Get-Item $aabPath
    $sizeInMB = [math]::Round($aabInfo.Length / 1MB, 2)
    
    Write-Host "✅ AAB built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 AAB Location:" -ForegroundColor Yellow
    Write-Host "   $(Resolve-Path $aabPath)" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 AAB Size: $sizeInMB MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🎉 Build complete! You can now upload this to Google Play Store." -ForegroundColor Green
} else {
    Write-Host "❌ AAB not found at expected location!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Return to project root
Set-Location ..

Write-Host ""
Write-Host "📤 To upload to Google Play Console:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://play.google.com/console" -ForegroundColor White
Write-Host "   2. Select your app" -ForegroundColor White
Write-Host "   3. Production > Create new release" -ForegroundColor White
Write-Host "   4. Upload: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor White
Write-Host ""
