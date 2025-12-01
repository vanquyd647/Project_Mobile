# 🚀 Quick Start - Deploy Cloud Functions

## Bước 1: Cài đặt Firebase CLI

```powershell
npm install -g firebase-tools
```

## Bước 2: Đăng nhập Firebase

```powershell
firebase login
```

## Bước 3: Cài đặt dependencies cho Functions

```powershell
cd functions
npm install
```

## Bước 4: Deploy Cloud Functions

```powershell
# Deploy tất cả functions
firebase deploy --only functions

# Hoặc deploy từng function riêng lẻ
firebase deploy --only functions:sendMessageNotification
firebase deploy --only functions:sendFriendRequestNotification
firebase deploy --only functions:sendNewPostNotification
firebase deploy --only functions:sendCustomNotification
```

## Bước 5: Kiểm tra logs

```powershell
# Xem logs real-time
firebase functions:log

# Hoặc xem logs trên Firebase Console:
# https://console.firebase.google.com/project/chatlofi-9c2c8/functions/logs
```

## 🔍 Test Functions

### Test trên Firebase Console

1. Vào: https://console.firebase.google.com/project/chatlofi-9c2c8/functions
2. Click vào function muốn test
3. Click "Testing" tab
4. Nhập test data và run

### Test từ app

1. Gửi tin nhắn → Kiểm tra notification
2. Gửi friend request → Kiểm tra notification
3. Đăng post → Kiểm tra notification

## 📊 Monitoring

### Xem metrics:
```
https://console.firebase.google.com/project/chatlofi-9c2c8/functions/dashboard
```

### Kiểm tra:
- ✅ Invocations (số lần gọi)
- ✅ Execution time (thời gian thực thi)
- ✅ Memory usage (sử dụng bộ nhớ)
- ✅ Error rate (tỷ lệ lỗi)

## 🛠️ Troubleshooting

### Function không chạy?

1. **Kiểm tra Firebase Cloud Messaging API đã bật chưa:**
   - Vào: https://console.cloud.google.com/apis/library/fcm.googleapis.com
   - Click "Enable"

2. **Kiểm tra logs:**
   ```bash
   firebase functions:log --only sendMessageNotification
   ```

3. **Kiểm tra Firestore rules:**
   - Functions cần quyền đọc/ghi vào Firestore

### Deploy failed?

```bash
# Kiểm tra version Node.js
node --version  # Cần >= 18

# Kiểm tra Firebase project
firebase use

# Re-deploy
firebase deploy --only functions --force
```

## 💰 Pricing

**Free tier (Spark Plan - Hiện tại):**
- 2M invocations/tháng
- 400K GB-seconds
- 200K CPU-seconds

**Ước tính với 10,000 tin nhắn/ngày:**
- ~300K invocations/tháng
- ≈ **MIỄN PHÍ** (nằm trong free tier)

**Nếu vượt quá free tier:**
- Nâng lên Blaze Plan (pay as you go)
- ~$0.40/1M invocations
- ~$0.0000025/GB-second

## 🔐 Bảo mật

✅ **An toàn:**
- Service Account Key nằm trên Firebase (không trong APK)
- OAuth 2.0 token tự động refresh mỗi giờ
- Không lộ credentials trong code

❌ **Không nên:**
- Hardcode FCM Server Key trong app
- Gọi trực tiếp FCM API từ client
- Commit service-account-key.json lên Git

---

**Ready to deploy?**

```bash
cd functions && npm install && firebase deploy --only functions
```
