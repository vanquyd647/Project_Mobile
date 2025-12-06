# 📹 Kiểm tra Logic Video Call - So sánh với Facebook Messenger

## 📊 Tóm tắt hiện trạng

### ✅ Những gì đã thực hiện đúng

1. **Flow cơ bản (Initiator → Recipient)**
   - Người gọi (Initiator) tạo `roomId` unique: `call_${callerId}_${recipientId}_${timestamp}`
   - Lưu thông tin cuộc gọi vào Firebase Realtime Database (RTD) tại `calls/${roomId}`
   - Gửi push notification qua server riêng
   - Người nhận được thông báo và hiển thị incoming call UI

2. **Xử lý trạng thái cuộc gọi**
   - Trạng thái: `ringing` → `accepted` → `connected` → `ended/declined/cancelled`
   - Timeout 60 giây nếu không trả lời → tự động kết thúc
   - Vibration + Ringtone pattern cho incoming call

3. **WebRTC Infrastructure**
   - Sử dụng STUN servers (Google)
   - RTCPeerConnection với proper ICE candidate handling
   - Signaling qua Firebase RTD (offer/answer/candidates)

4. **Notification Channels**
   - Kênh video_call riêng biệt với priority MAX
   - Vibration pattern tùy chỉnh
   - Sound + Light notifications

### ⚠️ Vấn đề cần cải thiện

#### 1. **RoomId Generation - Không phù hợp như Messenger**
```javascript
// ❌ HIỆN TẠI
const videoCallRoomId = `call_${callerUid}_${recipientUid}_${Date.now()}`;

// 🎯 VẤN ĐỀ:
// - Tạo roomId mới mỗi lần gọi (không reuse)
// - Timestamp làm roomId dài + không stable
// - Không thể resume cuộc gọi nếu bị interrupt
```

**So sánh Facebook:**
- FB tạo roomId từ sorted UIDs: `call_${uid1_uid2}` (stable)
- Reuse cùng roomId cho cùng cặp users
- Cho phép rejoin nếu kết nối bị mất

#### 2. **Incoming Call Detection - Logic chưa hoàn hảo**
```javascript
// 📱 NotificationContext - Lắng nghe cuộc gọi
const startListeningForCalls = (userId) => {
  const callsRef = ref(database, 'calls');
  
  onValue(callsRef, (snapshot) => {
    const calls = snapshot.val();
    // ❌ VẤN ĐỀ: Lắng nghe TẤT CẢ calls, filter trong callback
    // Cồng kềnh + chậm + mất data nếu có nhiều calls
```

**So sánh Facebook:**
- Dùng query direct: `where(recipientId == currentUserId AND status == ringing)`
- Efficient + Realtime
- Khóa data ngay sau khi nhận (exclusive lock)

#### 3. **App Kill/Background Handling - Chưa tối ưu**
```javascript
// ❌ HIỆN TẠI
// Khi app bị kill:
// 1. Push notification → user tap
// 2. App reopen + lấy roomId từ notification
// 3. Fetch chat data
// 4. Navigate đến VideoCall
// ❌ VẤN ĐỀ: Delay ~ 2-5s, có thể miss cuộc gọi

// So sánh Facebook:
// 1. Push notification → user tap
// 2. App reopen → NGAY navigate đến VideoCall screen
// 3. Fetch all data parallel → nhanh hơn
```

#### 4. **Accept/Decline Logic - Không reject confirmed**
```javascript
// ❌ HIỆN TẠI
const acceptCall = async () => {
  // Người nhận set status = 'accepted'
  // Người gọi lắng nghe + start WebRTC
  // ⚠️ Race condition: nếu cùng lúc accept + decline?
};

const declineCall = async () => {
  // Chỉ set status = 'declined'
  // ❌ Không validate xem có đã accepted chưa
};

// So sánh Facebook:
// - Atomic transaction khi decline
// - Check: if (status != 'ringing') throw error
// - Prevent double-accept/decline
```

#### 5. **Ringtone/Vibration - Pattern chưa optimal**
```javascript
// ❌ HIỆN TẠI
Vibration.vibrate([0, 1000, 500, 1000], true);
// Pattern: wait 0ms → vibrate 1s → wait 0.5s → vibrate 1s
// ❌ Thiếu cancel mechanism, có thể drain battery

// So sánh Facebook:
// - Ringtone custom (actual audio file)
// - Vibration + Sound together
// - Stop immediately when answer
// - Better UX
```

---

## 📋 Chi tiết Implementation

### 1. **Luồng Gọi Video Hiện Tại**

