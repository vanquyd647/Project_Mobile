import React, { useState, useCallback, useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { saveAddress } from '../redux/addressSlice';
import { RootStackParamList } from '../components/types'; 
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { selectAddresses } from '../redux/addressSlice';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type AddAddressScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Add_addressScreen'>;
type AddAddressScreenRouteProp = RouteProp<RootStackParamList, 'Add_addressScreen'>;

const Add_addressScreen = () => {
    const user = getAuth().currentUser;
    if (!user) {     
        return null; 
    }

    
    const navigation = useNavigation<AddAddressScreenNavigationProp>();
    const route = useRoute<AddAddressScreenRouteProp>();
    const dispatch = useDispatch();
    const addresses = useSelector(selectAddresses);

    const { addressData } = route.params || {};
    const [name, setName] = useState(addressData?.name || '');
    const [address, setAddress] = useState(addressData?.address || '');
    const [phone, setPhone] = useState(addressData?.phone || '');
    const [addressType, setAddressType] = useState(addressData?.addressType || '');
    const [addressId, setAddressId] = useState<string | null>(addressData?.id || null);
    const [isDefault, setIsDefault] = useState(addressData?.isDefault || false);

    useEffect(() => {
        if (addressData) {
            setName(addressData.name);
            setAddress(addressData.address);
            setPhone(addressData.phone);
            setAddressType(addressData.addressType);
            setAddressId(addressData.id);
            setIsDefault(addressData.isDefault || false);
        }
    }, [addressData]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                setName('');
                setAddress('');
                setPhone('');
                setAddressType('');
                setAddressId(null);
                setIsDefault(false);
            };
        }, [])
    );

    const handleSaveAddress = () => {
        if (name && address && phone && addressType) {
            const newAddressData = { name, address, phone, addressType, isDefault, id: addressId ?? undefined };
            const isEdit = !!addressId;
    
            if (isDefault && addresses.some(addr => addr.isDefault && addr.id !== addressId)) {
                Alert.alert(
                    "Địa chỉ mặc định",
                    "Đã có một địa chỉ mặc định khác. Bạn có muốn lưu địa chỉ này làm mặc định mới không?",
                    [
                        { text: "Không", onPress: () => setIsDefault(false), style: "cancel" },
                        {
                            text: "Có", onPress: async () => {
                                try {
                                    // Update the old default address
                                    const updatedAddresses = addresses.map(addr =>
                                        addr.isDefault ? { ...addr, isDefault: false } : addr
                                    );
                                    // Update all old default addresses in the database
                                    const db = getFirestore();
                                    const user = getAuth().currentUser;
                                    if (!user) return;
                                    const batch = writeBatch(db);
                                    updatedAddresses.forEach(addr => {
                                        if (addr.id) {
                                            const addressRef = doc(db, 'users', user.uid, 'addresses', addr.id);
                                            batch.update(addressRef, { isDefault: addr.isDefault });
                                        }
                                    });
                                    await batch.commit();
                                    // Save new address
                                    dispatch(saveAddress({ address: newAddressData, isEdit }) as never);
                                    navigation.goBack();
                                } catch (error) {
                                    console.error("Failed to update default address: ", error);
                                }
                            }
                        }
                    ]
                );
            } else {
                dispatch(saveAddress({ address: newAddressData, isEdit }) as never);
                navigation.goBack();
            }
        } else {
            Alert.alert("!","Vui lòng điền đầy đủ thông tin");
        }
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView>
                    <View style={{ flexDirection: 'row' }}>
                        <Pressable style={{ marginLeft: 5, marginBottom: 20 }} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back-outline" size={28} color="black" />
                        </Pressable>
                        <Text style={styles.title}>{addressData ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</Text>
                    </View>
                    <View>
                        <Text style={styles.text}>Tên người nhận</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            value={name}
                            onChangeText={setName}
                        />
                        <Text style={styles.text}>Thành Phố(tỉnh)/Quận(Huyện)/Phường(Xã)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                        />
                        <Text style={styles.text}>Đường/Tòa Nhà</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                        />
                        <Text style={styles.text}>Số Nhà/Tầng</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                        />
                        <Text style={styles.text}>Địa chỉ bổ sung(không bắt buộc)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            value={address}
                            onChangeText={setAddress}
                        />
                        <Text style={styles.text}>Số điện thoại</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={styles.addressTypeContainer}>
                        <Text style={styles.text}>Loại địa chỉ</Text>
                        <View style={styles.checkboxWrapper}>
                            <Pressable
                                style={styles.checkboxContainer}
                                onPress={() => setAddressType('home')}
                            >
                                <MaterialIcons
                                    name={addressType === 'home' ? "radio-button-checked" : "radio-button-unchecked"}
                                    size={24}
                                    color="black"
                                />
                                <Text style={styles.checkboxText}>Nhà</Text>
                            </Pressable>
                            <Pressable
                                style={styles.checkboxContainer}
                                onPress={() => setAddressType('office')}
                            >
                                <MaterialIcons
                                    name={addressType === 'office' ? "radio-button-checked" : "radio-button-unchecked"}
                                    size={24}
                                    color="black"
                                />
                                <Text style={styles.checkboxText}>Văn phòng</Text>
                            </Pressable>
                        </View>
                    </View>
                    <View style={styles.addressTypeContainer}>
                        <Text style={styles.text}>Đặt làm địa chỉ mặc định</Text>
                        <Switch
                            value={isDefault}
                            onValueChange={setIsDefault}
                        />
                    </View>
                </ScrollView>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveAddress}
                >
                    <Text style={styles.saveButtonText}>{addressData ? 'Cập nhật' : 'Lưu'}</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 5, 
        backgroundColor: '#fff' 
    },
    title: { 
        marginLeft: 10, 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 20 
    },
    text: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        marginLeft: 10, 
        color: '#000011' 
    },
    input: {
        margin: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 7,
        borderRadius: 5,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        marginBottom: 20,
    },
    checkboxText: {
        marginLeft: 5,
        fontSize: 16,
        color: '#000',
    },
    addressTypeContainer: {
        flexDirection: 'row',
        justifyContent: "space-between"
    },
    checkboxWrapper: {
        flexDirection: 'row'
    },
    saveButton: {
        alignItems: 'center',
        backgroundColor: '#006AF5',
        marginHorizontal: 10,
        height: 40,
        justifyContent: 'center',
        borderRadius: 5,
        position: "absolute",
        bottom: 10,
        left: 0,
        right: 0
    },
    saveButtonText: { color: 'white', fontWeight: 'bold' }
});

export default Add_addressScreen;
