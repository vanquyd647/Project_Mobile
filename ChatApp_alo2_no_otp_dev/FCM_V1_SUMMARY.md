# 📱 FCM HTTP v1 API Migration - Summary

## ✅ Đã hoàn thành

Dự án đã được cập nhật để sử dụng **FCM HTTP v1 API** thay vì Legacy API (đã ngừng hoạt động từ 20/6/2024).

### Files đã tạo/cập nhật:

#### 1. Cloud Functions
- ✅ `functions/index.js` - Cloud Functions sử dụng FCM HTTP v1 API
- ✅ `functions/package.json` - Dependencies cho functions
- ✅ `functions/.eslintrc.js` - ESLint config
- ✅ `firebase.json` - Firebase config
- ✅ `.firebaserc` - Firebase project config

#### 2. Documentation
- ✅ `FCM_HTTP_V1_MIGRATION.md` - Hướng dẫn chi tiết migration
- ✅ `DEPLOYMENT_GUIDE.md` - Hướng dẫn deploy functions
- ✅ `FIREBASE_SETUP.md` - Cập nhật hướng dẫn setup
- ✅ `config/service-account/README.md` - Hướng dẫn lấy service account key

#### 3. Code Updates
- ✅ `src/contextApi/NotificationContext.js` - Loại bỏ Legacy API, sử dụng Cloud Functions
- ✅ `.gitignore` - Thêm service-account-key.json

---

## 🚀 Các bước tiếp theo

### Bước 1: Lấy Service Account Key

1. Vào Firebase Console: https://console.firebase.google.com/
2. Chọn project `chatlofi-9c2c8`
3. Settings > Service Accounts
4. Click "Generate new private key"
5. Lưu file vào: `config/service-account/service-account-key.json`

**Chi tiết:** Xem `config/service-account/README.md`

### Bước 2: Bật Firebase Cloud Messaging API

1. Vào: https://console.cloud.google.com/apis/library/fcm.googleapis.com
2. Chọn project `chatlofi-9c2c8`
3. Click "Enable"

### Bước 3: Deploy Cloud Functions

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Install dependencies
cd functions
npm install

# 4. Deploy
firebase deploy --only functions
```

**Chi tiết:** Xem `DEPLOYMENT_GUIDE.md`

### Bước 4: Test

1. Rebuild APK:
   ```bash
   cd android
   .\gradlew clean
   .\gradlew app:assembleRelease
   ```

2. Cài APK lên 2 máy Android

3. Test các tính năng:
   - ✅ Gửi tin nhắn → Nhận notification
   - ✅ Gửi friend request → Nhận notification
   - ✅ Đăng post → Nhận notification

---

## 📚 Tài liệu tham khảo

| File | Mô tả |
|------|-------|
| [FCM_HTTP_V1_MIGRATION.md](FCM_HTTP_V1_MIGRATION.md) | Hướng dẫn đầy đủ về migration |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Hướng dẫn deploy Cloud Functions |
| [FIREBASE_SETUP.md](FIREBASE_SETUP.md) | Setup Firebase cho project |
| [config/service-account/README.md](config/service-account/README.md) | Lấy Service Account Key |

---

## 🔄 So sánh Legacy vs HTTP v1

### Legacy API (❌ Đã ngừng hoạt động)
```javascript
// ❌ KHÔNG DÙNG NỮA
const fcmServerKey = 'AAAAxxxxxxx...';

await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Authorization': `key=${fcmServerKey}`,
  },
  body: JSON.stringify({
    to: token,
    notification: { title, body }
  })
});
```

### HTTP v1 API (✅ Đang sử dụng)
```javascript
// ✅ Cloud Functions tự động xử lý
const admin = require('firebase-admin');

await admin.messaging().send({
  token: token,
  notification: { title, body },
  data: { screen, roomId },
  android: { priority: 'high' },
  apns: { payload: { aps: { sound: 'default' } } }
});
```

---

## 🎯 Lợi ích của HTTP v1 API

### 1. Bảo mật cao hơn
- ✅ OAuth 2.0 token tự động refresh mỗi giờ
- ✅ Service Account Key nằm trên Cloud (không trong APK)
- ✅ Không lộ credentials khi APK bị decompile

### 2. Tự động hóa
- ✅ Notification tự động gửi khi có event mới
- ✅ Không cần gọi API từ app
- ✅ Giảm thiểu logic phức tạp trong app

### 3. Dễ maintain
- ✅ Code tập trung ở Cloud Functions
- ✅ Dễ debug với Firebase Console Logs
- ✅ Dễ update logic mà không cần rebuild app

### 4. Tuỳ chỉnh linh hoạt
- ✅ Hỗ trợ notification khác nhau cho Android/iOS
- ✅ Dễ dàng thêm tính năng mới
- ✅ Có thể filter recipients theo điều kiện

---

## 💰 Chi phí

**Free tier (Spark Plan):**
- 2M invocations/tháng
- 400K GB-seconds

**Ước tính với 10,000 tin nhắn/ngày:**
- ~300K invocations/tháng
- ≈ **MIỄN PHÍ** (nằm trong free tier)

---

## 🛠️ Troubleshooting

### Notification không nhận được?

1. **Kiểm tra FCM Cloud Messaging API đã bật chưa:**
   https://console.cloud.google.com/apis/library/fcm.googleapis.com

2. **Kiểm tra Function logs:**
   ```bash
   firebase functions:log
   ```

3. **Kiểm tra FCM token đã lưu vào Firestore chưa:**
   - Vào Firestore Console
   - Collection: `users`
   - Document: `{userId}`
   - Field: `fcmToken`

4. **Kiểm tra permissions trên Android:**
   - Settings > Apps > ChatLofi > Notifications: ON

### Function deploy failed?

```bash
# Kiểm tra Node.js version (cần >= 18)
node --version

# Re-install dependencies
cd functions
rm -rf node_modules
npm install

# Re-deploy
firebase deploy --only functions --force
```

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Firebase Console Logs: https://console.firebase.google.com/project/chatlofi-9c2c8/functions/logs
2. Cloud Functions Dashboard: https://console.firebase.google.com/project/chatlofi-9c2c8/functions
3. Firestore Data: https://console.firebase.google.com/project/chatlofi-9c2c8/firestore

---

**Cập nhật:** November 25, 2025  
**Status:** ✅ Ready to deploy
