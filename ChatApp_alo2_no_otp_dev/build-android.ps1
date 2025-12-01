#!/usr/bin/env pwsh
# Build Android APK Release Script
# Usage: .\build-android.ps1

Write-Host "🚀 Starting Android APK Build..." -ForegroundColor Green
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

Write-Host "🔨 Step 2/3: Building Release APK..." -ForegroundColor Cyan
.\gradlew app:assembleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Build completed" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step 3/3: Checking output..." -ForegroundColor Cyan

$apkPath = "app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $apkInfo = Get-Item $apkPath
    $sizeInMB = [math]::Round($apkInfo.Length / 1MB, 2)
    
    Write-Host "✅ APK built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 APK Location:" -ForegroundColor Yellow
    Write-Host "   $(Resolve-Path $apkPath)" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 APK Size: $sizeInMB MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🎉 Build complete! You can now install the APK on your device." -ForegroundColor Green
} else {
    Write-Host "❌ APK not found at expected location!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Return to project root
Set-Location ..

Write-Host ""
Write-Host "📱 To install on device via ADB:" -ForegroundColor Cyan
Write-Host "   adb install android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
Write-Host ""
