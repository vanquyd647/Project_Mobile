import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView, Pressable, StyleSheet, Text, View, Image, TouchableWithoutFeedback, Modal, TouchableOpacity, ActivityIndicator, Alert, Clipboard, Dimensions, Animated, PanResponder, FlatList, ScrollView } from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialCommunityIcons, Entypo, FontAwesome, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import { Video, Audio } from 'expo-av';
import { GiftedChat } from 'react-native-gifted-chat';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Linking } from 'react-native';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { useChats } from '../contextApi/ChatContext';
import { useNotifications } from '../contextApi/NotificationContext';
import { useToast } from '../contextApi/ToastContext';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, query, orderBy, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Regex để phát hiện URL trong text
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

// Các emoji reaction
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😠'];

// Component hiển thị ảnh trong chat theo phong cách Facebook
const ModernImageMessage = ({ imageUri, onPress, onLongPress, time, isCurrentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPress}
      activeOpacity={0.9}
      style={[styles.modernImageContainer, isCurrentUser ? styles.imageRight : styles.imageLeft]}
    >
      {loading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#006AF5" />
        </View>
      )}
      {error ? (
        <View style={styles.imageErrorContainer}>
          <Ionicons name="image-outline" size={40} color="#999" />
          <Text style={styles.imageErrorText}>Không thể tải ảnh</Text>
        </View>
      ) : (
        <Image
          source={{ uri: imageUri }}
          style={styles.modernImage}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
      <View style={[styles.imageTimeOverlay, isCurrentUser ? styles.timeRight : styles.timeLeft]}>
        <Text style={styles.imageTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Component hiển thị video trong chat theo phong cách Facebook
const ModernVideoMessage = ({ videoUri, onPress, onLongPress, time, isCurrentUser }) => {
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPress}
      activeOpacity={0.9}
      style={[styles.modernVideoContainer, isCurrentUser ? styles.imageRight : styles.imageLeft]}
    >
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.modernVideo}
        resizeMode="cover"
        shouldPlay={false}
        isMuted={true}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.videoLoadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <View style={styles.videoPlayButton}>
        <View style={styles.playButtonCircle}>
          <Ionicons name="play" size={30} color="#fff" />
        </View>
      </View>
      <View style={styles.videoDurationBadge}>
        <Ionicons name="videocam" size={12} color="#fff" />
        <Text style={styles.videoDurationText}>Video</Text>
      </View>
      <View style={[styles.imageTimeOverlay, isCurrentUser ? styles.timeRight : styles.timeLeft]}>
        <Text style={styles.imageTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Component hiển thị document trong chat theo phong cách Facebook
const ModernDocumentMessage = ({ documentUri, fileName, onPress, onLongPress, time, isCurrentUser }) => {
  const getFileIcon = () => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { icon: 'file-pdf-o', color: '#E74C3C' };
    if (['doc', 'docx'].includes(ext)) return { icon: 'file-word-o', color: '#2B579A' };
    if (['xls', 'xlsx'].includes(ext)) return { icon: 'file-excel-o', color: '#217346' };
    if (['ppt', 'pptx'].includes(ext)) return { icon: 'file-powerpoint-o', color: '#D24726' };
    if (['zip', 'rar', '7z'].includes(ext)) return { icon: 'file-archive-o', color: '#F39C12' };
    if (['mp3', 'wav', 'aac', 'm4a'].includes(ext)) return { icon: 'file-audio-o', color: '#9B59B6' };
    return { icon: 'file-o', color: '#95A5A6' };
  };

  const { icon, color } = getFileIcon();
  const fileSize = ''; // Could calculate if needed
  
  const truncateFileName = (name, maxLength = 25) => {
    if (!name) return 'Tài liệu';
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const baseName = name.substring(0, name.lastIndexOf('.'));
    return baseName.substring(0, maxLength - ext.length - 4) + '...' + ext;
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[styles.modernDocContainer, isCurrentUser ? styles.docRight : styles.docLeft]}
    >
      <View style={[styles.docIconContainer, { backgroundColor: color + '20' }]}>
        <FontAwesome name={icon} size={28} color={color} />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docName} numberOfLines={1}>{truncateFileName(fileName)}</Text>
        <Text style={styles.docMeta}>Nhấn để mở • {time}</Text>
      </View>
      <View style={styles.docDownloadIcon}>
        <Ionicons name="download-outline" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );
};

// Component hiển thị audio message trong chat
const ModernAudioMessage = ({ audioUri, duration, onPress, onLongPress, time, isCurrentUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(duration || 0);

  // Cleanup sound khi unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Load và play audio
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPlaybackPosition(status.positionMillis / 1000);
              if (status.durationMillis) {
                setPlaybackDuration(status.durationMillis / 1000);
              }
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPlaybackPosition(0);
              }
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  // Tạo waveform bars giả
  const waveformBars = Array.from({ length: 20 }, () => Math.random() * 20 + 5);

  return (
    <TouchableOpacity 
      onPress={onPress || handlePlayPause}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[
        styles.audioMessageContainer,
        isCurrentUser ? styles.audioRight : styles.audioLeft
      ]}
    >
      <TouchableOpacity 
        style={[styles.audioPlayBtn, { backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.3)' : '#006AF520' }]}
        onPress={handlePlayPause}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={24} 
          color={isCurrentUser ? "#fff" : "#006AF5"} 
        />
      </TouchableOpacity>
      
      <View style={styles.audioWaveform}>
        <View style={styles.audioWaveformBars}>
          {waveformBars.map((height, index) => (
            <View
              key={index}
              style={[
                styles.audioBar,
                { 
                  height: height,
                  backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.6)' : '#006AF550',
                  opacity: index / waveformBars.length <= (playbackPosition / playbackDuration) ? 1 : 0.4
                }
              ]}
            />
          ))}
        </View>
      </View>
      
      <Text style={[styles.audioDuration, { color: isCurrentUser ? 'rgba(255,255,255,0.8)' : '#666' }]}>
        {formatTime(isPlaying ? playbackPosition : playbackDuration)}
      </Text>
    </TouchableOpacity>
  );
};

