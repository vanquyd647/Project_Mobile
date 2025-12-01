#!/usr/bin/env pwsh
# Install APK on connected Android device
# Usage: .\install-android.ps1 [release|debug]

param(
    [Parameter(Position=0)]
    [ValidateSet('release', 'debug')]
    [string]$BuildType = 'release'
)

Write-Host "📱 Installing APK on Android device..." -ForegroundColor Green
Write-Host ""

# Determine APK path based on build type
if ($BuildType -eq 'release') {
    $apkPath = "android\app\build\outputs\apk\release\app-release.apk"
} else {
    $apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
}

# Check if APK exists
if (-Not (Test-Path $apkPath)) {
    Write-Host "❌ APK not found at: $apkPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please build the APK first:" -ForegroundColor Yellow
    if ($BuildType -eq 'release') {
        Write-Host "   .\build-android.ps1" -ForegroundColor White
    } else {
        Write-Host "   .\build-android-debug.ps1" -ForegroundColor White
    }
    exit 1
}

# Check if ADB is available
$adbCommand = Get-Command adb -ErrorAction SilentlyContinue
if (-Not $adbCommand) {
    Write-Host "❌ ADB not found in PATH!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android SDK Platform Tools:" -ForegroundColor Yellow
    Write-Host "   https://developer.android.com/studio/releases/platform-tools" -ForegroundColor White
    exit 1
}

# Check for connected devices
Write-Host "🔍 Checking for connected devices..." -ForegroundColor Cyan
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\t' }

if (-Not $devices) {
    Write-Host "❌ No Android devices found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "   1. Connect your Android device via USB" -ForegroundColor White
    Write-Host "   2. Enable USB Debugging on your device" -ForegroundColor White
    Write-Host "   3. Run 'adb devices' to verify connection" -ForegroundColor White
    exit 1
}

Write-Host "✅ Device found" -ForegroundColor Green
Write-Host ""

# Install APK
Write-Host "📦 Installing APK..." -ForegroundColor Cyan
adb install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ APK installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 You can now open the app on your device." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "   1. Uninstall the app from your device first" -ForegroundColor White
    Write-Host "   2. Run: adb uninstall com.yourdomain.chatlofi" -ForegroundColor White
    Write-Host "   3. Then try installing again" -ForegroundColor White
    exit 1
}
