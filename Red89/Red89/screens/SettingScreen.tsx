import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut } from "firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingScreen = ({ setIsLoggedIn }: { setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const navigation = useNavigation();
    const auth = getAuth();
    const onHandleLogout = async () => {
        try {
            // Đăng xuất khỏi Firebase
            await signOut(auth);
            // console.log("Logout successfully from Firebase");
            // Đăng xuất khỏi Google
            await GoogleSignin.signOut();
            // Cập nhật trạng thái đăng nhập
            setIsLoggedIn(false);
            console.log("Logout successfully");
        } catch (err) {
            console.log(err);
            // Alert.alert("Đăng xuất thất bại", "Vui lòng thử lại sau");
        }
    };
    return (
        <SafeAreaView>
            <TouchableOpacity>
                <View style={styles.Info}>
                    <Feather name="user" size={24} color="black" />
                    <Text style={{ marginLeft: 5, fontSize: 20, color: 'black' }}>Thông tin cá nhân</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>navigation.navigate('AddressBookScreen' as never)}>
                <View style={styles.Info}>
                    <Feather name="lock" size={24} color="black" />
                    <Text style={{ marginLeft: 5, fontSize: 20, color: 'black' }}>Sổ địa chỉ</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ height: 60, justifyContent: 'center' }} onPress={onHandleLogout}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 5, backgroundColor: '#dcdcdc', height: 40, borderRadius: 15 }}>
                    <Feather name="log-out" size={24} color="black" />
                    <Text style={{ marginLeft: 5, fontSize: 20, color: 'black' }}>Đăng xuất</Text>
                </View>
            </TouchableOpacity>
        </SafeAreaView>

    )
}

export default SettingScreen

const styles = StyleSheet.create({
    Info: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#dcdcdc',
    }
})