// Component ImageViewer Modal - xem ảnh full màn hình với zoom và swipe
const ImageViewerModal = ({ visible, imageUri, onClose }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > 150) {
          onClose();
        }
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  const handleDoubleTap = () => {
    Animated.spring(scale, {
      toValue: scale._value > 1 ? 1 : 2,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity style={styles.imageViewerClose} onPress={onClose}>
          <AntDesign name="close" size={28} color="#fff" />
        </TouchableOpacity>
        
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.imageViewerContent,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableWithoutFeedback>
        </Animated.View>
        
        <View style={styles.imageViewerActions}>
          <TouchableOpacity style={styles.imageViewerAction} onPress={() => {
            Linking.openURL(imageUri);
          }}>
            <Ionicons name="download-outline" size={24} color="#fff" />
            <Text style={styles.imageViewerActionText}>Tải xuống</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageViewerAction} onPress={() => {
            // Share functionality
          }}>
            <Ionicons name="share-outline" size={24} color="#fff" />
            <Text style={styles.imageViewerActionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Component Attachment Menu - Menu chọn loại file gửi
const AttachmentMenu = ({ visible, onClose, onPickImage, onPickVideo, onPickDocument, onPickAudio }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const menuItems = [
    { icon: 'image', label: 'Hình ảnh', color: '#4CAF50', onPress: onPickImage },
    { icon: 'videocam', label: 'Video', color: '#E91E63', onPress: onPickVideo },
    { icon: 'document-text', label: 'Tài liệu', color: '#2196F3', onPress: onPickDocument },
    { icon: 'mic', label: 'Ghi âm', color: '#FF9800', onPress: onPickAudio },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.attachmentOverlay} onPress={onClose}>
        <Animated.View 
          style={[
            styles.attachmentMenu,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.attachmentHandle} />
          <Text style={styles.attachmentTitle}>Gửi tệp đính kèm</Text>
          <View style={styles.attachmentGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.attachmentItem}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentIconBg, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.attachmentLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};


const Chat_fr = () => {
  const { chats } = useChats();
  const { sendPushNotification, sendMessageNotification, clearAllNotifications } = useNotifications();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const route = useRoute();
  const { ID_room1, roomId, RoomID: RoomIDParam } = route.params || {};
  const { chatData: chatDataParam } = route.params || {};
  const { friendData } = route.params || {};
  const { friendData2 } = route.params || {};
  const { GroupData } = route.params || {};
  // Params from notification navigation
  const { friendId, friendName: friendNameParam, friendPhoto } = route.params || {};
  const [messages, setMessages] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const storage = getStorage();
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  
  // State for fetched chat data when navigating from notification
  const [fetchedChatData, setFetchedChatData] = useState(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  // Use fetched data if chatData is not provided (navigation from notification)
  const chatData = chatDataParam || fetchedChatData;
  const [UID, setUID] = useState(chatData ? chatData.UID : (GroupData ? GroupData.UID : null));
  const ChatData_props = chatData ? chatData : GroupData;
  
  // State để lưu UID của friend (dùng cho xem trang cá nhân)
  // Tính toán friendUID từ nhiều nguồn
  const [friendUID, setFriendUID] = useState(() => {
    console.log('=== Initializing friendUID ===');
    console.log('friendId:', friendId);
    console.log('friendData:', friendData);
    console.log('friendData2:', friendData2);
    console.log('chatDataParam:', chatDataParam);
    console.log('GroupData:', GroupData);
    console.log('user.uid:', auth.currentUser?.uid);
    
    // Ưu tiên các giá trị đã được truyền rõ ràng
    if (friendId) {
      console.log('Using friendId:', friendId);
      return friendId;
    }
    if (friendData?.UID) {
      console.log('Using friendData.UID:', friendData.UID);
      return friendData.UID;
    }
    if (friendData2?.UID_fr) {
      console.log('Using friendData2.UID_fr:', friendData2.UID_fr);
      return friendData2.UID_fr;
    }
    // Nếu có chatDataParam với otherUser (từ Chat.js)
    if (chatDataParam?.otherUser?.UID) {
      console.log('Using chatDataParam.otherUser.UID:', chatDataParam.otherUser.UID);
      return chatDataParam.otherUser.UID;
    }
    // Nếu có UID array và không phải group, tìm UID của người khác
    const uidArray = chatDataParam?.UID || GroupData?.UID;
    if (uidArray && Array.isArray(uidArray) && uidArray.length === 2 && !GroupData?.Name_group && !chatDataParam?.Name_group) {
      const currentUserUid = auth.currentUser?.uid;
      const otherUid = uidArray.find(uid => uid !== currentUserUid);
      console.log('Calculated from UID array:', otherUid);
      return otherUid || null;
    }
    console.log('No friendUID found');
    return null;
  });

  // Clear notifications when entering chat
  useEffect(() => {
    clearAllNotifications();
  }, []);

  // Kiểm tra nếu `ID_room1` là `null` hoặc `undefined`, sử dụng các params khác
  const RoomID = ID_room1 || roomId || RoomIDParam || (friendData2 && friendData2.ID_roomChat) || (GroupData && GroupData.ID_roomChat);

  // Fetch chat data if navigating from notification (only roomId provided)
  useEffect(() => {
    const fetchChatDataFromRoom = async () => {
      // Only fetch if we have roomId but no chatData
      if (RoomID && !chatDataParam && !GroupData && !friendData2) {
        setIsLoadingChat(true);
        try {
          console.log('Fetching chat data for room:', RoomID);
          const chatRef = doc(db, 'Chats', RoomID);
          const chatSnap = await getDoc(chatRef);
          
          if (chatSnap.exists()) {
            const data = chatSnap.data();
            console.log('Fetched chat data:', data);
            
            // If this is a 1-1 chat (not group), get the other user's info
            let senderName = friendNameParam;
            let senderPhoto = friendPhoto;
            
            if (!data.Name_group && data.UID && data.UID.length === 2) {
              // 1-1 chat: find the other user
              const otherUserId = data.UID.find(uid => uid !== user?.uid) || friendId;
              // Cập nhật friendUID để xem trang cá nhân
              if (otherUserId) {
                setFriendUID(otherUserId);
              }
              if (otherUserId && (!senderName || !senderPhoto)) {
                try {
                  const userRef = doc(db, 'users', otherUserId);
                  const userSnap = await getDoc(userRef);
                  if (userSnap.exists()) {
                    const otherUserData = userSnap.data();
                    senderName = senderName || otherUserData.name;
                    senderPhoto = senderPhoto || otherUserData.profileImageUrl || otherUserData.photoURL;
                    console.log('Got other user info:', senderName, senderPhoto);
                  }
                } catch (e) {
                  console.log('Error fetching other user:', e);
                }
              }
            }
            
            setFetchedChatData({
              ...data,
              ID_roomChat: RoomID,
              senderName,
              senderPhoto,
            });
            setUID(data.UID || []);
          } else {
            console.log('Chat room not found:', RoomID);
          }
        } catch (error) {
          console.error('Error fetching chat data:', error);
        } finally {
          setIsLoadingChat(false);
        }
      }
    };
    
    fetchChatDataFromRoom();
  }, [RoomID, chatDataParam, GroupData, friendData2, db, user?.uid, friendId, friendNameParam, friendPhoto]);

  console.log("UIDdddd", UID);
  console.log("screen chatfr");
  console.log("chatData", chatData);
  console.log("RoomID", RoomID);

  // Avatar: try all possible sources including notification params
  const avatar = chatData?.Photo_group 
    ? chatData.Photo_group 
    : (friendData2?.photoUrl 
      ? friendData2.photoUrl 
      : (GroupData?.Photo_group 
        ? GroupData.Photo_group 
        : (friendData?.photoURL 
          ? friendData.photoURL 
          : (friendPhoto || fetchedChatData?.senderPhoto))));
  
  // Name: try all possible sources including notification params  
  const name = chatData?.Name_group 
    ? chatData.Name_group 
    : (friendData2?.name 
      ? friendData2.name 
      : (GroupData?.Name_group 
        ? GroupData.Name_group 
        : (friendData?.name 
          ? friendData.name 
          : (friendNameParam || fetchedChatData?.senderName || 'Đang tải...'))));
  const Admin_group = chatData?.Admin_group ? chatData.Admin_group : (GroupData?.Admin_group ? GroupData.Admin_group : null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        if (userDocSnap.exists()) {
          setUserData(userData);
          console.log("userData", userData);
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
    return () => {
      setUserData(null); // Xóa dữ liệu người dùng khi rời khỏi màn hình
    };
  }, [db, user.uid]);

  useEffect(() => {
    const fetchChatMessages = async () => {
      try {
        console.log("RoomID", RoomID)
        const chatRoomId = RoomID;
        const chatRoomRef = doc(db, 'Chats', chatRoomId);
        const chatRoomSnapshot = await getDoc(chatRoomRef);

        if (chatRoomSnapshot.exists()) {
          const chatRoomData = chatRoomSnapshot.data();
          const detailDelete = chatRoomData.detailDelete || [];
          let latestDeleteDetail;

          // Tìm phần tử có timeDelete mới nhất của người dùng hiện tại
          detailDelete.forEach(detail => {
            if (detail.uidDelete === user?.uid) {
              if (!latestDeleteDetail || detail.timeDelete.toDate() > latestDeleteDetail.timeDelete.toDate()) {
                latestDeleteDetail = detail;
                console.log('1');
              }
            }
          });

          const chatMessRef = collection(db, 'Chats', chatRoomId, 'chat_mess');
          const q = query(chatMessRef, orderBy('createdAt', 'desc'));
          const unsubscribe = onSnapshot(q, snapshot => {
            const messages = [];
            snapshot.forEach(doc => {
              const data = doc.data();

              // Kiểm tra mảng deleteDetail_mess của từng tin nhắn
              const deleteDetailMess = data.deleteDetail_mess || [];
              const isDeletedForCurrentUser = deleteDetailMess.some(detail => detail.uidDelete === user?.uid);

              if (!latestDeleteDetail || data.createdAt.toDate() > latestDeleteDetail.timeDelete.toDate()) {
                if (!isDeletedForCurrentUser) {
                  messages.push({
                    _id: doc.id,
                    createdAt: data.createdAt.toDate(),
                    text: data.text,
                    user: data.user,
                    image: data.image,
                    video: data.video,
                    document: data.document,
                    reactions: data.reactions || {},
                    isRecalled: data.isRecalled || false
                  });
                }
              }
            });
            setMessages(messages);
            console.log('2');
            console.log("danh sach tin nhan", messages);
          });
          return unsubscribe;
        }
      } catch (error) {
        console.error('Error fetching chat messages:', error);
      }
    };

    const unsubscribe = fetchChatMessages();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      setMessages([]); // Xóa dữ liệu tin nhắn khi rời khỏi màn hình
    };
  }, [db, user?.uid]);

  // const sendNotification = async (recipientUid) => {
  //   try {
  //     const token = await messaging().getToken();
  //     // Gửi thông báo đến thiết bị có token tương ứng
  //     await messaging().send({
  //       token: recipientToken,
  //       notification: {
  //         title: 'Bạn có tin nhắn mới',
  //         body: 'Nhấp để xem chi tiết.',
  //       },
  //     });
  //     console.log('Đã gửi thông báo đến thiết bị người nhận.');
  //   } catch (error) {
  //     console.error('Lỗi khi gửi thông báo:', error);
  //   }
  // };

  const onSend = useCallback(async (messages = []) => {
    const messageToSend = messages[0];
    if (!messageToSend) {
      return;
    }

    // Nếu đang trả lời một tin nhắn, thêm nội dung của tin nhắn đó vào tin nhắn mới
    const text = replyingToMessage ? `[${replyingToMessage.user.name}: ${replyingToMessage.text}]\n\n${messageToSend.text}` : messageToSend.text;
    setReplyingToMessage(null);
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages)
    );

    const { _id, createdAt, user, image, video, document } = messageToSend;
    const chatRoomId = RoomID;

    const chatMessRef = collection(db, 'Chats', chatRoomId, 'chat_mess');

    try {
      let imageDownloadURL = null;
      let videoDownloadURL = null;
      let documentDownloadURL = null;
      let imageContentType = null;
      let videoContentType = null;
      let documentContentType = null;

      if (image) {
        imageContentType = 'image/jpeg'; // giả sử ảnh luôn là định dạng jpeg cho đơn giản
        imageDownloadURL = await uploadFileToFirebaseStorage(image, auth.currentUser?.uid, imageContentType);
      }
      if (video) {
        videoContentType = 'video/mp4'; // giả sử video luôn là định dạng mp4 cho đơn giản
        videoDownloadURL = await uploadFileToFirebaseStorage(video, auth.currentUser?.uid, videoContentType);
      }
      if (document) {
        documentContentType = getFileType(document.fileName);
        // Giả sử `document.fileName` chứa tên tệp
        documentDownloadURL = await uploadFileToFirebaseStorage(document.uri, auth.currentUser?.uid, documentContentType, document.fileName);
      }

      // Nếu replyingToMessage có video, ảnh và tài liệu, cập nhật trường tương ứng
      if (replyingToMessage) {
        if (replyingToMessage.image) {
          imageDownloadURL = replyingToMessage.image;

        }
        if (replyingToMessage.video) {
          videoDownloadURL = replyingToMessage.video;

        }
        if (replyingToMessage.document) {
          documentDownloadURL = replyingToMessage.document;

        }
      }

      addDoc(chatMessRef, {
        _id,
        createdAt,
        text: text || '',
        user,
        image: imageDownloadURL,
        video: videoDownloadURL,
        document: documentDownloadURL,
        imageContentType,
        videoContentType,
        documentContentType
      });
      
      // Gửi notification thủ công nếu không dùng Cloud Functions
      const currentUserId = auth.currentUser?.uid;
      if (RoomID && currentUserId) {
        console.log('sendMessageNotification params:', {
          chatId: RoomID,
          senderId: currentUserId,
          senderName: userData?.name || auth.currentUser?.displayName,
          text: text || '[Media]'
        });
        sendMessageNotification(RoomID, currentUserId, userData?.name || auth.currentUser?.displayName, text || '[Media]');
      } else {
        console.warn('Cannot send notification: RoomID or currentUserId is missing', { RoomID, uid: currentUserId });
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  }, [db, auth.currentUser?.uid, friendData?.UID, replyingToMessage, userData, GroupData, RoomID]);



  const uploadFileToFirebaseStorage = async (file, uid, contentType, filename) => {
    const response = await fetch(file);
    const blob = await response.blob();

    const extension = file.split('.').pop(); // Lấy phần mở rộng của file
    let storagePath;
    if (contentType.startsWith('image')) {
      storagePath = `images/${uid}/${new Date().getTime()}.${extension}`;
    } else if (contentType.startsWith('video')) {
      storagePath = `videos/${uid}/${new Date().getTime()}.${extension}`;
    } else if (contentType.startsWith('application')) {
      storagePath = `documents/${uid}/${filename}`;
    } else {
      throw new Error('Unsupported content type');
    }

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);
    console.log("Upload complete");
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.cancelled) {
        console.log(result);
        const type = result.assets[0].type;
        const text = type.startsWith('video') ? '[Video]' : '[Hình ảnh]';
        const media = type.startsWith('video') ? 'video' : 'image';
        onSend([{
          _id: Math.random().toString(),
          createdAt: new Date(),
          user: {
            _id: auth?.currentUser?.uid,
            avatar: userData?.photoURL || 'default_avatar_url',
            name: userData?.name || 'No Name',
          },
          text: text,
          [media]: result.assets[0].uri // Sử dụng [media] để chọn key là 'image' hoặc 'video' tùy thuộc vào loại nội dung
        }]);
      }
    } catch {
      console.log('Error picking file:');
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    console.log(result);
    if (!result.cancelled) {
      const uri = result.assets[0].uri;
      console.log(uri);
      const nameFile = result.assets[0].name;
      console.log(nameFile);
      const fileName = nameFile;  // Lấy tên tệp từ đường dẫn URI uri.split('/').pop();
      const message = nameFile; //'[Tài liệu]'
      const extension = getFileExtension(fileName); // Lấy phần mở rộng của tên tệp
      if (!isImageFile(extension) && !isVideoFile(extension)) { // Kiểm tra xem tệp có phải là hình ảnh hoặc video không
        const type = getFileType(extension); // Lấy kiểu tệp dựa trên phần mở rộng của tên tệp
        onSend([
          {
            _id: Math.random().toString(),
            createdAt: new Date(),
            user: {
              _id: auth.currentUser?.uid,
              avatar: userData?.photoURL || 'default_avatar_url',
              name: userData?.name || 'No Name',
            },
            text: message,
            document: { uri, fileName, type } // Đính kèm thông tin về tài liệu
          }
        ]);
      } else {
        console.log("Selected file is an image or video. Please select a document.");
      }
    } else {
      console.log("No document selected");
    }
  };

  // Hàm để lấy phần mở rộng của tên tệp
  const getFileExtension = (fileName) => {
    return fileName.split('.').pop().toLowerCase();
  };
  // Hàm kiểm tra xem phần mở rộng của tên tệp có phải là hình ảnh không
  const isImageFile = (extension) => {
    return extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif';
  };
  // Hàm kiểm tra xem phần mở rộng của tên tệp có phải là video không
  const isVideoFile = (extension) => {
    return extension === 'mp4' || extension === 'mov' || extension === 'avi' || extension === 'mkv';
  };
  // Hàm để lấy kiểu tệp dựa trên phần mở rộng của tên tệp
  const getFileType = (extension) => {
    if (extension === 'pdf') {
      return 'application/pdf';
    } else if (extension === 'doc' || extension === 'docx') {
      return 'application/msword';
    } else if (extension === 'xls' || extension === 'xlsx') {
      return 'application/vnd.ms-excel';
    } else if (extension === 'ppt' || extension === 'pptx') {
      return 'application/vnd.ms-powerpoint';
    } else {
      return 'application/octet-stream'; // Kiểu mặc định nếu không xác định được
    }
  };

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setImageViewerVisible(true);
    console.log(imageUri);
  };

  const handleVideoPress = (videoUri) => {
    navigation.navigate('PlayVideo', { uri: videoUri });
    console.log(videoUri);
  };

  // Pick image only
  const pickImageOnly = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      if (!result.cancelled && result.assets) {
        // Gửi từng ảnh
        for (const asset of result.assets) {
          onSend([{
            _id: Math.random().toString(),
            createdAt: new Date(),
            user: {
              _id: auth?.currentUser?.uid,
              avatar: userData?.photoURL || 'default_avatar_url',
              name: userData?.name || 'No Name',
            },
            text: '[Hình ảnh]',
            image: asset.uri
          }]);
        }
      }
    } catch (err) {
      console.log('Error picking image:', err);
    }
  };

  // Pick video only
  const pickVideoOnly = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.cancelled && result.assets) {
        onSend([{
          _id: Math.random().toString(),
          createdAt: new Date(),
          user: {
            _id: auth?.currentUser?.uid,
            avatar: userData?.photoURL || 'default_avatar_url',
            name: userData?.name || 'No Name',
          },
          text: '[Video]',
          video: result.assets[0].uri
        }]);
      }
    } catch (err) {
      console.log('Error picking video:', err);
    }
  };

  // Pick audio from device
  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
      });
      if (!result.cancelled && result.assets) {
        const asset = result.assets[0];
        onSend([{
          _id: Math.random().toString(),
          createdAt: new Date(),
          user: {
            _id: auth?.currentUser?.uid,
            avatar: userData?.photoURL || 'default_avatar_url',
            name: userData?.name || 'No Name',
          },
          text: asset.name || '[Audio]',
          audio: asset.uri,
          audioDuration: 0
        }]);
      }
    } catch (err) {
      console.log('Error picking audio:', err);
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      // Xin quyền ghi âm
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Thông báo', 'Cần cấp quyền ghi âm để sử dụng tính năng này');
        return;
      }

      // Cấu hình audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Bắt đầu ghi âm
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer để đếm thời gian
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Lỗi khi ghi âm:', err);
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm. Vui lòng thử lại.');
    }
  };

  // Stop Recording
  const stopRecording = async () => {
    try {
      if (!recording) return;

      // Dừng timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Dừng và lấy file
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        // Gửi tin nhắn audio
        const duration = recordingDuration;
        onSend([{
          _id: Math.random().toString(),
          createdAt: new Date(),
          user: {
            _id: auth?.currentUser?.uid,
            avatar: userData?.photoURL || 'default_avatar_url',
            name: userData?.name || 'No Name',
          },
          text: `🎤 Tin nhắn thoại (${formatDuration(duration)})`,
          audio: uri,
          audioDuration: duration
        }]);
      }

      setRecordingDuration(0);

    } catch (err) {
      console.error('Lỗi khi dừng ghi âm:', err);
      Alert.alert('Lỗi', 'Không thể dừng ghi âm. Vui lòng thử lại.');
    }
  };

  // Cancel Recording
  const cancelRecording = async () => {
    try {
      if (!recording) return;

      // Dừng timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Dừng ghi âm mà không gửi
      await recording.stopAndUnloadAsync();
      
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);

    } catch (err) {
      console.error('Lỗi khi hủy ghi âm:', err);
    }
  };

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleDocumentPress = (documentUri) => {
    console.log("Document URI:", documentUri);
    Linking.openURL(documentUri).catch(err => console.error('An error occurred', err));
  };

  // Mở URL trong tin nhắn
  const handleUrlPress = (url) => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    
    Alert.alert(
      'Mở liên kết',
      `Bạn có muốn mở liên kết này?\n\n${finalUrl}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Mở', 
          onPress: () => Linking.openURL(finalUrl).catch(err => {
            showToast('Không thể mở liên kết', 'error');
            console.error('Error opening URL:', err);
          })
        }
      ]
    );
  };

  // Copy tin nhắn vào clipboard
  const handleCopyMessage = (text) => {
    if (text && text !== "Tin nhắn đã được thu hồi!") {
      Clipboard.setString(text);
      showToast('Đã sao chép tin nhắn', 'success');
      setModalVisible(false);
    } else {
      showToast('Không thể sao chép tin nhắn này', 'error');
    }
  };

  // Thêm reaction vào tin nhắn
  const handleAddReaction = async (messageId, reaction) => {
    try {
      const chatMessRef = doc(db, 'Chats', RoomID, 'chat_mess', messageId);
      const currentUserId = auth.currentUser?.uid;
      
      // Lấy tin nhắn hiện tại
      const messageSnap = await getDoc(chatMessRef);
      if (messageSnap.exists()) {
        const messageData = messageSnap.data();
        const reactions = messageData.reactions || {};
        
        // Kiểm tra nếu user đã react với emoji này
        const userReactions = reactions[reaction] || [];
        const hasReacted = userReactions.includes(currentUserId);
        
        if (hasReacted) {
          // Bỏ reaction
          await updateDoc(chatMessRef, {
            [`reactions.${reaction}`]: arrayRemove(currentUserId)
          });
        } else {
          // Thêm reaction
          await updateDoc(chatMessRef, {
            [`reactions.${reaction}`]: arrayUnion(currentUserId)
          });
        }
      }
      
      setReactionModalVisible(false);
      setSelectedMessageForReaction(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  // Render text với clickable URLs
  const renderMessageText = (text, isCurrentUser) => {
    if (!text) return null;
    
    const parts = text.split(URL_REGEX);
    const matches = text.match(URL_REGEX) || [];
    
    if (matches.length === 0) {
      return <Text style={{ fontSize: 16, margin: 5 }}>{text}</Text>;
    }
    
    let matchIndex = 0;
    return (
      <Text style={{ fontSize: 16, margin: 5 }}>
        {parts.map((part, index) => {
          if (matches.includes(part)) {
            const url = part;
            matchIndex++;
            return (
              <Text
                key={index}
                style={{ color: '#006AF5', textDecorationLine: 'underline' }}
                onPress={() => handleUrlPress(url)}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  // Render reactions cho tin nhắn
  const renderReactions = (reactions, messageId) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    
    const reactionEntries = Object.entries(reactions).filter(([_, users]) => users && users.length > 0);
    if (reactionEntries.length === 0) return null;
    
    return (
      <View style={styles.reactionsContainer}>
        {reactionEntries.map(([emoji, users]) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionBadge}
            onPress={() => handleAddReaction(messageId, emoji)}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={styles.reactionCount}>{users.length}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const setModalVisibility = (isVisible, messageData) => {
    console.log('messageData', messageData)
    setModalData(messageData);
    setModalVisible(isVisible);
  };

  // Mở modal reaction
  const openReactionModal = (message) => {
    setSelectedMessageForReaction(message);
    setReactionModalVisible(true);
  };

  // Thời gian tối đa cho phép thu hồi tin nhắn (10 phút = 600000 ms)
  const RECALL_TIME_LIMIT = 10 * 60 * 1000;

  const handleRecallMeseage = async (messageId, messageCreatedAt) => {
    try {
      const chatRoomId = RoomID;
      const chatMessRef = doc(db, 'Chats', chatRoomId, 'chat_mess', messageId);

      // Kiểm tra thời gian tin nhắn - lấy từ modalData nếu không có param
      let messageTime = messageCreatedAt;
      if (!messageTime && modalData) {
        messageTime = modalData.createdAt;
      }
      
      if (messageTime) {
        const now = new Date();
        const msgTime = messageTime instanceof Date ? messageTime : new Date(messageTime);
        const timeDiff = now - msgTime;
        
        if (timeDiff > RECALL_TIME_LIMIT) {
          Alert.alert(
            'Không thể thu hồi',
            'Chỉ có thể thu hồi tin nhắn trong vòng 10 phút sau khi gửi.',
            [{ text: 'Đã hiểu', style: 'default' }]
          );
          setModalVisible(false);
          return;
        }
      }

      // Xác nhận thu hồi
      Alert.alert(
        'Thu hồi tin nhắn',
        'Tin nhắn sẽ bị thu hồi với tất cả mọi người trong đoạn chat. Bạn có chắc chắn?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Thu hồi',
            style: 'destructive',
            onPress: async () => {
              await updateDoc(chatMessRef, {
                text: "Tin nhắn đã được thu hồi!",
                video: "",
                image: "",
                document: "",
                isRecalled: true,
                recalledAt: new Date(),
                recalledBy: auth.currentUser?.uid,
              });
              showToast('Đã thu hồi tin nhắn', 'success');
              console.log("Message recalled successfully");
              setModalVisible(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error recalling message:", error);
      showToast('Không thể thu hồi tin nhắn', 'error');
    }
  };


  const handleDeleteMeseage = async (messageId) => {
    console.log('messageId', messageId)
    try {
      const chatRoomId = RoomID;
      const timeDelete_mess = new Date();
      const uidDelete_mess = userData.UID;
      const chatMessRef = doc(db, 'Chats', chatRoomId, 'chat_mess', messageId);
      // Tạo đối tượng chứa timeDelete và uidDelete
      const deleteDetail_mess = {
        timeDelete: timeDelete_mess,
        uidDelete: uidDelete_mess
      };
      // Lấy dữ liệu hiện tại của tài liệu chatMessRef
      const chatMessSnapshot = await getDoc(chatMessRef);
      if (chatMessSnapshot.exists()) {
        const chatMessData = chatMessSnapshot.data();
        // Kiểm tra xem đã có mảng detailDelete chưa
        const detailDelete_mess_Array = chatMessData.deleteDetail_mess || [];
        // Thêm deleteDetail vào mảng detailDelete
        detailDelete_mess_Array.push(deleteDetail_mess);
        // Cập nhật tài liệu chatMessRef với mảng detailDelete mới
        await updateDoc(chatMessRef, {
          deleteDetail_mess: detailDelete_mess_Array
        });
        setModalVisible(false);
        console.log("Successfully added timeDelete to Chat with chatRoomId:", chatRoomId);
      } else {
        console.log("Chat with chatRoomId:", chatRoomId, "does not exist.");
      }
    } catch (error) {
      console.error("Error adding timeDelete to Chat:", error);
    }
  };

  const handleForwardMessage = (messageData) => {
    console.log("Forwarding message:", messageData);
    setModalVisible(false);
    // Chuyển đổi createdAt thành chuỗi thời gian
    const createdAtString = messageData.createdAt.toISOString();
    // Tạo thông tin mới cho tin nhắn

    const forwardedMessage = {
      _id: messageData._id,
      createdAt: createdAtString,
      text: messageData.text || '', // Có thể cần điều chỉnh tùy thuộc vào loại tin nhắn
      user: {
        _id: auth?.currentUser?.uid,
        avatar: userData?.photoURL || 'default_avatar_url',
        name: userData?.name || 'No Name',
      },
      image: messageData.image || null,
      video: messageData.video || null,
      document: messageData.document || null,
    };

    navigation.navigate('Forward_message', { messageData: forwardedMessage, chats: chats });
  };

  const handleReply = (message) => {
    console.log('message', message)
    // Set the replied message as the text input
    setReplyingToMessage(message);
    setModalVisible(false);
  };

  const renderSend = useCallback((props) => {
    if (props.text.trim().length === 0) {
      // Trả về null nếu không có giá trị nào được nhập vào
      return null;
    }

    // Nếu có giá trị nhập vào, thì hiển thị nút gửi
    return (
      <TouchableOpacity onPress={() => props.onSend({ text: props.text.trim() }, true)}>
        <FontAwesome
          name="send"
          size={24}
          color="blue"
          style={{ margin: 10 }}
        />
      </TouchableOpacity>
    );
  }, []);

  const uid = friendData?.UID ?? friendData2?.UID_fr ?? friendId;
  
  // Tính toán UID cuối cùng cho Option_chat
  const finalFriendUID = React.useMemo(() => {
    // Ưu tiên friendUID state (đã được tính toán)
    if (friendUID && friendUID !== user?.uid) return friendUID;
    // Fallback sang uid
    if (uid && uid !== user?.uid) return uid;
    // Thử tính từ chatDataParam.otherUser
    if (chatDataParam?.otherUser?.UID && chatDataParam.otherUser.UID !== user?.uid) {
      return chatDataParam.otherUser.UID;
    }
    // Thử tính từ UID array
    if (UID && Array.isArray(UID) && UID.length === 2) {
      return UID.find(id => id !== user?.uid);
    }
    return null;
  }, [friendUID, uid, chatDataParam, UID, user?.uid]);
  
  console.log('=== Final UID calculation ===');
  console.log('friendUID state:', friendUID);
  console.log('uid variable:', uid);
  console.log('finalFriendUID:', finalFriendUID);
  console.log('UID state:', UID);
  
  const handleVideoCall = async (callerUid, recipientUid, callerName) => {
    console.log('=== Starting Video Call ===');
    console.log('Caller UID:', callerUid);
    console.log('Recipient UID:', recipientUid);
    console.log('Caller Name:', callerName);
    
    // Kiểm tra đầy đủ
    if (!callerUid || !recipientUid || callerUid === recipientUid) {
      Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi. Vui lòng thử lại.');
      return;
    }
    
    // Kiểm tra không phải group chat
    const isGroup = !!chatData?.Name_group || !!GroupData?.Name_group;
    if (isGroup) {
      Alert.alert('Thông báo', 'Video call không được hỗ trợ cho cuộc trò chuyện nhóm.');
      return;
    }
    
    // Tạo roomId ổn định cho cặp người dùng (giống Messenger: reuse khi cùng cặp)
    const sortedUids = [callerUid, recipientUid].sort();
    const videoCallRoomId = `call_${sortedUids[0]}_${sortedUids[1]}`;
    console.log('Video Call Room ID (stable):', videoCallRoomId);
    
    // Gửi push notification đến người nhận qua server
    try {
      const response = await fetch('https://chatlofi-notification.onrender.com/api/notify/video-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: recipientUid,
          callerId: callerUid,
          callerName: callerName || userData?.name || 'Người dùng',
          roomId: videoCallRoomId,
        }),
      });
      
      const result = await response.json();
      console.log('Video call notification sent:', result);
    } catch (error) {
      console.error('Failed to send video call notification:', error);
      // Vẫn tiếp tục gọi dù notification fail
    }
    
    // Người gọi - isInitiator = true
    navigation.navigate('VideoCall', { 
      callerUid, 
      recipientUid, 
      callerName,
      recipientName: name, // Tên người nhận
      recipientAvatar: avatar, // Avatar người nhận
      isInitiator: true, // Đây là người khởi tạo cuộc gọi
      roomId: videoCallRoomId, // Pass roomId để đồng bộ với người nhận
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.searchContainer}>
          <Pressable onPress={() => navigation.navigate("Main")}>
            <AntDesign name="arrowleft" size={20} color="white" />
          </Pressable>
          <View style={styles.searchInput}>
            {isLoadingChat ? (
              <ActivityIndicator size="small" color="white" style={{ marginLeft: 15 }} />
            ) : (
              <Image
                source={{
                  uri: avatar || 'https://i.stack.imgur.com/l60Hf.png'
                }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.textSearch}>
              {isLoadingChat ? 'Đang tải...' : name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => handleVideoCall(user.uid, uid, userData.name)}>
              <MaterialIcons name="video-call" size={30} color="white" />
            </TouchableOpacity>
            <Pressable onPress={() => {
              console.log('=== Navigating to Option_chat ===');
              console.log('finalFriendUID:', finalFriendUID);
              console.log('UID:', UID);
              navigation.navigate("Option_chat", { 
                RoomID, 
                avatar, 
                name, 
                Admin_group, 
                UID, 
                ChatData_props,
                friendUID: finalFriendUID // Truyền friendUID để xem trang cá nhân
              });
            }}>
              <Feather style={{ marginLeft: 10 }} name="list" size={30} color="white" />
            </Pressable>
          </View>
        </View>
        <GiftedChat
          messages={messages}
          showAvatarForEveryMessage={false}
          showUserAvatar={false}
          renderSend={renderSend}
          onSend={messages => onSend(messages)}
          replyingToMessage={replyingToMessage}
          renderChatFooter={() => (
            replyingToMessage &&
            <View style={{ padding: 10, backgroundColor: '#eee' }}>
              <Text>{replyingToMessage.user.name}: {replyingToMessage.text}</Text>
            </View>
          )}
          messagesContainerStyle={{
            backgroundColor: '#e6e6fa'
          }}
          textInputStyle={{
            backgroundColor: '#fff',
            borderRadius: 20,
          }}
          user={{
            _id: auth?.currentUser?.uid,
            avatar: userData?.photoURL || 'default_avatar_url',
            name: userData?.name || 'No Name',
          }}
          renderActions={() => (
            isRecording ? (
              // Recording UI
              <View style={styles.recordingContainer}>
                <TouchableOpacity 
                  style={styles.cancelRecordBtn} 
                  onPress={cancelRecording}
                >
                  <Ionicons name="close" size={24} color="#FF3B30" />
                </TouchableOpacity>
                <View style={styles.recordingInfo}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Đang ghi âm</Text>
                  <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.sendRecordBtn} 
                  onPress={stopRecording}
                >
                  <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              // Normal Actions
              <View style={styles.modernActionsContainer}>
                <TouchableOpacity 
                  style={styles.modernActionBtn} 
                  onPress={() => setAttachmentMenuVisible(true)}
                >
                  <Ionicons name="add-circle" size={28} color="#006AF5" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modernActionBtn} onPress={pickImageOnly}>
                  <Ionicons name="image" size={26} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modernActionBtn} 
                  onPress={startRecording}
                  onLongPress={startRecording}
                >
                  <Ionicons name="mic" size={26} color="#FF9800" />
                </TouchableOpacity>
              </View>
            )
          )}
          renderMessage={(props) => {
            const isCurrentUser = props.currentMessage.user && props.currentMessage.user._id === auth?.currentUser?.uid;
            const previousSenderID = props.previousMessage && props.previousMessage.user && props.previousMessage.user._id;
            const isFirstMessageFromPreviousSender = previousSenderID !== props.currentMessage.user._id;
            // Kiểm tra xem có tin nhắn trước đó không và nếu có, kiểm tra xem ngày của tin nhắn trước đó có trùng với ngày của tin nhắn hiện tại không
            const isSameDayAsPreviousMessage = props.previousMessage && props.previousMessage.createdAt && props.previousMessage.createdAt.toDateString() === props.currentMessage.createdAt.toDateString();
            const messageTime = `${String(props.currentMessage.createdAt.getHours()).padStart(2, '0')}:${String(props.currentMessage.createdAt.getMinutes()).padStart(2, '0')}`;
            
            return (
              <View>
                {/* Hiển thị ngày chỉ một lần cho mỗi ngày */}
                {!isSameDayAsPreviousMessage && (
                  <View style={styles.dateSeparator}>
                    <View style={styles.dateLine} />
                    <Text style={styles.dateText}>
                      {props.currentMessage.createdAt.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                    <View style={styles.dateLine} />
                  </View>
                )}
                <Pressable onLongPress={() => setModalVisibility(true, props.currentMessage)}>
                  <View style={[styles.messageRow, isCurrentUser ? styles.messageRowRight : styles.messageRowLeft]}>
                    {!isCurrentUser && isFirstMessageFromPreviousSender && props.currentMessage.user && (
                      <Image
                        source={{ uri: props.currentMessage.user.avatar }}
                        style={styles.messageAvatar}
                      />
                    )}
                    {!isCurrentUser && !isFirstMessageFromPreviousSender && (
                      <View style={styles.avatarPlaceholder} />
                    )}
                    <View style={styles.messageContent}>
                      {isFirstMessageFromPreviousSender && !isCurrentUser && props.currentMessage.user && (
                        <Text style={styles.senderName}>{props.currentMessage.user.name}</Text>
                      )}
                      
                      {/* Audio Message */}
                      {props.currentMessage.audio ? (
                        <View>
                          <ModernAudioMessage
                            audioUri={props.currentMessage.audio}
                            duration={props.currentMessage.audioDuration || 0}
                            onLongPress={() => setModalVisibility(true, props.currentMessage)}
                            time={messageTime}
                            isCurrentUser={isCurrentUser}
                          />
                          {/* Reactions */}
                          {props.currentMessage.reactions && Object.keys(props.currentMessage.reactions).length > 0 && 
                            renderReactions(props.currentMessage.reactions, props.currentMessage._id)}
                        </View>
                      ) : props.currentMessage.document ? (
                        /* Document Message */
                        <ModernDocumentMessage
                          documentUri={props.currentMessage.document}
                          fileName={props.currentMessage.text}
                          onPress={() => handleDocumentPress(props.currentMessage.document)}
                          onLongPress={() => setModalVisibility(true, props.currentMessage)}
                          time={messageTime}
                          isCurrentUser={isCurrentUser}
                        />
                      ) : props.currentMessage.image ? (
                        /* Image Message */
                        <View>
                          <ModernImageMessage
                            imageUri={props.currentMessage.image}
                            onPress={() => handleImagePress(props.currentMessage.image)}
                            onLongPress={() => setModalVisibility(true, props.currentMessage)}
                            time={messageTime}
                            isCurrentUser={isCurrentUser}
                          />
                          {/* Reactions */}
                          {props.currentMessage.reactions && Object.keys(props.currentMessage.reactions).length > 0 && 
                            renderReactions(props.currentMessage.reactions, props.currentMessage._id)}
                        </View>
                      ) : props.currentMessage.video ? (
                        /* Video Message */
                        <View>
                          <ModernVideoMessage
                            videoUri={props.currentMessage.video}
                            onPress={() => handleVideoPress(props.currentMessage.video)}
                            onLongPress={() => setModalVisibility(true, props.currentMessage)}
                            time={messageTime}
                            isCurrentUser={isCurrentUser}
                          />
                          {/* Reactions */}
                          {props.currentMessage.reactions && Object.keys(props.currentMessage.reactions).length > 0 && 
                            renderReactions(props.currentMessage.reactions, props.currentMessage._id)}
                        </View>
                      ) : (
                        /* Text Message */
                        <View style={{ position: 'relative' }}>
                          <View style={[
                            styles.modernTextBubble,
                            isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
                            isFirstMessageFromPreviousSender ? {} : { marginLeft: isCurrentUser ? 0 : 0 }
                          ]}>
                            {props.currentMessage.isRecalled ? (
                              <View style={styles.recalledMessage}>
                                <Ionicons name="refresh" size={14} color="#999" />
                                <Text style={styles.recalledText}>Tin nhắn đã được thu hồi</Text>
                              </View>
                            ) : (
                              <>
                                {renderMessageText(props.currentMessage.text, isCurrentUser)}
                                <Text style={[styles.messageTime, isCurrentUser ? styles.timeRight2 : styles.timeLeft2]}>
                                  {messageTime}
                                </Text>
                              </>
                            )}
                          </View>
                          {/* Reactions */}
                          {props.currentMessage.reactions && Object.keys(props.currentMessage.reactions).length > 0 && 
                            renderReactions(props.currentMessage.reactions, props.currentMessage._id)}
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisibility(false)}
        >
          <View style={styles.centeredView}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={{ flex: 1, width: '100%', justifyContent: 'center' }}
            >
              <View style={styles.modalView}>
                {/* Quick reaction bar - chỉ hiện nếu tin nhắn chưa thu hồi */}
                {modalData && !modalData.isRecalled && modalData.text !== "Tin nhắn đã được thu hồi!" && (
                  <View style={styles.quickReactionBar}>
                    {REACTIONS.map((reaction) => (
                      <TouchableOpacity
                        key={reaction}
                        style={styles.quickReactionItem}
                        onPress={() => {
                          if (modalData) {
                            handleAddReaction(modalData._id, reaction);
                            setModalVisible(false);
                          }
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>{reaction}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.modalOverlay}>
                  {/* Chỉ hiện Trả lời nếu tin nhắn chưa thu hồi */}
                  {modalData && !modalData.isRecalled && modalData.text !== "Tin nhắn đã được thu hồi!" && (
                    <TouchableOpacity style={styles.iconchat} onPress={() => handleReply(modalData)}>
                      <MaterialCommunityIcons
                        name="reply"
                        size={24}
                        color="black"
                      />
                      <Text style={styles.modalText}>Trả lời</Text>
                    </TouchableOpacity>
                  )}
                  {/* Chỉ hiện Chuyển tiếp nếu tin nhắn chưa thu hồi */}
                  {modalData && !modalData.isRecalled && modalData.text !== "Tin nhắn đã được thu hồi!" && (
                    <TouchableOpacity style={styles.iconchat} onPress={() => handleForwardMessage(modalData)}>
                      <Entypo name="forward" size={24} color="black" />
                      <Text style={styles.modalText}>Chuyển tiếp</Text>
                    </TouchableOpacity>
                  )}
                  {/* Nút copy tin nhắn */}
                  {modalData && modalData.text && !modalData.isRecalled && modalData.text !== "Tin nhắn đã được thu hồi!" && (
                    <TouchableOpacity style={styles.iconchat} onPress={() => handleCopyMessage(modalData.text)}>
                      <Ionicons name="copy-outline" size={24} color="black" />
                      <Text style={styles.modalText}>Sao chép</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.modalOverlay}>
                  <TouchableOpacity style={styles.iconchat} onPress={() => handleDeleteMeseage(modalData._id)}>
                    <MaterialCommunityIcons
                      name="delete-off"
                      size={24}
                      color="black"
                    />
                    <Text style={styles.modalText}>Xóa</Text>
                  </TouchableOpacity>
                  {modalData && (
                    <>
                      {modalData.text !== "Tin nhắn đã được thu hồi!" && !modalData.isRecalled && (
                        <>
                          {modalData.user && modalData.user._id === auth.currentUser?.uid ? (
                            <TouchableOpacity style={styles.iconchat} onPress={() => handleRecallMeseage(modalData._id, modalData.createdAt)}>
                              <Feather name="rotate-ccw" size={24} color="black" />
                              <Text style={styles.modalText}>Thu hồi</Text>
                            </TouchableOpacity>
                          ) : null}
                        </>
                      )}
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          </View>
        </Modal>

        {/* Modal chọn Reaction */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={reactionModalVisible}
          onRequestClose={() => setReactionModalVisible(false)}
        >
          <Pressable 
            style={styles.reactionModalOverlay}
            onPress={() => setReactionModalVisible(false)}
          >
            <View style={styles.reactionModalContent}>
              <Text style={styles.reactionModalTitle}>Chọn biểu cảm</Text>
              <View style={styles.reactionGrid}>
                {REACTIONS.map((reaction) => (
                  <TouchableOpacity
                    key={reaction}
                    style={styles.reactionGridItem}
                    onPress={() => {
                      if (selectedMessageForReaction) {
                        handleAddReaction(selectedMessageForReaction._id, reaction);
                      }
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{reaction}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Image Viewer Modal */}
        <ImageViewerModal
          visible={imageViewerVisible}
          imageUri={selectedImage}
          onClose={() => setImageViewerVisible(false)}
        />

        {/* Attachment Menu */}
        <AttachmentMenu
          visible={attachmentMenuVisible}
          onClose={() => setAttachmentMenuVisible(false)}
          onPickImage={pickImageOnly}
          onPickVideo={pickVideoOnly}
          onPickDocument={pickDocument}
          onPickAudio={() => {
            setAttachmentMenuVisible(false);
            startRecording();
          }}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#006AF5",
    padding: 9,
    height: 48,
    width: '100%',
  },
  searchInput: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    height: 48,
    marginLeft: 10,
  },
  textSearch: {
    color: "white",
    fontWeight: '500',
    marginLeft: 20
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 320,
  },
  modalText: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
  },
  modalOverlay: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 5,
  },
  iconchat: {
    height: 65,
    width: 70,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
    backgroundColor: '#f5f5f5',
  },
  avatar: {
    marginLeft: 15,
    width: 35,
    height: 35,
    borderRadius: 25,
    borderWidth: 2,  // Độ rộng của khung viền
    borderColor: 'white',  // Màu sắc của khung viền, bạn có thể thay đổi màu tùy ý
  },
  // Styles cho reactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    marginLeft: 5,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    color: '#666',
  },
  // Styles cho quick reaction bar trong modal
  quickReactionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickReactionItem: {
    padding: 8,
    marginHorizontal: 4,
  },
  // Styles cho reaction modal
  reactionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  reactionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reactionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  reactionGridItem: {
    padding: 10,
    margin: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  // Modern Action Bar Styles
  modernActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modernActionBtn: {
    padding: 6,
    marginHorizontal: 2,
  },
  // Date Separator Styles
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d0d0d0',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    paddingHorizontal: 12,
    backgroundColor: '#e6e6fa',
  },
  // Message Row Styles
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: 8,
  },
  messageContent: {
    flexDirection: 'column',
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
    marginLeft: 4,
  },
  // Modern Text Bubble Styles
  modernTextBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleRight: {
    backgroundColor: '#006AF5',
    borderBottomRightRadius: 4,
    marginRight: 5,
  },
  bubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  timeRight2: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  timeLeft2: {
    color: '#999',
    textAlign: 'left',
  },
  recalledMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recalledText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 6,
  },
  // Modern Image Message Styles
  modernImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modernImage: {
    width: 220,
    height: 260,
    borderRadius: 16,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modern Video Message Styles
  modernVideoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modernVideoThumbnail: {
    width: 220,
    height: 180,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Modern Document Message Styles
  modernDocContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  docIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docFileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docType: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 8,
  },
  docTime: {
    fontSize: 11,
  },
  // Image Viewer Modal Styles
  imageViewerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  imageViewerHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  // Attachment Menu Modal Styles
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  attachmentModalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  attachmentItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 20,
  },
  attachmentIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  // Image Message Additional Styles
  imageRight: {
    alignSelf: 'flex-end',
    marginRight: 5,
  },
  imageLeft: {
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  imageTimeOverlay: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timeRight: {
    right: 8,
  },
  timeLeft: {
    left: 8,
  },
  imageTime: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  imageErrorContainer: {
    width: 220,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  imageErrorText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  // Video Message Additional Styles
  modernVideo: {
    width: 220,
    height: 180,
    borderRadius: 16,
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // Document Message Additional Styles
  docRight: {
    backgroundColor: '#006AF5',
    alignSelf: 'flex-end',
    marginRight: 5,
  },
  docLeft: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  docDownloadIcon: {
    padding: 8,
  },
  // Image Viewer Additional Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerActions: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  imageViewerAction: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  imageViewerActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
  },
  // Attachment Menu Additional Styles  
  attachmentMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachmentMenuContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  attachmentMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  attachmentMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  attachmentMenuItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  attachmentMenuIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentMenuLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  // AttachmentMenu Component Styles
  attachmentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachmentMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  attachmentHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Recording UI Styles
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 25,
    marginHorizontal: 8,
    marginVertical: 4,
    flex: 1,
  },
  cancelRecordBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  sendRecordBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Audio Message Styles
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    minWidth: 180,
    maxWidth: 260,
  },
  audioPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  audioWaveform: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
  },
  audioWaveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  audioBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 12,
    marginLeft: 8,
  },
  audioRight: {
    backgroundColor: '#006AF5',
    alignSelf: 'flex-end',
    marginRight: 5,
  },
  audioLeft: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
});

export default Chat_fr;