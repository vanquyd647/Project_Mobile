import React, { useState, useEffect } from 'react';
import { SafeAreaView, Pressable, StyleSheet, Text, View, TextInput, Image, FlatList, Modal, } from 'react-native';
import { AntDesign, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, onSnapshot, doc, getDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";

const Friends = () => {
    const navigation = useNavigation();
    const auth = getAuth();
    const [userFriendsList, setUserFriendsList] = useState([]);
    const [listFriend, setListFriend] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);

    const fetchUserFriends = async () => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnapshot = await getDoc(userDocRef);
                if (userDocSnapshot.exists()) {
                    const userData = userDocSnapshot.data();
                    const friendsCollectionRef = collection(userDocRef, "friendData");
                    const friendsSnapshot = await getDocs(friendsCollectionRef);
                    const userFriends = [];
                    friendsSnapshot.forEach((doc) => {
                        const friendData = doc.data();
                        userFriends.push({
                            id: doc.id,
                            name: friendData.name_fr,
                            photoUrl: friendData.photoURL_fr,
                            userId: friendData.email_fr,
                            UID_fr: friendData.UID_fr,
                            ID_roomChat: friendData.ID_roomChat
                        });
                    });
                    setUserFriendsList(userFriends);
                } else {
                    console.error("User document does not exist!");
                }
            } else {
                console.error("No user signed in!");
            }
        } catch (error) {
            console.error("Error fetching user friends:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                
                fetchUserFriends(); 
                const db = getFirestore();
                const userDocRef = doc(db, "users", user.uid);
                const friendsCollectionRef = collection(userDocRef, "friendData");
                const unsubscribe = onSnapshot(friendsCollectionRef, (snapshot) => {
                    const userFriends = [];
                    let index = 0; 
                    snapshot.forEach((doc) => {
                        const friendData = doc.data();
                        userFriends.push({
                            id: index++, 
                            name: friendData.name_fr,
                            photoUrl: friendData.photoURL_fr,
                            userId: friendData.email_fr,
                            UID_fr: friendData.UID_fr,
                            ID_roomChat: friendData.ID_roomChat
                        });
                    });
                    
                    setUserFriendsList(userFriends); 
                });

                return () => unsubscribe(); 
            } else {
                console.log("No user signed in!");
            }
        });
        return unsubscribe;
    }, []);

    const fetchUserDataByUID = async (UID) => {
        try {
            const db = getFirestore();
            const userDocRef = doc(db, "users", UID);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();
                return { photoURL: userData.photoURL, name: userData.name };
            } else {
                console.error(`User document does not exist for UID ${UID}`);
                return null;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    };

    const fetchUserDataForFriends = async () => {
        const updatedUserFriendsList = [];
        for (const friend of userFriendsList) {
            const userData = await fetchUserDataByUID(friend.UID_fr);
            if (userData) {
                const updatedFriend = {
                    id: friend.id,
                    UID_fr: friend.UID_fr,
                    ID_roomChat: friend.ID_roomChat,
                    photoUrl: userData.photoURL,
                    name: userData.name
                };

                updatedUserFriendsList.push(updatedFriend);
            }
        }

        return updatedUserFriendsList;
    };

    useEffect(() => {
        fetchUserDataForFriends().then(updatedFriendsData => {
            setListFriend(updatedFriendsData);
        });
    }, [userFriendsList]); 



    // Sort userFriendsList alphabetically by name
    const sortedUserFriendsList = listFriend.slice().sort((a, b) => {
        return a.name.localeCompare(b.name);
    });
    const renderUserFriendItem = ({ item }) => (
        <View style={styles.itemContainer} >
            <Pressable onPress={() => navigation.navigate("Chat_messages", { friendData2: item })} onLongPress={() => setModalVisibility(true, item)}>
                <View style={styles.containerProfile}>
                    <Image style={styles.image} source={{ uri: item.photoUrl }} />
                    <Text style={styles.text}>{item.name}</Text>
                </View>
            </Pressable>
        </View>
    );

    const setModalVisibility = (isVisible, chats) => {
    
        setModalData(chats);
        setModalVisible(isVisible);
    };

    const handleCancel_friend = async (friend) => {
        
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnapshot = await getDoc(userDocRef);
                if (userDocSnapshot.exists()) {
                    const friendSentRef = doc(db, "users", user.uid, "friendData", friend.id);
                    await deleteDoc(friendSentRef);

                    const friendReceivedCollectionRef = collection(db, "users", friend.UID_fr, "friendData");
                    const q = query(friendReceivedCollectionRef, where("UID_fr", "==", user.uid));
                    const querySnapshot = await getDocs(q);

                    const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
                    await Promise.all(deletePromises);
                    console.log("Friend request canceled successfully!");
                    setModalVisible(false)
                } else {
                    console.error("User document does not exist!");
                }
            } else {
                console.error("No user signed in!");
            }
        } catch (error) {
            console.error("Error canceling friend request:", error);
        }
    };


    return (
        <View style={styles.container}>
            <SafeAreaView>
                <View>
                    <Pressable onPress={() => navigation.navigate("Friend_Request")}>
                        <View style={styles.view1}>
                            <FontAwesome5 name="user-friends" size={24} color="#9acd32" />
                            <Text style={styles.text1}>Lời mời kết bạn</Text>
                        </View>
                    </Pressable>
                    <View style={styles.view1}>
                        <FontAwesome6 name="contact-book" size={30} color="#9acd32" />
                        <Text style={styles.text1}>Danh bạ máy</Text>
                    </View>
                </View>
                <View style={{ backgroundColor: '#dcdcdc', height: 2 }}></View>
                <View style={{ marginBottom: 220 }}>
                    <FlatList
                        contentContainerStyle={{ paddingBottom: 200 }}
                        data={sortedUserFriendsList}
                        renderItem={renderUserFriendItem}
                        keyExtractor={(item) => item.id}
                    />
                </View>
            </SafeAreaView>
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
                                <Pressable style={styles.iconchat} onPress={() => handleCancel_friend(modalData)}>
                                    <MaterialCommunityIcons
                                        name="delete-off"
                                        size={24}
                                        color="black"
                                    />
                                    <Text style={styles.modalText}>hủy kết bạn</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Pressable>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
        flex: 1,
        justifyContent: "center",
        height: 48,
        marginLeft: 10,
    },
    textSearch: {
        color: "white",
        fontWeight: '500'
    },
    itemContainer: {
        marginTop: 5,
        flex: 1,
        margin: 5,
    },
    image: {
        marginLeft: 15,
        width: 55,
        height: 55,
        borderRadius: 35,
        borderWidth: 2,  
        borderColor: '#9acd32',  
    },
    text: {
        marginLeft: 20,
        fontSize: 20,
        flex: 1,
    },
    view1: {
        flexDirection: 'row',
        margin: 10,
    },
    text1: {
        fontSize: 15,
        justifyContent: "center",
        marginLeft: 10
    },
    containerProfile: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 60,
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
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        margin: 5,
    },
});

export default Friends;
