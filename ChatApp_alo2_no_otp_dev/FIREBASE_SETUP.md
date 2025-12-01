# 🔥 Firebase Cloud Messaging Setup Guide

## ⚠️ **Quan trọng**: Expo Push Notifications KHÔNG hoạt động trên APK standalone

APK build bằng `gradlew` cần sử dụng **Firebase Cloud Messaging (FCM)** thay vì Expo Push Notifications.

## 📋 Bước 1: Download google-services.json

### 1.1. Truy cập Firebase Console
```
https://console.firebase.google.com/
```

### 1.2. Chọn project của bạn

### 1.3. Project Settings > General
- Scroll xuống phần **Your apps**
- Click vào Android app (hoặc Add app nếu chưa có)
- Package name: `com.yourdomain.chatlofi`

### 1.4. Download google-services.json
- Click **Download google-services.json**
- Copy file vào: `android/app/google-services.json`

```powershell
# Copy vào đúng vị trí
Copy-Item "path\to\google-services.json" "android\app\google-services.json"
```

## 📋 Bước 2: Di chuyển sang FCM HTTP v1 API

⚠️ **QUAN TRỌNG**: API FCM cũ (Legacy) đã **NGỪNG HOẠT ĐỘNG** từ ngày 20/6/2024.

### Xem hướng dẫn chi tiết: [FCM_HTTP_V1_MIGRATION.md](FCM_HTTP_V1_MIGRATION.md)

**Tóm tắt các bước:**

1. Tạo Service Account Key từ Firebase Console
2. Setup Cloud Functions để gửi notification an toàn
3. Deploy Cloud Functions lên Firebase
4. Notification sẽ tự động được gửi khi có:
   - Tin nhắn mới
   - Friend request
   - Bài viết mới

**Không cần FCM Server Key nữa!** Cloud Functions sẽ tự động xử lý việc gửi notification sử dụng HTTP v1 API.

## 📋 Bước 3: Setup Cloud Functions (Khuyến nghị)

**Để gửi notification tự động và an toàn:**

Xem hướng dẫn đầy đủ tại: **[FCM_HTTP_V1_MIGRATION.md](FCM_HTTP_V1_MIGRATION.md)**

**Quick setup:**
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools
firebase login

# 2. Initialize Functions
firebase init functions

# 3. Deploy
firebase deploy --only functions
```

Cloud Functions sẽ tự động:
- ✅ Gửi notification khi có tin nhắn mới
- ✅ Gửi notification khi có friend request
- ✅ Gửi notification khi có post mới
- ✅ Sử dụng FCM HTTP v1 API (an toàn, mới nhất)

## 📋 Bước 4: Rebuild APK

```powershell
cd android
.\gradlew clean
.\gradlew app:assembleRelease
```

APK mới sẽ có: `android\app\build\outputs\apk\release\app-release.apk`

## 📋 Bước 5: Test

### 5.1. Cài APK lên 2 máy Android

### 5.2. Đăng nhập 2 tài khoản khác nhau

### 5.3. Test các tính năng:
- ✅ Gửi tin nhắn → Nhận thông báo
- ✅ Gửi lời mời kết bạn → Nhận thông báo  
- ✅ Đăng bài viết → Followers nhận thông báo

## 🔧 Troubleshooting

### Không nhận notification?

#### 1. Check FCM token đã lưu chưa:
```javascript
// Trong Login.js sau khi login
console.log('FCM Token:', fcmToken);
```

#### 2. Check Firebase Console Logs:
```
https://console.firebase.google.com/ > Functions > Logs
```

#### 3. Check permissions:
- Settings > Apps > ChatLofi > Permissions > Notifications: ON

#### 4. Check background data:
- Settings > Apps > ChatLofi > Mobile data: ON
- Settings > Apps > ChatLofi > Battery: No restrictions

### Token không save vào Firestore?

```javascript
// Debug trong Login.js
console.log('User ID:', user.uid);
console.log('FCM Token:', fcmToken);

if (fcmToken) {
  await savePushToken(user.uid, fcmToken);
  console.log('Token saved!');
}
```

### Cloud Function không trigger?

```bash
# Check function logs
firebase functions:log

# Hoặc xem trên Firebase Console:
# https://console.firebase.google.com/ > Functions > Logs
```

## 📊 So sánh Expo Push vs FCM

| Feature | Expo Push | FCM |
|---------|-----------|-----|
| APK Standalone | ❌ Không hoạt động | ✅ Hoạt động |
| Expo Go | ✅ Hoạt động | ✅ Hoạt động |
| Setup | Đơn giản | Phức tạp hơn |
| Backend | Không cần | Cần Cloud Functions |
| Free tier | Giới hạn | Unlimited |
| API Version | N/A | ✅ HTTP v1 (mới nhất) |

## 🎯 Kết luận

**Để push notifications hoạt động trên APK:**
1. ✅ Download `google-services.json`
2. ✅ Di chuyển sang FCM HTTP v1 API
3. ✅ Setup Cloud Functions (khuyến nghị - an toàn nhất)
4. ✅ Rebuild APK
5. ✅ Test trên thiết bị thật

**⚠️ Lưu ý quan trọng:**
- FCM Legacy API đã **NGỪNG HOẠT ĐỘNG** từ 20/6/2024
- Bắt buộc phải di chuyển sang HTTP v1 API
- Khuyến nghị dùng Cloud Functions thay vì gọi trực tiếp từ app
- Xem chi tiết: [FCM_HTTP_V1_MIGRATION.md](FCM_HTTP_V1_MIGRATION.md)

---

**Last Updated:** November 25, 2025
