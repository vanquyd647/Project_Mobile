# 🔨 Build Scripts

Collection of PowerShell scripts to build and install the Android app.

## 📱 Build Scripts

### 1. Build Release APK
```powershell
.\build-android.ps1
```
- Builds production-ready APK
- Output: `android\app\build\outputs\apk\release\app-release.apk`
- Use this for distribution/testing

### 2. Build Debug APK
```powershell
.\build-android-debug.ps1
```
- Builds debug version with debugging enabled
- Output: `android\app\build\outputs\apk\debug\app-debug.apk`
- Faster build, includes debug symbols

### 3. Build Android Bundle (AAB)
```powershell
.\build-android-bundle.ps1
```
- Builds Android App Bundle for Google Play Store
- Output: `android\app\build\outputs\bundle\release\app-release.aab`
- Required for Play Store uploads

## 📲 Install Script

### Install APK on Device
```powershell
# Install release APK
.\install-android.ps1

# Install debug APK
.\install-android.ps1 debug
```

**Requirements:**
- Android device connected via USB
- USB Debugging enabled
- ADB (Android Debug Bridge) installed

## 🔧 Manual Commands

If you prefer manual commands:

### Build Release APK
```powershell
cd android
.\gradlew clean
.\gradlew app:assembleRelease
```

### Build Debug APK
```powershell
cd android
.\gradlew clean
.\gradlew app:assembleDebug
```

### Build Bundle (AAB)
```powershell
cd android
.\gradlew clean
.\gradlew app:bundleRelease
```

### Install APK via ADB
```powershell
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

## 📋 Build Options

### Clean Build
All scripts automatically run `gradlew clean` first to ensure fresh build.

### Incremental Build
For faster development builds, you can skip clean:
```powershell
cd android
.\gradlew app:assembleDebug
```

## 🎯 Recommended Workflow

### Development
```powershell
# Quick debug build for testing
.\build-android-debug.ps1
.\install-android.ps1 debug
```

### Testing/Distribution
```powershell
# Production build
.\build-android.ps1
.\install-android.ps1
```

### Google Play Store
```powershell
# Build bundle for Play Store
.\build-android-bundle.ps1
# Upload to: https://play.google.com/console
```

## 🛠️ Troubleshooting

### "gradlew not found"
```powershell
# Make sure you're in project root
cd D:\CNM_Project\Project_Mobile\ChatApp_alo2_no_otp_dev
```

### "ADB not found"
Install Android SDK Platform Tools:
https://developer.android.com/studio/releases/platform-tools

### "No devices found"
1. Connect Android device via USB
2. Enable Developer Options
3. Enable USB Debugging
4. Run: `adb devices`

### Build failed
```powershell
# Clean everything
cd android
.\gradlew clean
.\gradlew --stop

# Rebuild
.\gradlew app:assembleRelease
```

## 📊 Build Sizes

Typical APK sizes:
- **Debug APK**: ~50-80 MB (includes debug symbols)
- **Release APK**: ~30-50 MB (optimized, ProGuard enabled)
- **AAB**: ~25-40 MB (Google Play optimizes per device)

## 🔐 Signing

For production builds, make sure you have:
- Keystore file configured in `android/app/build.gradle`
- Signing credentials in `android/gradle.properties` or environment variables

See: [Android Signing Documentation](https://reactnative.dev/docs/signed-apk-android)

---

**Note:** All scripts use PowerShell 5.1+ syntax and are optimized for Windows.
