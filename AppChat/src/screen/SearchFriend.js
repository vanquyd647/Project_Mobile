import React, { useState, useEffect } from 'react';
import { SafeAreaView, Pressable, StyleSheet, Text, View, TextInput, Image, FlatList, ActivityIndicator, Touchable, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, getDoc, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const SearchFriend = () => {
  const navigation = useNavigation();
  const [input, setInput] = useState("");
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(false); 
  const auth = getAuth();
  const user = auth.currentUser;
  const [ID_roomChat, setID_roomChat] = useState("");

  const handleInputChange = (text) => {
    setInput(text);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("User not logged in.");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        const userQuery = query(collection(db, "users"), where("name", "==", input));
        const userSnapshot = await getDocs(userQuery);
        const foundFriends = [];
        const currentUser = auth.currentUser;
        let index = 0;
        userSnapshot.forEach(doc => {
          const userData = doc.data();
          
          if (userData.UID !== currentUser.uid) {
            foundFriends.push({
              id: index++,
              name: userData.name,
              photoUrl: userData.photoURL,
              email: userData.email,
              UID: userData.UID,
              ID_roomChat: ID_roomChat
            });
          }
        });
        const updatedFriendsList = [];
        for (const friend of foundFriends) {
          const isFriend = await checkFriendshipStatus(friend.UID);
          updatedFriendsList.push({ ...friend, isFriend });
        }
        setFriendsList(updatedFriendsList);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    handleSearch();
  }, [input, user.uid]);

  const checkFriendshipStatus = async (UID) => {
    try {
      const db = getFirestore();
      const currentUser = auth.currentUser;
      const currentUserDocRef = doc(db, "users", currentUser.uid);
      const friendDataQuery = query(collection(currentUserDocRef, "friendData"), where("UID_fr", "==", UID));
      const friendDataSnapshot = await getDocs(friendDataQuery);
      return !friendDataSnapshot.empty;
    } catch (error) {
      console.error("Error checking friendship status:", error);
      return false;
    }
  };

  const createChatRoom = async (friendData) => {
    const generateRandomId = () => {
      const characters = 'abcdef0123456789';
      let result = '0x';
      const charactersLength = characters.length;
      for (let i = 0; i < 12; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    };
    console.log("Creating chat room with:", friendData)
    try {
      const db = getFirestore();
      const currentUser = auth.currentUser;
      const chatRoomId = generateRandomId();
      setID_roomChat(chatRoomId);
      const sortedUIDs = [currentUser.uid, friendData.UID].sort();
      const chatRoomRef = doc(db, "Chats", chatRoomId);
      const chatRoomSnapshot = await getDoc(chatRoomRef);
      if (!chatRoomSnapshot.exists()) {
        await setDoc(chatRoomRef, {
          ID_roomChat: chatRoomId,
          UID: sortedUIDs,
        });
        console.log("New chat room created:", friendData);
      }
      return chatRoomId;
    } catch (error) {
      console.error("Error creating or navigating to chat room:", error);
      return null;
    }
  };



  const handleAddFriend = async (friend) => {
    try {
      const chatRoomId = await createChatRoom(friend);
      if (chatRoomId) {
        const db = getFirestore();
        const currentUser = auth.currentUser;
        if (currentUser) {
          const currentUserDocRef = doc(db, "users", currentUser.uid);
          const currentUserDocSnapshot = await getDoc(currentUserDocRef);
          if (currentUserDocSnapshot.exists()) {
            const currentUserData = currentUserDocSnapshot.data();
            const friendSentsQuery = query(collection(currentUserDocRef, "friend_Sents"), where("email_fr", "==", friend.email));
            const friendSentsSnapshot = await getDocs(friendSentsQuery);
            if (friendSentsSnapshot.empty) {
              const friend_Sents = {
                name_fr: friend.name,
                photoURL_fr: friend.photoUrl,
                email_fr: friend.email,
                UID_fr: friend.UID,
                ID_roomChat: chatRoomId
              };
              await addDoc(collection(currentUserDocRef, "friend_Sents"), friend_Sents);
              console.log("Added friend request sent");
              const friendDocRef = doc(db, "users", friend.UID);
              const friendDocSnapshot = await getDoc(friendDocRef);
              if (friendDocSnapshot.exists()) {
                const friend_Receiveds = {
                  name_fr: currentUserData.name,
                  photoURL_fr: currentUserData.photoURL,
                  email_fr: currentUserData.email,
                  UID_fr: currentUserData.UID,
                  ID_roomChat: chatRoomId
                };
                await addDoc(collection(friendDocRef, "friend_Receiveds"), friend_Receiveds);
                console.log("Friend request sent successfully");
              } else {
                console.error("Friend document does not exist!");
              }
            } else {
              console.log("Friend request already sent");
            }
          } else {
            console.error("User document does not exist!");
          }
        } else {
          console.error("No user signed in!");
        }
      } else {
        console.error("Chat room creation failed");
      }
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };




  const handleFriendAction = async (friendData) => {
    await handleAddFriend(friendData);
  };

  const renderFriendItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Pressable >
        <View style={styles.containerProfile}>
          <Image style={styles.image} source={{ uri: item.photoUrl }} />
          <Text style={styles.text}>{item.name}</Text>
          {!item.isFriend && (
            <TouchableOpacity style={styles.addButton} onPress={() => handleFriendAction(item)}>
              <Text style={styles.addButtonText}>Kết bạn</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </View>
  );
  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.searchContainer}>
          <AntDesign name="search1" size={20} color="white" />
          <TextInput
            style={styles.searchInput}
            value={input}
            onChangeText={handleInputChange}
            placeholder="..."
            placeholderTextColor="white"
          />
        </View>
        <View style={{ marginBottom: 220 }}>
          {loading ? (
            <ActivityIndicator style={styles.loadingIndicator} size="large" color="#9acd32" />
          ) : (
            <FlatList
              data={friendsList}
              renderItem={renderFriendItem}
              keyExtractor={item => item.id}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

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
    flex: 1,
    height: 48,
    marginLeft: 10,
    color: 'white',
  },
  searchButton: {
    paddingHorizontal: 10,
  },
  textSearch: {
    color: "white",
    fontWeight: '500'
  },
  itemContainer: {
    marginTop: 20,
    flex: 1,
    margin: 20,
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
  addButton: {
    backgroundColor: '#9acd32',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  containerProfile: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 60,
  },
});

export default SearchFriend;
