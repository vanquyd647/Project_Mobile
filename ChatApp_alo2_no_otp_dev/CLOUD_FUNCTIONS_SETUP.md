# Firebase Cloud Functions Setup cho FCM V1

## Bước 1: Install Firebase Tools

```powershell
npm install -g firebase-tools
firebase login
```

## Bước 2: Initialize Functions

```powershell
cd D:\CNM_Project\Project_Mobile\ChatApp_alo2_no_otp_dev
firebase init functions

# Chọn:
# - Use existing project (chọn project của bạn)
# - Language: JavaScript
# - ESLint: Yes
# - Install dependencies: Yes
```

## Bước 3: Install Dependencies

```powershell
cd functions
npm install firebase-admin
```

## Bước 4: Create Cloud Functions

File: `functions/index.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ===== THÔNG BÁO TIN NHẮN MỚI =====
exports.sendMessageNotification = functions.firestore
  .document('Chats/{chatId}/chat_mess/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const message = snap.data();
      const chatId = context.params.chatId;
      
      // Lấy thông tin chat room
      const chatDoc = await admin.firestore()
        .collection('Chats')
        .doc(chatId)
        .get();
      
      if (!chatDoc.exists) return null;
      
      const chatData = chatDoc.data();
      const recipientIds = chatData.UID.filter(uid => uid !== message.user._id);
      
      // Lấy FCM tokens của người nhận
      const tokens = [];
      for (const uid of recipientIds) {
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(uid)
          .get();
        
        const fcmToken = userDoc.data()?.fcmToken;
        if (fcmToken) {
          tokens.push(fcmToken);
        }
      }
      
      if (tokens.length === 0) {
        console.log('No FCM tokens found');
        return null;
      }
      
      // Xác định nội dung thông báo
      let body = message.text || '';
      if (message.image) body = '📷 Đã gửi một ảnh';
      if (message.video) body = '🎥 Đã gửi một video';
      if (message.document) body = '📎 Đã gửi một file';
      
      // Gửi thông báo
      const payload = {
        notification: {
          title: message.user.name || 'Tin nhắn mới',
          body: body,
        },
        data: {
          screen: 'Chat_fr',
          roomId: chatId,
          senderId: message.user._id,
          type: 'message',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#006AF5',
            channelId: 'default',
          },
        },
      };
      
      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log('Notification sent:', response);
      
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

// ===== THÔNG BÁO LỜI MỜI KẾT BẠN =====
exports.sendFriendRequestNotification = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const userId = context.params.userId;
      
      // Check nếu có friend request mới
      const beforeRequests = before.Friend_rq || [];
      const afterRequests = after.Friend_rq || [];
      
      if (afterRequests.length <= beforeRequests.length) {
        return null;
      }
      
      // Lấy request mới nhất
      const newRequestId = afterRequests[afterRequests.length - 1];
      
      // Lấy thông tin người gửi
      const senderDoc = await admin.firestore()
        .collection('users')
        .doc(newRequestId)
        .get();
      
      if (!senderDoc.exists) return null;
      
      const senderName = senderDoc.data()?.name || 'Ai đó';
      
      // Lấy FCM token của người nhận
      const fcmToken = after.fcmToken;
      if (!fcmToken) {
        console.log('No FCM token for recipient');
        return null;
      }
      
      // Gửi thông báo
      const payload = {
        notification: {
          title: 'Lời mời kết bạn',
          body: `${senderName} đã gửi lời mời kết bạn`,
        },
        data: {
          screen: 'FriendRequest',
          senderId: newRequestId,
          type: 'friend_request',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#006AF5',
            channelId: 'default',
          },
        },
      };
      
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log('Friend request notification sent:', response);
      
      return response;
    } catch (error) {
      console.error('Error sending friend request notification:', error);
      return null;
    }
  });

// ===== THÔNG BÁO BÀI VIẾT MỚI (Optional) =====
exports.sendNewPostNotification = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    try {
      const post = snap.data();
      const postId = context.params.postId;
      
      // Lấy thông tin tác giả
      const authorDoc = await admin.firestore()
        .collection('users')
        .doc(post.userId)
        .get();
      
      if (!authorDoc.exists) return null;
      
      const authorName = authorDoc.data()?.name || 'Ai đó';
      
      // Lấy danh sách bạn bè của tác giả
      const friendsList = authorDoc.data()?.Friend || [];
      
      if (friendsList.length === 0) {
        console.log('No friends to notify');
        return null;
      }
      
      // Lấy FCM tokens của bạn bè
      const tokens = [];
      for (const friendId of friendsList) {
        const friendDoc = await admin.firestore()
          .collection('users')
          .doc(friendId)
          .get();
        
        const fcmToken = friendDoc.data()?.fcmToken;
        if (fcmToken) {
          tokens.push(fcmToken);
        }
      }
      
      if (tokens.length === 0) {
        console.log('No FCM tokens found for friends');
        return null;
      }
      
      // Xác định nội dung
      let body = post.content || 'đã đăng bài viết mới';
      if (post.image) body = '📷 đã đăng ảnh mới';
      if (post.video) body = '🎥 đã đăng video mới';
      
      // Gửi thông báo
      const payload = {
        notification: {
          title: authorName,
          body: body,
        },
        data: {
          screen: 'PostDetail',
          postId: postId,
          authorId: post.userId,
          type: 'new_post',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#006AF5',
            channelId: 'default',
          },
        },
      };
      
      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log('New post notification sent:', response);
      
      return response;
    } catch (error) {
      console.error('Error sending post notification:', error);
      return null;
    }
  });

// ===== THÔNG BÁO REACTION/LIKE BÀI VIẾT =====
exports.sendPostReactionNotification = functions.firestore
  .document('posts/{postId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const postId = context.params.postId;
      
      const beforeReactions = before.reactions || {};
      const afterReactions = after.reactions || {};
      
      // Check nếu có reaction mới
      const newReactors = Object.keys(afterReactions).filter(
        uid => !beforeReactions[uid]
      );
      
      if (newReactors.length === 0) return null;
      
      // Chỉ thông báo cho tác giả bài viết
      const authorId = after.userId;
      const reactorId = newReactors[0];
      
      // Không thông báo nếu tác giả tự react
      if (authorId === reactorId) return null;
      
      // Lấy thông tin người react
      const reactorDoc = await admin.firestore()
        .collection('users')
        .doc(reactorId)
        .get();
      
      if (!reactorDoc.exists) return null;
      
      const reactorName = reactorDoc.data()?.name || 'Ai đó';
      const reactionType = afterReactions[reactorId].type || 'like';
      
      // Lấy FCM token của tác giả
      const authorDoc = await admin.firestore()
        .collection('users')
        .doc(authorId)
        .get();
      
      const fcmToken = authorDoc.data()?.fcmToken;
      if (!fcmToken) return null;
      
      // Map reaction type to emoji
      const reactionEmoji = {
        like: '👍',
        love: '❤️',
        haha: '😂',
        wow: '😮',
        sad: '😢',
        angry: '😠',
      };
      
      const emoji = reactionEmoji[reactionType] || '👍';
      
      // Gửi thông báo
      const payload = {
        notification: {
          title: `${reactorName} đã thả ${emoji}`,
          body: after.content || 'bài viết của bạn',
        },
        data: {
          screen: 'PostDetail',
          postId: postId,
          reactorId: reactorId,
          type: 'post_reaction',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#006AF5',
            channelId: 'default',
          },
        },
      };
      
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log('Reaction notification sent:', response);
      
      return response;
    } catch (error) {
      console.error('Error sending reaction notification:', error);
      return null;
    }
  });
```

