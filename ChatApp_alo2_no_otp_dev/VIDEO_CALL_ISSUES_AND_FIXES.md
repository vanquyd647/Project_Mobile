# 🚨 Video Call Issues Found & Fixes

## ❌ VẤN ĐỀ CHÍNH

### 1. **BUG CRITICAL: handleVideoCall gọi sai parameter UID**

```javascript
// ❌ HIỆN TẠI (Chat_fr.js line 1524)
<TouchableOpacity onPress={() => handleVideoCall(user.uid, uid, userData.name)}>
  <MaterialIcons name="video-call" size={30} color="white" />
</TouchableOpacity>

// ⚠️ PROBLEM:
// - uid = friendData?.UID ?? friendData2?.UID_fr ?? friendId
// - uid có thể là UNDEFINED trong các trường hợp:
//   1. Từ notification (chỉ có roomId)
//   2. Navigation từ Chat.js (không pass friendData/friendData2)
//   3. Group chat (không có uid concept)

// ✅ SOLUTION:
// Sử dụng finalFriendUID thay vì uid
```

### 2. **LOGIC BUG: handleVideoCall không kiểm tra uid**

```javascript
// ❌ HIỆN TẠI
const handleVideoCall = async (callerUid, recipientUid, callerName) => {
  if (!callerUid || !recipientUid) {  // recipientUid có thể là undefined!
    Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi. Vui lòng thử lại.');
    return;
  }
  // ... code continues
};

// ⚠️ VẤN ĐỀ:
// - Nếu uid undefined → recipientUid undefined
// - Hàm này vẫn pass check (vì check là "!recipientUid")
// - Nhưng navigation sẽ fail hoặc tạo roomId sai

// ✅ EXPECTED:
// Kiểm tra finalFriendUID trước khi gọi, hoặc tính toán lại
```

### 3. **Architecture Issue: Không có validation cho group chat**

```javascript
// ❌ HIỆN TẠI
<TouchableOpacity onPress={() => handleVideoCall(user.uid, uid, userData.name)}>
  // Video call button - CÓ THỂ CLICK NGAY CẢ KHI LÀ GROUP CHAT!
</TouchableOpacity>

// ⚠️ VẤN ĐỀ:
// - Group chat không support video call
// - Nhưng button vẫn show ra và click được
// - WebRTC sẽ fail vì không có "recipient"

// ✅ SOLUTION:
// Kiểm tra Name_group - nếu có thì disable video call button
```

---

## 📊 Flow Hiện Tại vs Expected

### ❌ HIỆN TẠI - CÓ LỖI

```
User click video call button
  ↓
handleVideoCall(user.uid, uid, userData.name)  ← uid có thể undefined!
  ↓
if (!callerUid || !recipientUid) check ← CÓ THỂ FAIL
  ↓
Fetch notification server
  ↓
Navigate to VideoCall với roomId mới tạo
  ↓
VideoCall screen:
  - generateRoomId() tạo roomId mới (bỏ passed roomId)
  - initiateCall() → set status = 'ringing' vào Firebase
  ↓
Recipient (Notification) → set incomingCall state
  ↓
Recipient navigate to VideoCall
  ↓
WebRTC start → offer/answer/ICE candidates
```

### ⚠️ CÁC VẤN ĐỀ TIỀM ẨN

1. **Không kiểm tra group chat** → button show trên group
2. **uid undefined** → roomId invalid hoặc crash
3. **RoomId mỗi lần gọi khác nhau** → không stable
4. **Không có đồng bộ roomId** → caller tạo roomId khác → recipient có roomId khác

---

## 🔧 CÁC FIXES CẦN LÀM

### Fix 1: Kiểm tra trước khi render video call button

```javascript
// ✅ TRONG Chat_fr.js HEADER
const isGroupChat = !!chatData?.Name_group || !!GroupData?.Name_group;
const canMakeVideoCall = !isGroupChat && (uid || finalFriendUID);

// Render conditionally
{canMakeVideoCall && (
  <TouchableOpacity onPress={() => handleVideoCall(user.uid, finalFriendUID, userData.name)}>
    <MaterialIcons name="video-call" size={30} color="white" />
  </TouchableOpacity>
)}
```

### Fix 2: Sử dụng finalFriendUID thay vì uid

```javascript
// ✅ THAY ĐỔI từ:
<TouchableOpacity onPress={() => handleVideoCall(user.uid, uid, userData.name)}>

// ✅ THÀNH:
<TouchableOpacity onPress={() => handleVideoCall(user.uid, finalFriendUID, userData.name)}>
```

### Fix 3: Validate recipientUid trong handleVideoCall

```javascript
// ✅ TRONG handleVideoCall
const handleVideoCall = async (callerUid, recipientUid, callerName) => {
  console.log('=== Starting Video Call ===');
  
  // Kiểm tra đầy đủ
  if (!callerUid || !recipientUid || callerUid === recipientUid) {
    Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi. Vui lòng thử lại.');
    return;
  }
  
  // ... rest of code
};
```

### Fix 4: Sử dụng stable roomId (tuỳ chọn)

```javascript
// ✅ THAY ROOMID GENERATION
// ❌ Hiện tại
const videoCallRoomId = `call_${callerUid}_${recipientUid}_${Date.now()}`;

// ✅ Tốt hơn
const sorted = [callerUid, recipientUid].sort();
const videoCallRoomId = `call_${sorted[0]}_${sorted[1]}`;
// Lợi ích: stable, có thể rejoin nếu disconnect
```

---

## 📋 Status Check

### ✅ Đã Hoàn Thành
- [x] WebRTC signaling framework (Firebase RTD)
- [x] Basic call flow (caller → recipient)
- [x] Notification setup
- [x] Accept/Decline UI

### ⚠️ Cần Fix Ngay
- [ ] **GROUP CHAT CHECK** - Disable video call button for groups
- [ ] **USE finalFriendUID** - Replace `uid` with `finalFriendUID`
- [ ] **VALIDATE recipientUid** - Add better validation

### 📌 Tuỳ Chọn (Nice to have)
- [ ] Stable roomId generation
- [ ] Better error messages
- [ ] Timeout handling improvements
- [ ] Real ringtone + vibration pattern

---

## 🎯 Action Items (Priority Order)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 🔴 **CRITICAL** | Group chat button disable | 5 min | High |
| 🔴 **CRITICAL** | Use finalFriendUID | 2 min | High |
| 🟠 **HIGH** | Validate recipientUid | 5 min | Medium |
| 🟡 **MEDIUM** | Stable roomId | 10 min | Medium |

---

## 📝 Test Scenarios

### Scenario 1: Normal 1-1 Chat
- User A clicks video call button
- Notification sent to User B
- User B receives incoming UI
- Both connect via WebRTC
- **Expected**: ✅ Works

### Scenario 2: Group Chat
- Multiple users in group
- Click video call button
- **Expected**: Button should be disabled/hidden
- **Current**: ❌ Button shows up

### Scenario 3: From Notification
- App killed, receive video call notification
- User taps notification
- App opens → navigate to VideoCall
- **Expected**: Should show incoming call UI
- **Current**: Need to verify roomId sync

---

## 🚀 Recommendation

**Do fixes trong order này:**
1. Disable video call button for groups (1 min)
2. Use finalFriendUID (1 min) 
3. Better validation (2 min)
4. Test all scenarios

**Estimated Total**: 10 minutes untuk full fix
