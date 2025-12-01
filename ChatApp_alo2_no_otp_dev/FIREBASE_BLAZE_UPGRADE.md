# 🔥 Nâng cấp Firebase lên Blaze Plan

## ⚠️ Lý do cần nâng cấp

Cloud Functions yêu cầu **Blaze Plan (Pay-as-you-go)** để có thể deploy.

## 📊 Chi phí (MIỄN PHÍ cho usage nhỏ)

### Free tier của Blaze Plan:
- ✅ **2M Cloud Functions invocations/tháng** - MIỄN PHÍ
- ✅ **400K GB-seconds** - MIỄN PHÍ
- ✅ **200K CPU-seconds** - MIỄN PHÍ
- ✅ **5 GB outbound networking** - MIỄN PHÍ

### Ước tính với 10,000 tin nhắn/ngày:
- ~300K invocations/tháng
- ≈ **HOÀN TOÀN MIỄN PHÍ** (nằm trong free tier)

### Chi phí nếu vượt free tier:
- Invocations: $0.40/1M
- GB-seconds: $0.0000025/GB-s
- CPU-seconds: $0.0000100/CPU-s

**Với 100,000 tin nhắn/ngày:**
- ~3M invocations/tháng
- Chi phí: ~$0.40/tháng (chỉ trả cho 1M vượt quá)

## 🚀 Các bước nâng cấp

### Bước 1: Truy cập link nâng cấp
```
https://console.firebase.google.com/project/chatlofi-9c2c8/usage/details
```

### Bước 2: Click "Upgrade Project"

### Bước 3: Chọn Blaze Plan
- Click "Select Plan" ở Blaze Plan
- Đọc và đồng ý với điều khoản

### Bước 4: Nhập thông tin thanh toán
- Nhập thông tin thẻ tín dụng/ghi nợ
- Google sẽ không charge cho đến khi vượt free tier
- Có thể đặt budget alerts để kiểm soát chi phí

### Bước 5: Hoàn tất nâng cấp
- Click "Purchase"
- Đợi vài giây để nâng cấp hoàn tất

## 🔒 Kiểm soát chi phí

### Đặt Budget Alerts
1. Vào: https://console.cloud.google.com/billing
2. Click vào "Budgets & alerts"
3. Create budget với giới hạn (vd: $5/tháng)
4. Nhận email cảnh báo khi đạt 50%, 90%, 100%

### Monitor Usage
```
https://console.firebase.google.com/project/chatlofi-9c2c8/usage
```

Theo dõi:
- Cloud Functions invocations
- GB-seconds usage
- Networking usage

## 🎯 Sau khi nâng cấp

### Deploy Cloud Functions
```powershell
firebase deploy --only functions
```

### Kiểm tra deployment
```powershell
firebase functions:list
```

Bạn sẽ thấy:
- ✅ sendMessageNotification
- ✅ sendFriendRequestNotification
- ✅ sendNewPostNotification
- ✅ sendCustomNotification

## 💡 Lựa chọn thay thế (nếu không muốn nâng cấp)

Nếu không muốn sử dụng Cloud Functions, bạn có thể:

### Option 1: Gửi notification từ backend server riêng
- Setup Node.js/PHP server
- Sử dụng Firebase Admin SDK
- Tốn công setup và maintain

### Option 2: Tạm thời gửi từ app (KHÔNG AN TOÀN)
- Sử dụng FCM REST API trực tiếp
- Cần hardcode Server Key (rủi ro bảo mật)
- Không khuyến nghị cho production

## ✅ Khuyến nghị

**Nên nâng cấp lên Blaze Plan vì:**
1. ✅ Hoàn toàn miễn phí cho usage nhỏ và vừa
2. ✅ An toàn hơn (không lộ credentials trong APK)
3. ✅ Tự động hóa (notification tự động gửi)
4. ✅ Dễ maintain và scale
5. ✅ Có thể đặt budget alerts để kiểm soát

**Worst case scenario:**
- Quên monitor và vượt free tier
- Chi phí tối đa: ~$5-10/tháng (cho app rất lớn)
- Có thể tắt Functions bất cứ lúc nào

---

**Cập nhật:** November 25, 2025
