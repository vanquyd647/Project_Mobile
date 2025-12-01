# 📱 Tóm tắt cấu hình Push Notifications

## ✅ Đã hoàn thành

### 1. Cấu hình Firebase (Android)
- ✅ Package name: `com.quy001.jolo` (đã khớp với google-services.json)
- ✅ Google Services plugin đã cài
- ✅ Firebase Messaging dependencies đã có
- ✅ Notification permissions đã thêm vào AndroidManifest
- ✅ FCM Service đã cấu hình

### 2. Cloud Functions (FCM HTTP v1 API)
- ✅ 4 Cloud Functions đã tạo:
  - `sendMessageNotification` - Gửi khi có tin nhắn mới
  - `sendFriendRequestNotification` - Gửi khi có friend request
  - `sendNewPostNotification` - Gửi khi có post mới
  - `sendCustomNotification` - Gửi custom notification
- ⏳ Chờ nâng cấp Firebase lên Blaze Plan để deploy

### 3. NotificationContext (React Native)
- ✅ Đã cập nhật để sử dụng Cloud Functions
- ✅ Loại bỏ Legacy FCM API
- ✅ Sử dụng @react-native-firebase/messaging

### 4. Build Scripts
- ✅ `build-android.ps1` - Build release APK
- ✅ `build-android-debug.ps1` - Build debug APK
- ✅ `build-android-bundle.ps1` - Build AAB cho Play Store
- ✅ `install-android.ps1` - Cài APK lên device

---

## 🚀 Bước tiếp theo

### Option 1: Deploy Cloud Functions (Khuyến nghị - An toàn nhất)

#### A. Nâng cấp Firebase lên Blaze Plan
```
Link: https://console.firebase.google.com/project/chatlofi-9c2c8/usage/details
Chi phí: MIỄN PHÍ cho usage nhỏ (nằm trong free tier)
```
**Xem chi tiết:** `FIREBASE_BLAZE_UPGRADE.md`

#### B. Deploy Functions
```powershell
firebase deploy --only functions
```

#### C. Test
- Gửi tin nhắn → Notification tự động được gửi
- Gửi friend request → Notification tự động được gửi
- Đăng post → Followers nhận notification tự động

### Option 2: Sử dụng APK hiện tại (Tạm thời)

APK đã được build với FCM config đầy đủ. Tuy nhiên:

**Lưu ý:**
- ❌ Notification KHÔNG tự động gửi (cần Cloud Functions)
- ⚠️ Cần update code để gửi notification từ app (không an toàn)
- ⚠️ Hoặc setup backend server riêng

---

## 📁 Files quan trọng

### Tài liệu
- `FCM_HTTP_V1_MIGRATION.md` - Hướng dẫn migration đầy đủ
- `FIREBASE_BLAZE_UPGRADE.md` - Hướng dẫn nâng cấp Firebase
- `DEPLOYMENT_GUIDE.md` - Hướng dẫn deploy functions
- `BUILD_SCRIPTS.md` - Hướng dẫn build app

### Config Files
- `android/app/google-services.json` - Firebase config
- `android/app/src/main/AndroidManifest.xml` - Android permissions
- `functions/index.js` - Cloud Functions code
- `config/service-account/` - Nơi đặt service account key

---

## 📊 So sánh các phương án

| Phương án | An toàn | Tự động | Chi phí | Setup |
|-----------|---------|---------|---------|-------|
| **Cloud Functions** (Khuyến nghị) | ✅ Cao | ✅ Tự động | ✅ Free | ⚠️ Cần Blaze |
| Backend server riêng | ✅ Cao | ✅ Tự động | ⚠️ Server cost | ⚠️ Phức tạp |
| Gửi từ app | ❌ Thấp | ❌ Thủ công | ✅ Free | ✅ Đơn giản |

---

## 🎯 Khuyến nghị

### Cho Production:
1. ✅ Nâng cấp Firebase lên Blaze Plan
2. ✅ Deploy Cloud Functions
3. ✅ Build release APK
4. ✅ Test đầy đủ trên thiết bị thật

### Cho Testing nhanh:
1. ✅ Sử dụng APK đã build
2. ⚠️ Tạm thời gửi notification manually từ Firebase Console
3. ⚠️ Hoặc test với Expo Go (development)

---

## 🔍 Kiểm tra APK đã build

APK location: `android\app\build\outputs\apk\release\app-release.apk`

**Test notification:**
```powershell
# Cài APK lên device
.\install-android.ps1

# Test trên Firebase Console:
# https://console.firebase.google.com/project/chatlofi-9c2c8/notification
```

---

## 📞 Troubleshooting

### Không nhận notification?

1. **Kiểm tra FCM token đã lưu chưa:**
   - Login vào app
   - Check Firestore: users/{userId}/fcmToken

2. **Kiểm tra permissions trên Android:**
   - Settings > Apps > Jolo > Notifications: ON
   - Settings > Apps > Jolo > Battery: No restrictions

3. **Test với Firebase Console:**
   - Vào: https://console.firebase.google.com/project/chatlofi-9c2c8/notification
   - Click "Send test message"
   - Nhập FCM token
   - Send

---

**Status:** ✅ APK đang build với FCM config đầy đủ  
**Next step:** Nâng cấp Firebase Blaze Plan → Deploy Cloud Functions  
**Updated:** November 25, 2025
