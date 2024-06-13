import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, Pressable, StyleSheet, Text, View, Image, TouchableWithoutFeedback, Modal, TouchableOpacity } from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialCommunityIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import { Video } from 'expo-av';
import { GiftedChat } from 'react-native-gifted-chat';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Linking } from 'react-native';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { useChats } from '../contextApi/ChatContext';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, query, orderBy, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';

const Chat_messages = () => {
    const { chats } = useChats();
    const navigation = useNavigation();
    const route = useRoute();
    const { ID_room1 } = route.params;
    const { chatData } = route.params;
    const { friendData } = route.params;
    const { friendData2 } = route.params;
    const { GroupData } = route.params;
    const [messages, setMessages] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();
    const storage = getStorage();
    const [userData, setUserData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [UID] = chatData ? useState(chatData.UID) : useState(GroupData ? GroupData.UID : null);
    const ChatData_props = chatData ? chatData : GroupData;
    const [replyingToMessage, setReplyingToMessage] = useState(null);



    const RoomID = ID_room1 || (friendData2 && friendData2.ID_roomChat) || (GroupData && GroupData.ID_roomChat);
    const avatar = chatData?.Photo_group ? chatData.Photo_group : (friendData2?.photoUrl ? friendData2.photoUrl : (GroupData?.Photo_group ? GroupData.Photo_group : (friendData && friendData.photoURL)));
    const name = chatData?.Name_group ? chatData.Name_group : (friendData2?.name ? friendData2.name : (GroupData?.Name_group ? GroupData.Name_group : (friendData && friendData.name)));
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
            setUserData(null);
        };
    }, [db, user.uid]);

    useEffect(() => {
        const fetchChatMessages = async () => {
            try {

                const chatRoomId = RoomID;
                const chatRoomRef = doc(db, 'Chats', chatRoomId);
                const chatRoomSnapshot = await getDoc(chatRoomRef);

                if (chatRoomSnapshot.exists()) {
                    const chatRoomData = chatRoomSnapshot.data();
                    const detailDelete = chatRoomData.detailDelete || [];
                    let latestDeleteDetail;


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
                                        document: data.document
                                    });
                                }
                            }
                        });
                        setMessages(messages);
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
            setMessages([]);
        };
    }, [db, user?.uid]);



    const onSend = useCallback(async (messages = []) => {
        const messageToSend = messages[0];
        if (!messageToSend) {
            return;
        }

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
                imageContentType = 'image/jpeg';
                imageDownloadURL = await uploadFileToFirebaseStorage(image, auth.currentUser?.uid, imageContentType);
            }
            if (video) {
                videoContentType = 'video/mp4';
                videoDownloadURL = await uploadFileToFirebaseStorage(video, auth.currentUser?.uid, videoContentType);
            }
            if (document) {
                documentContentType = getFileType(document.fileName);

                documentDownloadURL = await uploadFileToFirebaseStorage(document.uri, auth.currentUser?.uid, documentContentType, document.fileName);
            }


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
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
        }
    }, [db, auth.currentUser?.uid, friendData?.UID, replyingToMessage]);



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
                    [media]: result.assets[0].uri
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
            const fileName = nameFile;
            const message = nameFile;
            const extension = getFileExtension(fileName);
            if (!isImageFile(extension) && !isVideoFile(extension)) {
                const type = getFileType(extension);
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
                        document: { uri, fileName, type }
                    }
                ]);
            } else {
                console.log("Selected file is an image or video. Please select a document.");
            }
        } else {
            console.log("No document selected");
        }
    };


    const getFileExtension = (fileName) => {
        return fileName.split('.').pop().toLowerCase();
    };

    const isImageFile = (extension) => {
        return extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif';
    };

    const isVideoFile = (extension) => {
        return extension === 'mp4' || extension === 'mov' || extension === 'avi' || extension === 'mkv';
    };

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
            return 'application/octet-stream';
        }
    };

    const handleImagePress = (imageUri) => {
        navigation.navigate('PlayVideo', { uri: imageUri });
        console.log(imageUri);
    };

    const handleVideoPress = (videoUri) => {
        navigation.navigate('PlayVideo', { uri: videoUri });
        console.log(videoUri);
    };

    const handleDocumentPress = (documentUri) => {
        console.log("Document URI:", documentUri);

        Linking.openURL(documentUri).catch(err => console.error('An error occurred', err));
    };

    const setModalVisibility = (isVisible, messageData) => {
        console.log('messageData', messageData)
        setModalData(messageData);
        setModalVisible(isVisible);
    };

    const handleRecallMeseage = async (messageId) => {
        try {
            const chatRoomId = RoomID;

            const chatMessRef = doc(db, 'Chats', chatRoomId, 'chat_mess', messageId);


            await updateDoc(chatMessRef, {
                text: "Tin nhắn đã được thu hồi!",
                video: "",
                image: "",
                document: "",
            });

            console.log("Message recalled successfully");
            setModalVisible(false);
        } catch (error) {
            console.error("Error recalling message:", error);
        }
    };


    const handleDeleteMeseage = async (messageId) => {
        console.log('messageId', messageId)
        try {
            const chatRoomId = RoomID;
            const timeDelete_mess = new Date();
            const uidDelete_mess = userData.UID;
            const chatMessRef = doc(db, 'Chats', chatRoomId, 'chat_mess', messageId);

            const deleteDetail_mess = {
                timeDelete: timeDelete_mess,
                uidDelete: uidDelete_mess
            };

            const chatMessSnapshot = await getDoc(chatMessRef);
            if (chatMessSnapshot.exists()) {
                const chatMessData = chatMessSnapshot.data();

                const detailDelete_mess_Array = chatMessData.deleteDetail_mess || [];

                detailDelete_mess_Array.push(deleteDetail_mess);

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

        const createdAtString = messageData.createdAt.toISOString();


        const forwardedMessage = {
            _id: messageData._id,
            createdAt: createdAtString,
            text: messageData.text || '',
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

        setModalVisible(false);
    };

    const renderSend = useCallback((props) => {
        if (props.text.trim().length === 0) {

            return null;
        }


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


    return (
        <View style={styles.container}>
            <SafeAreaView>
                <View style={styles.searchContainer}>
                    <Pressable onPress={() => navigation.navigate("Main")}>
                        <AntDesign name="arrowleft" size={20} color="white" />
                    </Pressable>
                    <View style={styles.searchInput}>
                        <Image
                            source={{
                                uri: avatar || 'https://i.stack.imgur.com/l60Hf.png'
                            }}
                            style={styles.avatar}
                        />
                        <Text style={styles.textSearch}>
                            {name}
                        </Text>
                    </View>
                    <Feather name="phone" size={24} color="white" />
                    <Pressable onPress={() => navigation.navigate("Option_chat", { RoomID, avatar, name, Admin_group, UID, ChatData_props })}>
                        <Feather style={{ marginLeft: 10 }} name="list" size={30} color="white" />
                    </Pressable>
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
                        <View style={{ flexDirection: 'row' }}>
                            <Pressable onPress={pickImage}>
                                <Feather style={{ margin: 5, marginLeft: 15 }} name="image" size={35} color="black" />
                            </Pressable>
                            <Pressable >
                                <Feather style={{ margin: 5, marginLeft: 10 }} name="mic" size={32} color="black" />
                            </Pressable>
                            <Pressable onPress={pickDocument} >
                                <Ionicons style={{ margin: 5, marginLeft: 10 }} name="file-tray-outline" size={32} color="black" />
                            </Pressable>
                        </View>
                    )}
                    renderMessage={(props) => {
                        const isCurrentUser = props.currentMessage.user && props.currentMessage.user._id === auth?.currentUser?.uid;
                        const previousSenderID = props.previousMessage && props.previousMessage.user && props.previousMessage.user._id;
                        const isFirstMessageFromPreviousSender = previousSenderID !== props.currentMessage.user._id;

                        const isSameDayAsPreviousMessage = props.previousMessage && props.previousMessage.createdAt && props.previousMessage.createdAt.toDateString() === props.currentMessage.createdAt.toDateString();
                        return (
                            <View>

                                {!isSameDayAsPreviousMessage && (
                                    <Text style={{ fontSize: 12, color: 'gray', textAlign: 'center', marginBottom: 5, fontWeight: 'bold' }}>
                                        {props.currentMessage.createdAt.toLocaleDateString()}
                                    </Text>
                                )}
                                <Pressable onLongPress={() => setModalVisibility(true, props.currentMessage)}>
                                    <View style={{ flexDirection: 'row', justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                                        {!isCurrentUser && isFirstMessageFromPreviousSender && props.currentMessage.user && (
                                            <View style={{ marginLeft: 10 }}>
                                                <Image
                                                    source={{ uri: props.currentMessage.user.avatar }}
                                                    style={{ width: 30, height: 30, borderRadius: 15 }}
                                                />
                                            </View>
                                        )}
                                        <View style={{ flexDirection: 'column' }}>
                                            {isFirstMessageFromPreviousSender && !isCurrentUser && props.currentMessage.user && (
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>{props.currentMessage.user.name}</Text>
                                            )}
                                            <View style={{ backgroundColor: isCurrentUser ? '#9acd32' : 'white', padding: 5, borderRadius: 10, maxWidth: 250, marginLeft: isFirstMessageFromPreviousSender ? 0 : 40, marginRight: isFirstMessageFromPreviousSender ? 10 : 10, marginTop: isFirstMessageFromPreviousSender ? 5 : 5 }}>
                                                {props.currentMessage.document ? (
                                                    <TouchableWithoutFeedback onPress={() => handleDocumentPress(props.currentMessage.document)} onLongPress={() => setModalVisibility(true, props.currentMessage)}>
                                                        <View>
                                                            <Ionicons name="document" size={24} color="black" />
                                                            <Text style={{ fontSize: 16, marginTop: 5 }}>{props.currentMessage.text}</Text>
                                                            <Text style={{ fontSize: 12, marginTop: 5, color: 'gray' }}>{String(props.currentMessage.createdAt.getHours()).padStart(2, '0')}:{String(props.currentMessage.createdAt.getMinutes()).padStart(2, '0')}</Text>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                ) : props.currentMessage.image ? (
                                                    <View>
                                                        <Pressable onPress={() => handleImagePress(props.currentMessage.image)} onLongPress={() => setModalVisibility(true, props.currentMessage)}>
                                                            <Image
                                                                source={{ uri: props.currentMessage.image }}
                                                                style={{ width: 150, height: 200, borderRadius: 10 }}
                                                                resizeMode="cover"
                                                            />
                                                            <Text style={{ fontSize: 16, marginTop: 5 }}>{props.currentMessage.text}</Text>
                                                        </Pressable>
                                                        <Text style={{ fontSize: 12, marginTop: 5, color: 'gray' }}>{String(props.currentMessage.createdAt.getHours()).padStart(2, '0')}:{String(props.currentMessage.createdAt.getMinutes()).padStart(2, '0')}</Text>
                                                    </View>
                                                ) : props.currentMessage.video ? (
                                                    <View>
                                                        <Pressable onPress={() => handleVideoPress(props.currentMessage.video)} onLongPress={() => setModalVisibility(true, props.currentMessage)}>
                                                            <Video
                                                                source={{ uri: props.currentMessage.video }}
                                                                style={{ width: 150, height: 200, borderRadius: 10 }}
                                                                resizeMode="cover"
                                                                useNativeControls
                                                                shouldPlay={false}
                                                            />
                                                            <Text style={{ fontSize: 16, marginTop: 5 }}>{props.currentMessage.text}</Text>
                                                        </Pressable>
                                                        <Text style={{ fontSize: 12, marginTop: 5, color: 'gray' }}>{String(props.currentMessage.createdAt.getHours()).padStart(2, '0')}:{String(props.currentMessage.createdAt.getMinutes()).padStart(2, '0')}</Text>
                                                    </View>
                                                ) : (
                                                    <>
                                                        <Text style={{ fontSize: 16, margin: 5 }}>{props.currentMessage.text}</Text>
                                                        <Text style={{ fontSize: 12, marginTop: 5, color: 'gray' }}>{String(props.currentMessage.createdAt.getHours()).padStart(2, '0')}:{String(props.currentMessage.createdAt.getMinutes()).padStart(2, '0')}</Text>
                                                    </>
                                                )}
                                            </View>
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

                                <View style={styles.modalOverlay}>
                                    <TouchableOpacity style={styles.iconchat} onPress={() => handleReply(modalData)}>
                                        <MaterialCommunityIcons
                                            name="reply"
                                            size={24}
                                            color="black"
                                        />
                                        <Text style={styles.modalText}>Trả lời</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconchat} onPress={() => handleForwardMessage(modalData)}>
                                        <Entypo name="forward" size={24} color="black" />
                                        <Text style={styles.modalText}>Chuyển tiếp</Text>
                                    </TouchableOpacity>
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
                                            {modalData.text !== "Tin nhắn đã được thu hồi!" && (
                                                <>
                                                    {!modalData.user || modalData.user._id === auth.currentUser?.uid ? (
                                                        <TouchableOpacity style={styles.iconchat} onPress={() => handleRecallMeseage(modalData._id)}>
                                                            <Feather name="message-circle" size={24} color="black" />
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
        backgroundColor: "#9acd32",
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
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconchat: {
        height: 70,
        width: 80,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        margin: 5
    },
    avatar: {
        marginLeft: 15,
        width: 35,
        height: 35,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'white',
    },
});

export default Chat_messages;