import React, { useState, useEffect } from 'react';
import { SafeAreaView, Pressable, StyleSheet, Text, View, TextInput, Image, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, getDoc, query, where } from 'firebase/firestore';

const Groups = () => {
    const navigation = useNavigation();
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    const [userData, setUserData] = useState(null);
    const [userGroups, setUserGroups] = useState([]);


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setUserData(userData);
                } else {
                    console.log('User not found');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        if (user) {
            fetchUserData();
        }
    }, [db, user]);


    useEffect(() => {
        const fetchUserGroups = async () => {
            try {
                if (!user) return;

                const chatsCollectionRef = collection(db, 'Group');
                const userGroupsQuery = query(chatsCollectionRef, where('UID', 'array-contains', user.uid));


                const unsubscribe = onSnapshot(userGroupsQuery, (querySnapshot) => {
                    const userGroupsData = querySnapshot.docs.map(doc => doc.data());

                    userGroupsData.sort((a, b) => a.Name_group.localeCompare(b.Name_group));
                    setUserGroups(userGroupsData);
                });

                return () => {

                    unsubscribe();
                };
            } catch (error) {
                console.error('Error fetching user groups:', error);
            }
        };

        fetchUserGroups();

    }, [db, user]);



    const renderItem = ({ item }) => (
        <View style={styles.itemContainer2}>
            <Pressable onPress={() => navigation.navigate("Chat_messages", { GroupData: item })}>
                <View style={styles.containerProfile}>
                    <Image source={{ uri: item.Photo_group }} style={styles.avatar} />
                    <Text style={styles.text1}>{item.Name_group}</Text>
                </View>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView>
                <View>
                    <Pressable onPress={() => navigation.navigate("Add_groups")}>
                        <View style={styles.view1}>
                            <View style={styles.iconAddgroup}>
                                <MaterialIcons name="group-add" size={24} color="#9acd32" />
                            </View>
                            <Text style={styles.text1}>Tạo nhóm mới</Text>
                        </View>
                    </Pressable>

                </View>
                <View style={{ backgroundColor: '#dcdcdc', height: 2 }}></View>
                <View style={{ marginBottom: 220 }}>
                    <FlatList
                        data={userGroups}
                        renderItem={renderItem}
                        keyExtractor={item => item.ID_roomChat.toString()}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
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
        marginTop: 20,
        flex: 1,
        margin: 20,
    },
    image: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
    },
    text: {
        marginTop: 10,
    },
    view1: {
        alignItems: "center",
        flexDirection: 'row',
        margin: 10,
    },
    text1: {
        fontSize: 15,
        justifyContent: "center",
        marginLeft: 10
    },
    iconAddgroup: {
        backgroundColor: "#f0f8ff",
        width: 55,
        height: 55,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    itemContainer2: {
        marginTop: 5,
        flex: 1,
        margin: 5,
    },
    containerProfile: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 60,
    },
    avatar: {
        marginLeft: 15,
        width: 55,
        height: 55,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#9acd32',
    },
});

export default Groups