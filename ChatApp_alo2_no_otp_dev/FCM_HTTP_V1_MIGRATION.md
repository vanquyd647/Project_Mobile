# 🔥 Di chuyển từ FCM Legacy API sang HTTP v1 API

## ⚠️ Tại sao phải di chuyển?

API FCM cũ (Legacy) đã **NGỪNG HOẠT ĐỘNG** từ ngày **20 tháng 6, 2024**.

### Ưu điểm của HTTP v1 API:

✅ **Bảo mật cao hơn**: Sử dụng OAuth 2.0 token có thời hạn ngắn (1 giờ)  
✅ **Tuỳ chỉnh linh hoạt**: Hỗ trợ tuỳ chỉnh notification cho từng nền tảng  
✅ **Dễ bảo trì**: Cấu trúc JSON rõ ràng hơn  
✅ **Hỗ trợ lâu dài**: Google cam kết hỗ trợ lâu dài

---

## 📋 Bước 1: Tạo Service Account Key

### 1.1. Truy cập Firebase Console
```
https://console.firebase.google.com/
```

### 1.2. Chọn project `chatlofi-9c2c8`

### 1.3. Vào Settings > Service Accounts
- Click vào **Project Settings** (biểu tượng bánh răng)
- Chọn tab **Service Accounts**
- Click **Generate new private key**
- Click **Generate key** để xác nhận

### 1.4. Lưu file JSON
- File sẽ được tải về với tên dạng: `chatlofi-9c2c8-firebase-adminsdk-xxxxx.json`
- Đổi tên thành: `service-account-key.json`
- Copy vào: `config/service-account/service-account-key.json`

```powershell
# Tạo thư mục nếu chưa có
New-Item -ItemType Directory -Force -Path "config\service-account"

# Copy file vào đúng vị trí
Copy-Item "Downloads\chatlofi-9c2c8-firebase-adminsdk-xxxxx.json" "config\service-account\service-account-key.json"
```

### 1.5. Kiểm tra Firebase Cloud Messaging API đã được bật chưa
- Truy cập: https://console.cloud.google.com/
- Chọn project `chatlofi-9c2c8`
- Vào **APIs & Services** > **Library**
- Tìm kiếm: **Firebase Cloud Messaging API**
- Nếu chưa bật, click **Enable**

---

## 📋 Bước 2: Setup Cloud Functions (Khuyến nghị)

### 2.1. Install Firebase CLI

```powershell
npm install -g firebase-tools
firebase login
```

### 2.2. Initialize Functions

```powershell
cd D:\CNM_Project\Project_Mobile\ChatApp_alo2_no_otp_dev
firebase init functions
```

**Chọn các options sau:**
- Language: **JavaScript** (hoặc TypeScript nếu muốn)
- ESLint: **Yes**
- Install dependencies: **Yes**

### 2.3. Cài đặt dependencies cho Functions

```powershell
cd functions
npm install firebase-admin
```

### 2.4. Tạo Cloud Functions