```
┌─────────────────────────────────────────────────┐
│            CALLER (Initiator)                   │
├─────────────────────────────────────────────────┤
│ 1. handleVideoCall()                            │
│    - Tạo unique roomId                          │
│    - Gửi push notification                      │
│    - Navigate → VideoCall screen                │
│                                                 │
│ 2. VideoCall screen mount                       │
│    - initiateCall()                             │
│    - Set status = 'ringing'                     │
│    - Listen listenToCallStatus()                │
│    - Timeout 60s                                │
│                                                 │
│ 3. Lắng nghe người nhận accept                  │
│    - Status change = 'accepted'                 │
│    - startWebRTC()                              │
│    - createOffer()                              │
│    - setupSignaling()                           │
└─────────────────────────────────────────────────┘

                Firebase RTD
              ┌─────────────┐
              │ calls/{id}  │
              ├─────────────┤
              │ status ──────→ ringing
              │ offer ───────→ SDP...
              │ answer ──────→ SDP...
              │ candidates   │
              │ endCall      │
              └─────────────┘

┌─────────────────────────────────────────────────┐
│         RECIPIENT (Not Initiator)               │
├─────────────────────────────────────────────────┤
│ 1. NotificationContext                          │
│    - startListeningForCalls()                   │
│    - Detect cuộc gọi đến                        │
│    - Show incoming UI + vibration               │
│                                                 │
│ 2. User chọn accept/decline                     │
│    - acceptCall(): status = 'accepted'          │
│    - startWebRTC()                              │
│    - createAnswer()                             │
│                                                 │
│ 3. Nhận offer từ caller                         │
│    - setRemoteDescription(offer)                │
│    - Send answer                                │
└─────────────────────────────────────────────────┘
```

### 2. **Comparison với Facebook Messenger**

| Aspect | Hiện tại | Facebook Messenger |
|--------|----------|-------------------|
| **RoomId** | `call_{uid1}_{uid2}_{timestamp}` | `call_{uid1}_{uid2}` (stable) |
| **Query** | `onValue(allCalls)` | Query: `recipientId == me && status == ringing` |
| **Incoming Detection** | Real-time listener | Instant push → auto navigate |
| **Accept/Decline** | Simple status set | Atomic transaction + validation |
| **App Kill** | 2-5s delay | < 500ms (parallel fetch) |
| **Ringtone** | Vibration only | Audio + Vibration |
| **WebRTC Signaling** | Firebase RTD | Firebase RTD (✅ tương tự) |
| **Connection State** | Listener on status | Event-driven (✅ ok) |
| **Timeout** | 60s hardcoded | 30s + retry logic |

---

## 🔧 Khuyến nghị cải thiện

### Priority 1: Cách tạo RoomId (High Impact)
```javascript
// ✅ Đề xuất
const generateStableRoomId = (uid1, uid2) => {
  const sorted = [uid1, uid2].sort();
  return `call_${sorted[0]}_${sorted[1]}`;
};

// Lợi ích:
// - RoomId stable cho cặp users
// - Tái sử dụng cho rejoin
// - Ngắn gọn + dễ debug
```

### Priority 2: Query Incoming Calls (High Impact)
```javascript
// ❌ Hiện tại
onValue(ref(db, 'calls'), callback); // Lắng nghe tất cả

// ✅ Đề xuất
const callsQuery = query(
  ref(db, 'calls'),
  orderByChild('recipientId'),
  equalTo(userId)
);
onValue(callsQuery, (snap) => {
  const calls = snap.val();
  // Chỉ filter calls của mình
  Object.entries(calls).forEach(([id, call]) => {
    if (call.status === 'ringing') {
      showIncomingUI(call);
    }
  });
});
```

### Priority 3: Atomic Accept/Decline (Medium Impact)
```javascript
// ✅ Với Cloud Functions
exports.respondToCall = functions.https.onCall(async (data, context) => {
  const { roomId, action } = data;
  const userId = context.auth.uid;
  
  const callRef = admin.database().ref(`calls/${roomId}`);
  return callRef.transaction((call) => {
    if (!call) return; // Call sudah dihapus
    if (call.recipientId !== userId) return; // Bukan untuk saya
    if (call.status !== 'ringing') return; // Sudah ada respon
    
    return {
      ...call,
      status: action === 'accept' ? 'accepted' : 'declined',
      respondedAt: admin.database.ServerValue.TIMESTAMP
    };
  });
});
```

### Priority 4: Better Ringtone/Vibration (Low Impact)
```javascript
// ✅ Gunakan expo-av untuk audio
import { Audio } from 'expo-av';

const playRingtone = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/ringtone.mp3'),
      { isLooping: true }
    );
    await sound.playAsync();
    ringtoneRef.current = sound;
  } catch (err) {
    console.error('Error playing ringtone:', err);
  }
};

const stopRingtone = async () => {
  if (ringtoneRef.current) {
    await ringtoneRef.current.stopAsync();
    await ringtoneRef.current.unloadAsync();
  }
};
```

---

## 📝 Kesimpulan

### Poin Kuat ✅
- WebRTC implementation solid
- Firebase RTD signaling bekerja
- Notification flow implemented
- State management clear

### Poin Lemah ⚠️
- RoomId generation tidak optimal
- Incoming call query tidak efficient
- Atomic transactions tidak ada
- App resume/rejoin logic missing

### Action Items
1. ⚡ **Immediate**: Ubah roomId ke stable format
2. 🔍 **Short-term**: Optimize incoming call query
3. 🛡️ **Medium-term**: Add atomic accept/decline
4. 🎵 **Nice-to-have**: Real ringtone + vibration pattern

**Estimated effort**: 2-3 hari untuk semua improvements
**Risk**: Low (tidak mengubah core WebRTC logic)