## Bước 5: Deploy Functions

```powershell
firebase deploy --only functions
```

Output sẽ như:
```
✔  Deploy complete!

Functions:
  - sendMessageNotification(us-central1)
  - sendFriendRequestNotification(us-central1)
  - sendNewPostNotification(us-central1)
  - sendPostReactionNotification(us-central1)
```

## Bước 6: Update NotificationContext.js

Xóa phần gửi notification từ client (vì giờ Cloud Functions tự động gửi):

```javascript
// KHÔNG CẦN gọi sendPushNotification trong Chat_fr.js nữa
// Cloud Functions sẽ tự động trigger khi có tin nhắn mới
```

## Bước 7: Test

1. **Rebuild APK**
```powershell
cd android
.\gradlew clean
.\gradlew app:assembleRelease
```

2. **Cài trên 2 máy và test:**
- ✅ Gửi tin nhắn → Notification tự động
- ✅ Gửi friend request → Notification tự động
- ✅ Đăng bài → Bạn bè nhận notification
- ✅ React bài viết → Tác giả nhận notification

## Monitoring

Xem logs của Cloud Functions:
```powershell
firebase functions:log
```

Hoặc trên Firebase Console:
```
https://console.firebase.google.com/ > Functions > Logs
```

## Lợi ích Cloud Functions

✅ **An toàn**: Server key không lộ trong APK
✅ **Tự động**: Không cần gọi từ client
✅ **Scalable**: Tự động scale theo usage
✅ **FCM V1**: Dùng API mới nhất
✅ **Free tier**: 125K invocations/month miễn phí

---

**Khuyến nghị**: Dùng Cloud Functions thay vì Legacy API!