File: `functions/index.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Admin SDK
admin.initializeApp();

/**
 * Send notification when new message is created
 */
exports.sendMessageNotification = functions.firestore
  .document('Chats/{chatId}/chat_mess/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const message = snap.data();
      const chatId = context.params.chatId;
      
      // Get chat members
      const chatDoc = await admin.firestore()
        .collection('Chats')
        .doc(chatId)
        .get();
      
      if (!chatDoc.exists) {
        console.log('Chat not found');
        return null;
      }
      
      const chatData = chatDoc.data();
      const recipientIds = chatData.UID.filter(uid => uid !== message.user._id);
      
      // Get FCM tokens for all recipients
      const tokens = [];
      for (const uid of recipientIds) {
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(uid)
          .get();
        
        if (userDoc.exists) {
          const fcmToken = userDoc.data()?.fcmToken;
          if (fcmToken) {
            tokens.push({
              token: fcmToken,
              userId: uid
            });
          }
        }
      }
      
      if (tokens.length === 0) {
        console.log('No tokens found');
        return null;
      }
      
      // Send notification to each device using HTTP v1 API
      const promises = tokens.map(({ token }) => {
        const payload = {
          token: token,
          notification: {
            title: message.user.name || 'Tin nhắn mới',
            body: message.text || '📷 Hình ảnh',
          },
          data: {
            screen: 'Chat_fr',
            roomId: chatId,
            senderId: message.user._id,
            type: 'new_message'
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              color: '#006AF5',
              channelId: 'messages'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        };
        
        return admin.messaging().send(payload);
      });
      
      const results = await Promise.allSettled(promises);
      console.log(`Sent ${results.filter(r => r.status === 'fulfilled').length}/${results.length} notifications`);
      
      return results;
    } catch (error) {
      console.error('Error sending message notification:', error);
      return null;
    }
  });

/**
 * Send notification when friend request is created
 */
exports.sendFriendRequestNotification = functions.firestore
  .document('friendRequests/{requestId}')
  .onCreate(async (snap, context) => {
    try {
      const request = snap.data();
      
      // Get recipient's FCM token
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(request.recipientId)
        .get();
      
      if (!userDoc.exists) {
        console.log('Recipient user not found');
        return null;
      }
      
      const fcmToken = userDoc.data()?.fcmToken;
      if (!fcmToken) {
        console.log('No FCM token for recipient');
        return null;
      }
      
      // Get sender info
      const senderDoc = await admin.firestore()
        .collection('users')
        .doc(request.senderId)
        .get();
      
      const senderName = senderDoc.exists ? (senderDoc.data()?.name || 'Ai đó') : 'Ai đó';
      
      // Send notification using HTTP v1 API
      const payload = {
        token: fcmToken,
        notification: {
          title: 'Lời mời kết bạn',
          body: `${senderName} đã gửi lời mời kết bạn`,
        },
        data: {
          screen: 'FriendRequest',
          requestId: context.params.requestId,
          senderId: request.senderId,
          type: 'friend_request'
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#006AF5',
            channelId: 'friend_requests'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };
      
      const result = await admin.messaging().send(payload);
      console.log('Friend request notification sent:', result);
      
      return result;
    } catch (error) {
      console.error('Error sending friend request notification:', error);
      return null;
    }
  });

/**
 * Send notification when new post is created
 */
exports.sendNewPostNotification = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    try {
      const post = snap.data();
      
      // Get all followers of the post author
      const followersSnapshot = await admin.firestore()
        .collection('followers')
        .where('followingId', '==', post.userId)
        .get();
      
      if (followersSnapshot.empty) {
        console.log('No followers found');
        return null;
      }
      
      // Get FCM tokens for all followers
      const tokens = [];
      for (const doc of followersSnapshot.docs) {
        const followerDoc = await admin.firestore()
          .collection('users')
          .doc(doc.data().followerId)
          .get();
        
        if (followerDoc.exists) {
          const fcmToken = followerDoc.data()?.fcmToken;
          if (fcmToken) {
            tokens.push(fcmToken);
          }
        }
      }
      
      if (tokens.length === 0) {
        console.log('No tokens found for followers');
        return null;
      }
      
      // Get author info
      const authorDoc = await admin.firestore()
        .collection('users')
        .doc(post.userId)
        .get();
      
      const authorName = authorDoc.exists ? (authorDoc.data()?.name || 'Ai đó') : 'Ai đó';
      
      // Send notification to each follower
      const promises = tokens.map(token => {
        const payload = {
          token: token,
          notification: {
            title: 'Bài viết mới',
            body: `${authorName} đã đăng bài viết mới`,
          },
          data: {
            screen: 'PostDetail',
            postId: context.params.postId,
            userId: post.userId,
            type: 'new_post'
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              color: '#006AF5',
              channelId: 'posts'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        };
        
        return admin.messaging().send(payload);
      });
      
      const results = await Promise.allSettled(promises);
      console.log(`Sent ${results.filter(r => r.status === 'fulfilled').length}/${results.length} notifications`);
      
      return results;
    } catch (error) {
      console.error('Error sending new post notification:', error);
      return null;
    }
  });

/**
 * Callable function to send custom notification
 * Call from app: functions().httpsCallable('sendCustomNotification')
 */
exports.sendCustomNotification = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to send notifications'
    );
  }
  
  try {
    const { recipientId, title, body, screen, additionalData } = data;
    
    // Get recipient's FCM token
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(recipientId)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Recipient not found');
    }
    
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', 'No FCM token found');
    }
    
    // Send notification using HTTP v1 API
    const payload = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: {
        screen: screen || 'Home',
        senderId: context.auth.uid,
        type: 'custom',
        ...additionalData
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          color: '#006AF5'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
    
    const result = await admin.messaging().send(payload);
    console.log('Custom notification sent:', result);
    
    return { success: true, messageId: result };
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 2.5. Deploy Functions

```powershell
firebase deploy --only functions
```

---

## 📋 Bước 3: Cập nhật NotificationContext.js

File này đã được cập nhật để sử dụng Cloud Functions thay vì gọi trực tiếp FCM API.

Các thay đổi chính:
- ✅ Loại bỏ FCM Server Key (không còn cần thiết)
- ✅ Sử dụng Cloud Functions để gửi notification
- ✅ Tự động gửi notification khi có tin nhắn mới, friend request, post mới
- ✅ Hỗ trợ gửi custom notification qua callable function

---

## 📋 Bước 4: Test Notification

### 4.1. Kiểm tra Functions đã deploy chưa

```powershell
firebase functions:list
```

Bạn sẽ thấy:
- ✅ `sendMessageNotification`
- ✅ `sendFriendRequestNotification`
- ✅ `sendNewPostNotification`
- ✅ `sendCustomNotification`

### 4.2. Test trên 2 thiết bị

1. Đăng nhập 2 tài khoản khác nhau
2. Gửi tin nhắn → Kiểm tra notification
3. Gửi friend request → Kiểm tra notification
4. Đăng bài viết → Kiểm tra notification

### 4.3. Debug Functions

```powershell
# Xem logs real-time
firebase functions:log

