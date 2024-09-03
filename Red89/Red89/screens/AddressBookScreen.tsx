import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddresses, deleteAddress } from '../redux/addressSlice';
import { RootState } from '../redux/store';
import { RootStackParamList, Address } from '../components/types';
import { useAddressSelection } from '../contextApi/addressSelectionContext';

const AddressBookScreen = () => {
    const route = useRoute();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Add_addressScreen'>>();
    const dispatch = useDispatch();
    const { setSelectedAddress } = useAddressSelection();
    const addresses = useSelector((state: RootState) => state.address.addresses);

    useFocusEffect(
        React.useCallback(() => {
            dispatch(fetchAddresses() as never);
        }, [dispatch])
    );

    const handleDelete = async (id: string) => {
        try {
            await dispatch(deleteAddress(id) as never);
            dispatch(fetchAddresses() as never);
        } catch (error) {
            console.error("Error deleting address: ", error);
        }
    };

    const handleSelectAddress = (address: Address) => {
        setSelectedAddress(address);
        navigation.goBack();
    };

    const renderRightActions = (item: any) => (
        <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteButtonText}>Xóa</Text>
        </Pressable>
    );

    const renderItem = ({ item }: { item: { id: string, name: string, address: string, phone: string, addressType: string, isDefault: boolean } }) => (
        <Swipeable renderRightActions={() => renderRightActions(item)}>
            <Pressable onPress={() => handleSelectAddress(item)}>
                <View style={styles.addressItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Pressable
                            style={styles.editButton}
                            onPress={() => navigation.navigate('Add_addressScreen', { addressData: item })}
                        >
                            <Ionicons name="pencil-outline" size={18} color="#006AF5" />
                        </Pressable>
                    </View>
                    <Text style={styles.address}>{item.address}</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.addressType}>
                            {item.addressType === 'home' ? 'Nhà' : 'Văn phòng'}
                        </Text>
                        <Text style={styles.addressType}>
                            {item.isDefault ? 'Mặc định' : ''}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Swipeable>
    );

    // Sắp xếp địa chỉ với isDefault = true lên đầu
    const sortedAddresses = [...addresses].sort((a, b) => b.isDefault ? 1 : -1);

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <View style={{ flexDirection: 'row' }}>
                    <Pressable style={{ marginLeft: 5, marginBottom: 20 }} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={28} color="black" />
                    </Pressable>
                    <Text style={styles.title}>Danh sách địa chỉ</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Add_addressScreen' as never)}>
                    <Text style={styles.addButtonText}>Thêm Địa Chỉ</Text>
                </TouchableOpacity>
                <FlatList
                    data={sortedAddresses}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff'
    },
    title: {
        marginLeft: 10,
        fontSize: 18,
        marginBottom: 16,
        fontWeight: 'bold'
    },
    addButton: {
        backgroundColor: '#006AF5',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    list: {
        paddingTop: 20,
        paddingBottom: 200
    },
    addressItem: {
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
    },
    editButton: {
        padding: 5,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    address: {
        fontSize: 14,
        color: '#666'
    },
    phone: {
        fontSize: 14,
        color: '#666'
    },
    addressType: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#333'
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default AddressBookScreen;
