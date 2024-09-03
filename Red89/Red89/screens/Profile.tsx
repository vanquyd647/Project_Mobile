import { StyleSheet, Text, View, TouchableOpacity, Pressable, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { AntDesign, Octicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../components/types';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { SafeAreaView } from 'react-native-safe-area-context';

const Profile = ({ setIsLoggedIn }: { setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;
    const [userData, setUserData] = useState<any>(null);
    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState('');

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                    console.log('User data:', userData);
                    setUserData(userData);
                    setDisplayName(userData.name);
                    setPhotoURL(userData.photoURL);
                } else {
                    console.log('User not found');
                }
            });

            return () => {
                unsubscribe();
            };
        } else {
            console.log('No user is currently logged in');
        }
    }, [db, user]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ marginBottom: 600 }}>
                <View style={styles.containerProfile}>
                    <TouchableOpacity>
                        {photoURL ? (
                            <Image source={{ uri: photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholder]}>
                                <Text style={styles.placeholderText}>No Image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{displayName}</Text>
                    </View>
                    <Pressable style={{ padding: 10 }} onPress={() => navigation.navigate('SettingScreen')}>
                        <AntDesign name="setting" size={34} color="black" />
                    </Pressable>
                </View>
                <View style={{ height: 5, backgroundColor: '#f0f8ff' }}></View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' , padding:10}}>
                    <Text style={styles.title2}>Đơn hàng của tôi</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('OdersScreen')}>
                        <Text style={styles.title3}>Xem tất cả đơn hàng</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' , padding:10}}>
                    <Pressable style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <AntDesign name="wallet" size={33} color="black" />
                        <Text style={styles.texta1}>Đơn hàng </Text>
                        <Text style={styles.texta1}>chờ xác nhận</Text>
                    </Pressable>
                    <Pressable style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="archive" size={33} color="black" />
                        <Text style={styles.texta1}>Chờ lấy hàng</Text>
                        <Text style={styles.texta1}></Text>
                    </Pressable>
                    <Pressable style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="truck-delivery-outline" size={33} color="black" />
                        <Text style={styles.texta1}>Chờ giao hàng</Text>
                        <Text style={styles.texta1}></Text>
                    </Pressable>
                    <Pressable style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Octicons name="feed-star" size={33} color="black" />
                        <Text style={styles.texta1}>Đánh giá</Text>
                        <Text style={styles.texta1}></Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

export default Profile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',

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
        margin: 10,
        fontWeight: 'bold',
        fontSize: 16,
    },
    title3: {
        margin: 10,
    },
    avatar: {
        marginLeft: 15,
        width: 75,
        height: 75,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#006AF5',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    placeholderText: {
        color: '#888',
        fontSize: 16,
    },
    texta1: {
        textAlign: 'center',
        fontSize: 10,
    },
});
