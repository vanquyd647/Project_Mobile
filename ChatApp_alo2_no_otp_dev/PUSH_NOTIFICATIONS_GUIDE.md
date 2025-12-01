# 🔔 Hướng dẫn Push Notifications

## ✅ Đã triển khai

Hệ thống thông báo đẩy đã được tích hợp hoàn toàn vào ứng dụng với các tính năng:

### 1. **Auto-register Push Token**
- Tự động đăng ký push token khi app khởi động
- Lưu token vào Firestore khi user đăng nhập
- Xóa token khi user đăng xuất

### 2. **Gửi thông báo khi có tin nhắn mới**
- ✅ Chat 1-1: Thông báo đến người nhận
- ✅ Chat nhóm: Thông báo đến tất cả thành viên (trừ người gửi)
- ✅ Hỗ trợ text, hình ảnh, video, file
- ✅ Hiển thị tên người gửi và preview nội dung

### 3. **Notification Handlers**
- ✅ Foreground: Hiển thị banner khi app đang mở
- ✅ Background: Push notification khi app minimize
- ✅ Tap handler: Xử lý khi user bấm vào notification

### 4. **Badge Management**
- ✅ Auto-update badge count khi có tin nhắn mới
- ✅ Clear badge khi vào chat
- ✅ Clear all notifications khi logout

## 📁 Files đã thay đổi

### Tạo mới:
1. **`src/contextApi/NotificationContext.js`** (230 dòng)
   - Quản lý push notifications
   - Register/unregister tokens
   - Send notifications
   - Badge management

### Cập nhật:
1. **`App.js`**
   - Wrap app với NotificationProvider

2. **`src/screens/Login.js`**
   - Lưu push token khi login thành công

3. **`src/screens/Setting_app.js`**
   - Xóa push token khi logout
   - Clear notifications

4. **`src/screens/Chat_fr.js`**
   - Gửi push notification khi gửi tin nhắn
   - Clear notifications khi mở chat
   - Hỗ trợ cả chat 1-1 và nhóm

5. **`app.config.js`**
   - Thêm notification configuration
   - Thêm expo-notifications plugin

## 🚀 Cách sử dụng

### Test trên thiết bị thật:

```bash
# 1. Build app với Expo
npx expo start

# 2. Scan QR code bằng Expo Go app

# 3. Hoặc build APK
eas build --platform android --profile preview
```

### Firestore Structure:

Push token được lưu trong collection `users`:
```javascript
{
  uid: "user123",
  name: "Nguyễn Văn A",
  email: "user@example.com",
  expoPushToken: "ExponentPushToken[xxxxxxxxxxxxxx]",
  lastTokenUpdate: Timestamp
}
```

### Notification Payload:

```javascript
{
  to: recipientToken,
  sound: 'default',
  title: 'Tên người gửi',
  body: 'Nội dung tin nhắn...',
  data: {
    screen: 'Chat_fr',
    roomId: 'chat_room_id',
    senderId: 'sender_uid',
    isGroup: false
  },
  badge: 1
}
```

## ⚠️ Lưu ý quan trọng

### 1. **Expo Push Notifications yêu cầu:**
- ✅ Thiết bị thật (không chạy trên emulator)
- ✅ Project phải có EAS projectId trong app.config.js
- ✅ User phải cấp quyền notifications

### 2. **Limitations:**
- Expo Push API có giới hạn rate limit
- Maximum 100 notifications/giây
- Message size tối đa 4KB

### 3. **Testing:**
```javascript
// Test gửi notification thủ công:
const { sendPushNotification } = useNotifications();

sendPushNotification(
  'recipient_user_id',
  'Test Title',
  'Test Body',
  { custom: 'data' }
);
```

## 🔧 Troubleshooting

### Không nhận được notification?

1. **Check permissions:**
   ```javascript
   // Trong NotificationContext
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Permission status:', status);
   ```

2. **Check token:**
   ```javascript
   // Kiểm tra token trong Firestore
   const userRef = doc(db, 'users', userId);
   const userSnap = await getDoc(userRef);
   console.log('Push token:', userSnap.data().expoPushToken);
   ```

3. **Check network:**
   - Đảm bảo có kết nối internet
   - Check Expo Push API status

4. **Check device:**
   - Phải dùng thiết bị thật
   - Không chạy trên emulator/simulator

### Notification không hiển thị?

```javascript
// Check notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log('Notification received!');
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});
```

## 📊 Monitoring

### View logs:
```bash
# Terminal logs
npx expo start

# Expo developer console
https://expo.dev/accounts/[your-account]/projects/[your-project]/notifications
```

### Test notifications:
```bash
# Gửi test notification qua Expo Push Tool
https://expo.dev/notifications
```

## 🎯 Tính năng tương lai

- [ ] Notification cho comments, reactions
- [ ] Notification cho friend requests
- [ ] Group notification settings
- [ ] Mute/unmute conversations
- [ ] Scheduled notifications
- [ ] Rich notifications với images
- [ ] Custom notification sounds

## 📚 Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

**Developed by:** ChatApp Team  
**Last Updated:** November 25, 2025
