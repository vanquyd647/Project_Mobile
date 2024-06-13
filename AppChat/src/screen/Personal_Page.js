import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, SafeAreaView, Pressable, ImageBackground, TouchableOpacity, Image } from 'react-native'
import { useNavigation, useRoute } from "@react-navigation/native";
import { getAuth, signOut } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const Personal_Page = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState(null);
    const [gender, setGender] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [email, setEmail] = useState('');
    const auth = getAuth();
    const user = auth.currentUser;
    const [userData, setUserData] = useState(null);
    const db = getFirestore();
    const { PersonalData } = route.params;
    const PersonalData2 = PersonalData;


    useEffect(() => {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                setUserData(userData);
                setDisplayName(userData.name);
                setPhotoURL(userData.photoURL);
                setBirthdate(userData.birthdate);
                setEmail(userData.email);
                setGender(userData.gender);
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
            <View style={styles.PersonalContainer}>
                <ImageBackground source={require('../../assets//images/background.png')} style={styles.background}>
                    <Pressable onPress={() => navigation.goBack()} style={{margin:20}}>
                        <AntDesign name="arrowleft" size={20} color="white" />
                    </Pressable>
                    <View style={styles.containerProfile}>
                        <TouchableOpacity>
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarPlaceholderText}>Tap to add photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                            <View style={{flex:1}}>
                                <Text style={styles.title}>{displayName}</Text>
                            </View>
                    </View>
                </ImageBackground>
            </View> 
            <View>
                <View style={{margin:20}}>
                    <Text style={{fontWeight:"bold"}}>Thông tin cá nhân</Text>
                </View>
                <View style={{flexDirection:"row", marginLeft:20, marginBottom:20}}>
                    <View style={{width:120}}>
                        <Text>Ngày sinh</Text>
                    </View>
                    <Text>{birthdate}</Text>
                </View>
                <View style={{flexDirection:"row", marginLeft:20, marginBottom:20}}>
                    <View style={{width:120}}>
                        <Text>Email</Text>
                    </View>
                    <Text>{email}</Text>
                </View>
            </View>
        </SafeAreaView>
    </View>
    )
}

export default Personal_Page

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    PersonalContainer: {
        height: 200,
        width: '100%',
    },
    background: {
        flex: 1,
        resizeMode: 'cover', 
    },
    containerProfile: {
        marginTop:20,
        flexDirection: 'row',
        alignItems:'center',
        width: '100%',
        height:90,
    }, 
    avatar: {
        marginLeft: 15,
        width: 75,
        height: 75,
        borderRadius: 35,
        borderWidth: 2,  
        borderColor: 'white',  
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
    title: {
        fontSize: 24,
        marginLeft: 10,
        color: 'white'
    },
});