import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { AntDesign, Feather } from '@expo/vector-icons';
import { getFirestore, doc, onSnapshot } from "firebase/firestore";


export default function Profile() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const db = getFirestore();
  const [personal, setPersonal] = useState('');

  useEffect(() => {
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUserData(userData);
        setPersonal(userData);
        setDisplayName(userData.name);
        setPhotoURL(userData.photoURL);
      } else {
        console.log('User not found');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [db, user]);

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.searchContainer}>
          <AntDesign name="search1" size={20} color="white" />
          <Pressable style={styles.searchInput} onPress={() => navigation.navigate("SearchFriend")}>
            <Text style={styles.textSearch}>Tìm kiếm</Text>
          </Pressable>
          <TouchableOpacity onPress={() => navigation.navigate("Setting_App")}>
            <Feather name="settings" size={30} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 600 }}>
          <Pressable onPress={() => navigation.navigate("Personal_Page", { PersonalData: personal })}>
            <View style={styles.containerProfile}>
              <TouchableOpacity >
                <Image source={{ uri: photoURL }} style={styles.avatar} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{displayName}</Text>
                <Text style={styles.title2}>Xem trang cá nhân</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // backgroundColor: "#fff",
    // alignItems: "center",
    // justifyContent: "center",
  },
  containerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    width: '100%',
    height: 90,
  },
  title: {
    fontSize: 24,
    marginLeft: 10,

  },
  title2: {
    marginLeft: 10,
  },
  avatar: {
    marginLeft: 15,
    width: 75,
    height: 75,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#9acd32',
  },
  avatarPlaceholder: {
    marginLeft: 15,
    backgroundColor: "#E1E2E6",
    width: 75,
    height: 75,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    fontSize: 8,
    color: "#8E8E93",
  },
  buttonContainer: {
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: "blue",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
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
});