# Hoặc xem trên Firebase Console
# https://console.firebase.google.com/ > Functions > Logs
```

---

## 🔍 So sánh API cũ vs HTTP v1

### Legacy API (Đã ngừng hoạt động)

```javascript
// ❌ KHÔNG DÙNG NỮA
const fcmServerKey = 'AAAAxxxxxxx...';

await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Authorization': `key=${fcmServerKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: recipientToken,
    notification: {
      title: 'Hello',
      body: 'World'
    }
  })
});
```

### HTTP v1 API (Khuyến nghị)

```javascript
// ✅ DÙNG ADMIN SDK + CLOUD FUNCTIONS
const admin = require('firebase-admin');

const payload = {
  token: recipientToken,
  notification: {
    title: 'Hello',
    body: 'World'
  },
  data: {
    screen: 'Chat',
    roomId: '123'
  },
  android: {
    priority: 'high',
    notification: {
      sound: 'default',
      color: '#006AF5'
    }
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1
      }
    }
  }
};

await admin.messaging().send(payload);
```

---

## 🔒 Bảo mật

### Legacy API (Không an toàn)
- ❌ Server Key được hardcode trong code
- ❌ Nếu APK bị decompile, key bị lộ
- ❌ Key không có thời hạn hết hạn
- ❌ Khó thu hồi khi bị lộ

### HTTP v1 API (An toàn)
- ✅ Sử dụng OAuth 2.0 token có thời hạn 1 giờ
- ✅ Service Account Key nằm trên Cloud Functions
- ✅ APK không chứa bất kỳ key nào
- ✅ Dễ dàng thu hồi và tạo key mới

---

## 📊 Pricing

### Cloud Functions Pricing (Free Tier)

| Resource | Free Tier | Sau Free Tier |
|----------|-----------|---------------|
| Invocations | 2M/tháng | $0.40/1M |
| Compute time | 400K GB-s | $0.0000025/GB-s |
| Outbound networking | 5 GB | $0.12/GB |

**Ước tính**: Với 10,000 tin nhắn/ngày = ~300K/tháng ≈ **MIỄN PHÍ**

---

## 🎯 Kết luận

### Nên dùng Cloud Functions vì:
1. ✅ **An toàn**: Không lộ key trong APK
2. ✅ **Tự động**: Notification tự động khi có event mới
3. ✅ **Dễ maintain**: Code tập trung ở một nơi
4. ✅ **Tuân thủ API mới**: Sử dụng HTTP v1 API
5. ✅ **Miễn phí**: Nằm trong free tier của Firebase

### Không nên:
- ❌ Gọi trực tiếp FCM API từ React Native app
- ❌ Hardcode Server Key trong code
- ❌ Sử dụng Legacy API (đã ngừng hoạt động)

---

**Last Updated:** November 25, 2025
**Migration Deadline:** Hoàn thành sớm nhất có thể (Legacy API đã ngừng từ 6/2024)
