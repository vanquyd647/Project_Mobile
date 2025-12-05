import React, { useEffect, useState, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    StatusBar, 
    Alert, 
    Text, 
    TouchableOpacity, 
    SafeAreaView,
    Dimensions,
    Image,
    Vibration,
    BackHandler
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getDatabase, ref, set, onValue, push, remove, onChildAdded, off, serverTimestamp } from '@react-native-firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

// WebRTC Configuration với STUN/TURN servers
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ],
};

const VideoCall = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { 
        callerUid, 
        recipientUid, 
        callerName, 
        recipientName,
        recipientAvatar,
        isInitiator = true, // true = người gọi, false = người nhận
        roomId: passedRoomId, // roomId được truyền từ caller hoặc notification
    } = route.params || {};

    // States
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState(isInitiator ? 'Đang gọi...' : 'Cuộc gọi đến...');
    const [isConnected, setIsConnected] = useState(false);
    const [callState, setCallState] = useState(isInitiator ? 'calling' : 'incoming'); // calling, incoming, connected, ended
    const [partnerInfo, setPartnerInfo] = useState({ name: recipientName || callerName, avatar: recipientAvatar });

    // Refs
    const peerConnection = useRef(null);
    const callTimerRef = useRef(null);
    const roomRef = useRef(null);
    const ringtoneRef = useRef(null);
    const callTimeoutRef = useRef(null);

    // Sử dụng roomId được truyền vào hoặc tạo mới (fallback)
    const generateRoomId = () => {
        if (passedRoomId) {
            return passedRoomId;
        }
        const sortedIds = [callerUid, recipientUid].sort();
        return `videocall_${sortedIds[0]}_${sortedIds[1]}`;
    };

    const roomId = generateRoomId();
    const currentUserId = isInitiator ? callerUid : recipientUid;

    useEffect(() => {
        StatusBar.setHidden(true);
        
        // Xử lý nút back
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleCallEnd();
            return true;
        });

        // Lấy thông tin đối tác
        fetchPartnerInfo();

        if (isInitiator) {
            // Người gọi: Tạo cuộc gọi trong Firebase
            initiateCall();
        } else {
            // Người nhận: Phát nhạc chuông và rung
            playRingtone();
            Vibration.vibrate([0, 500, 200, 500], true);
        }

        // Lắng nghe trạng thái cuộc gọi
        listenToCallStatus();

        return () => {
            StatusBar.setHidden(false);
            backHandler.remove();
            cleanup();
        };
    }, []);

    // Lấy thông tin đối tác
    const fetchPartnerInfo = async () => {
        try {
            const partnerId = isInitiator ? recipientUid : callerUid;
            const db = getFirestore();
            const userDoc = await getDoc(doc(db, 'users', partnerId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setPartnerInfo({
                    name: userData.name || 'Người dùng',
                    avatar: userData.avatar || null
                });
            }
        } catch (error) {
            console.log('Lỗi lấy thông tin đối tác:', error);
        }
    };

    // Phát nhạc chuông (hoặc vibration nếu không có file)
    const playRingtone = async () => {
        try {
            // Sử dụng vibration liên tục như nhạc chuông
            Vibration.vibrate([0, 1000, 500, 1000], true);
            
            // Thử load file âm thanh nếu có
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/ringtone.mp3'),
                    { isLooping: true, volume: 1.0 }
                );
                ringtoneRef.current = sound;
                await sound.playAsync();
            } catch (soundError) {
                console.log('Không tìm thấy file nhạc chuông, sử dụng vibration');
            }
        } catch (error) {
            console.log('Không thể phát nhạc chuông:', error);
        }
    };

    // Dừng nhạc chuông
    const stopRingtone = async () => {
        Vibration.cancel();
        if (ringtoneRef.current) {
            try {
                await ringtoneRef.current.stopAsync();
                await ringtoneRef.current.unloadAsync();
            } catch (error) {
                console.log('Lỗi dừng nhạc chuông:', error);
            }
        }
    };

    // Người gọi: Tạo cuộc gọi
    const initiateCall = async () => {
        try {
            const db = getDatabase();
            const callRef = ref(db, `calls/${roomId}`);
            
            // Tạo call request trong Firebase Realtime Database
            await set(callRef, {
                callerId: callerUid,
                callerName: callerName,
                recipientId: recipientUid,
                status: 'ringing',
                createdAt: Date.now(),
            });

            // Gửi push notification để thông báo cuộc gọi (khi app bị kill)
            try {
                const response = await fetch('https://chatlofi-notification.onrender.com/api/notify/video-call', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipientId: recipientUid,
                        callerId: callerUid,
                        callerName: callerName,
                        roomId: roomId,
                    }),
                });
                const result = await response.json();
                console.log('Video call notification sent:', result);
            } catch (notifError) {
                console.log('Could not send call notification:', notifError);
                // Không fail cuộc gọi nếu notification thất bại
            }

            // Timeout sau 60 giây nếu không có ai trả lời
            callTimeoutRef.current = setTimeout(() => {
                if (callState === 'calling') {
                    setConnectionStatus('Không có phản hồi');
                    handleCallEnd();
                }
            }, 60000);

        } catch (error) {
            console.error('Lỗi khởi tạo cuộc gọi:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
            navigation.goBack();
        }
    };

    // Lắng nghe trạng thái cuộc gọi
    const listenToCallStatus = () => {
        const db = getDatabase();
        const callStatusRef = ref(db, `calls/${roomId}/status`);
        
        onValue(callStatusRef, async (snapshot) => {
            const status = snapshot.val();
            console.log('Call status changed:', status);

            switch (status) {
                case 'accepted':
                    // Cuộc gọi được chấp nhận - bắt đầu WebRTC
                    setCallState('connected');
                    setConnectionStatus('Đang kết nối...');
                    stopRingtone();
                    if (callTimeoutRef.current) {
                        clearTimeout(callTimeoutRef.current);
                    }
                    await startWebRTC();
                    break;
                    
                case 'declined':
                    // Cuộc gọi bị từ chối
                    setConnectionStatus('Cuộc gọi bị từ chối');
                    stopRingtone();
                    setTimeout(() => handleCallEnd(), 2000);
                    break;
                    
                case 'ended':
                    // Cuộc gọi kết thúc
                    setConnectionStatus('Cuộc gọi đã kết thúc');
                    stopRingtone();
                    setTimeout(() => handleCallEnd(), 1000);
                    break;
            }
        });
    };

    // Người nhận: Chấp nhận cuộc gọi
    const acceptCall = async () => {
        try {
            stopRingtone();
            setCallState('connected');
            setConnectionStatus('Đang kết nối...');

            const db = getDatabase();
            const statusRef = ref(db, `calls/${roomId}/status`);
            await set(statusRef, 'accepted');

            await startWebRTC();
        } catch (error) {
            console.error('Lỗi chấp nhận cuộc gọi:', error);
        }
    };

    // Người nhận: Từ chối cuộc gọi
    const declineCall = async () => {
        try {
            stopRingtone();
            
            const db = getDatabase();
            const statusRef = ref(db, `calls/${roomId}/status`);
            await set(statusRef, 'declined');

            navigation.goBack();
        } catch (error) {
            console.error('Lỗi từ chối cuộc gọi:', error);
            navigation.goBack();
        }
    };

    // Bắt đầu WebRTC
    const startWebRTC = async () => {
        try {
            // Lấy local stream
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: {
                    facingMode: 'user',
                    width: 640,
                    height: 480,
                },
            });
            setLocalStream(stream);

            // Tạo peer connection
            const pc = new RTCPeerConnection(configuration);
            peerConnection.current = pc;

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                    setIsConnected(true);
                    setConnectionStatus('Đã kết nối');
                    startCallTimer();
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendIceCandidate(event.candidate);
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                switch (pc.connectionState) {
                    case 'connected':
                        setConnectionStatus('Đã kết nối');
                        setIsConnected(true);
                        break;
                    case 'disconnected':
                        setConnectionStatus('Đã ngắt kết nối');
                        break;
                    case 'failed':
                        setConnectionStatus('Kết nối thất bại');
                        setTimeout(() => handleCallEnd(), 2000);
                        break;
                    case 'closed':
                        setConnectionStatus('Cuộc gọi đã kết thúc');
                        break;
                }
            };

            // Thiết lập signaling
            setupSignaling(pc);

            // Nếu là người gọi (initiator), tạo offer
            if (isInitiator) {
                await createOffer(pc);
            }

        } catch (error) {
            console.error('Lỗi bắt đầu WebRTC:', error);
            Alert.alert('Lỗi', 'Không thể khởi tạo camera/mic');
            handleCallEnd();
        }
    };

    // Thiết lập signaling qua Firebase
    const setupSignaling = (pc) => {
        const db = getDatabase();
        roomRef.current = ref(db, `calls/${roomId}`);

        // Lắng nghe offer
        const offerRef = ref(db, `calls/${roomId}/offer`);
        onValue(offerRef, async (snapshot) => {
            const data = snapshot.val();
            if (data && !isInitiator && pc.remoteDescription === null) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    // Gửi answer
                    const answerRef = ref(db, `calls/${roomId}/answer`);
                    await set(answerRef, {
                        type: answer.type,
                        sdp: answer.sdp,
                    });
                } catch (error) {
                    console.error('Lỗi xử lý offer:', error);
                }
            }
        });

        // Lắng nghe answer
        const answerRef = ref(db, `calls/${roomId}/answer`);
        onValue(answerRef, async (snapshot) => {
            const data = snapshot.val();
            if (data && isInitiator && pc.remoteDescription === null) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                } catch (error) {
                    console.error('Lỗi xử lý answer:', error);
                }
            }
        });

        // Lắng nghe ICE candidates
        const candidatesRef = ref(db, `calls/${roomId}/candidates`);
        onChildAdded(candidatesRef, async (snapshot) => {
            const data = snapshot.val();
            if (data && data.sender !== currentUserId) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (error) {
                    console.error('Lỗi thêm ICE candidate:', error);
                }
            }
        });
    };

    // Tạo offer
    const createOffer = async (pc) => {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const db = getDatabase();
            const offerRef = ref(db, `calls/${roomId}/offer`);
            await set(offerRef, {
                type: offer.type,
                sdp: offer.sdp,
            });
        } catch (error) {
            console.error('Lỗi tạo offer:', error);
        }
    };

    // Gửi ICE candidate
    const sendIceCandidate = async (candidate) => {
        try {
            const db = getDatabase();
            const candidatesRef = ref(db, `calls/${roomId}/candidates`);
            await push(candidatesRef, {
                sender: currentUserId,
                candidate: candidate.toJSON(),
            });
        } catch (error) {
            console.error('Lỗi gửi ICE candidate:', error);
        }
    };

    // Bắt đầu timer
    const startCallTimer = () => {
        if (callTimerRef.current) return;
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    // Format thời gian
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle mute
    const toggleMute = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    // Switch camera
    const switchCamera = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track._switchCamera();
            });
        }
    };

    // Kết thúc cuộc gọi
    const handleCallEnd = async () => {
        try {
            // Thông báo kết thúc qua Firebase
            const db = getDatabase();
            const endCallRef = ref(db, `calls/${roomId}/endCall`);
            await set(endCallRef, {
                endedBy: callerUid,
                endedAt: Date.now(),
            });
        } catch (error) {
            console.error('Lỗi thông báo kết thúc:', error);
        }

        cleanup();
        navigation.goBack();
    };

    // Cleanup
    const cleanup = async () => {
        // Stop timer
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
        }

        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (peerConnection.current) {
            peerConnection.current.close();
        }

        // Remove Firebase listeners and data
        try {
            const db = getDatabase();
            if (roomRef.current) {
                off(roomRef.current);
            }
            // Xóa room sau 5 giây
            setTimeout(async () => {
                try {
                    await remove(ref(db, `calls/${roomId}`));
                } catch (e) {
                    console.log('Room đã được xóa');
                }
            }, 5000);
        } catch (error) {
            console.error('Lỗi cleanup Firebase:', error);
        }
    };

    if (!callerUid || !recipientUid) {
        Alert.alert('Lỗi', 'Không có thông tin cuộc gọi');
        navigation.goBack();
        return null;
    }

    // UI cho màn hình đang gọi / cuộc gọi đến
    if (callState === 'calling' || callState === 'incoming') {
        return (
            <View style={styles.container}>
                <View style={styles.callingContainer}>
                    {/* Avatar */}
                    <View style={styles.avatarLarge}>
                        {partnerInfo.avatar ? (
                            <Image 
                                source={{ uri: partnerInfo.avatar }} 
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Icon name="account" size={80} color="#fff" />
                        )}
                    </View>

                    {/* Tên người gọi/nhận */}
                    <Text style={styles.callingName}>{partnerInfo.name}</Text>
                    <Text style={styles.callingStatus}>{connectionStatus}</Text>

                    {/* Nút điều khiển */}
                    <View style={styles.callingControls}>
                        {callState === 'incoming' ? (
                            <>
                                {/* Từ chối cuộc gọi */}
                                <TouchableOpacity 
                                    style={styles.declineButton}
                                    onPress={declineCall}
                                >
                                    <Icon name="phone-hangup" size={36} color="#fff" />
                                </TouchableOpacity>
                                
                                {/* Chấp nhận cuộc gọi */}
                                <TouchableOpacity 
                                    style={styles.acceptButton}
                                    onPress={acceptCall}
                                >
                                    <Icon name="phone" size={36} color="#fff" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* Người gọi - chỉ có nút huỷ */
                            <TouchableOpacity 
                                style={styles.declineButton}
                                onPress={handleCallEnd}
                            >
                                <Icon name="phone-hangup" size={36} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    // UI cho cuộc gọi đang diễn ra
    return (
        <View style={styles.container}>
            {/* Remote Video - Full screen */}
            {remoteStream ? (
                <RTCView
                    streamURL={remoteStream.toURL()}
                    style={styles.remoteVideo}
                    objectFit="cover"
                    mirror={false}
                />
            ) : (
                <View style={styles.remoteVideoPlaceholder}>
                    {partnerInfo.avatar ? (
                        <Image 
                            source={{ uri: partnerInfo.avatar }} 
                            style={styles.avatarImageSmall}
                        />
                    ) : (
                        <Icon name="account" size={100} color="#666" />
                    )}
                    <Text style={styles.waitingText}>{connectionStatus}</Text>
                </View>
            )}

            {/* Local Video - Picture in Picture */}
            {localStream && !isVideoOff && (
                <View style={styles.localVideoContainer}>
                    <RTCView
                        streamURL={localStream.toURL()}
                        style={styles.localVideo}
                        objectFit="cover"
                        mirror={true}
                    />
                </View>
            )}

            {/* Header */}
            <SafeAreaView style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.callerName}>{partnerInfo.name || 'Cuộc gọi video'}</Text>
                    {isConnected && (
                        <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
                    )}
                </View>
            </SafeAreaView>

            {/* Controls */}
            <View style={styles.controls}>
                {/* Switch Camera */}
                <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={switchCamera}
                >
                    <Icon name="camera-flip" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Toggle Video */}
                <TouchableOpacity 
                    style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
                    onPress={toggleVideo}
                >
                    <Icon 
                        name={isVideoOff ? "video-off" : "video"} 
                        size={28} 
                        color="#fff" 
                    />
                </TouchableOpacity>

                {/* Toggle Mute */}
                <TouchableOpacity 
                    style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                    onPress={toggleMute}
                >
                    <Icon 
                        name={isMuted ? "microphone-off" : "microphone"} 
                        size={28} 
                        color="#fff" 
                    />
                </TouchableOpacity>

                {/* End Call */}
                <TouchableOpacity 
                    style={styles.endCallButton}
                    onPress={handleCallEnd}
                >
                    <Icon name="phone-hangup" size={32} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    // Styles cho màn hình đang gọi
    callingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    avatarLarge: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarImageSmall: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    callingName: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 10,
    },
    callingStatus: {
        color: '#888',
        fontSize: 16,
        marginBottom: 80,
    },
    callingControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 60,
    },
    declineButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Styles cho cuộc gọi đang diễn ra
    remoteVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    remoteVideoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    waitingText: {
        color: '#888',
        fontSize: 18,
        marginTop: 20,
    },
    localVideoContainer: {
        position: 'absolute',
        top: 100,
        right: 20,
        width: 120,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerContent: {
        alignItems: 'center',
    },
    callerName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    duration: {
        color: '#4CAF50',
        fontSize: 16,
        marginTop: 5,
    },
    controls: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 30,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonActive: {
        backgroundColor: '#666',
    },
    endCallButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
});

export default VideoCall;