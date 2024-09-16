import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Modal } from 'react-native';
import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Address } from '../components/types';
import { useAddressSelection } from '../contextApi/addressSelectionContext';
import { selectAddresses, fetchAddresses } from '../redux/addressSlice';
import { useSelector, useDispatch } from 'react-redux';
import { fetchShippingOptions } from '../redux/shippingOptionsSlice';
import { TextInput } from 'react-native-gesture-handler';

type CheckoutRouteProp = RouteProp<RootStackParamList, 'CheckoutScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddressBookScreen'>;

const CheckoutScreen = () => {
    const route = useRoute<CheckoutRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    const { products } = route.params;
    const { selectedAddress, setSelectedAddress } = useAddressSelection();

    useEffect(() => {
        dispatch(fetchAddresses() as never);
        dispatch(fetchShippingOptions() as never);
    }, [dispatch]);

    const addresses = useSelector(selectAddresses);
    const [modalVisible, setModalVisible] = useState(false);
    const { options: shippingOptions, loading: shippingLoading } = useSelector((state: any) => state.shippingOptions);
    const [shippingOption, setShippingOption] = useState<string>('');

    useEffect(() => {
        if (shippingOptions.length > 0) {
            const defaultShippingOption = shippingOptions[0];
            setShippingOption(`${defaultShippingOption.name} (${defaultShippingOption.deliveryTime})`);
        }
    }, [shippingOptions]);
    console.log('shippingOptions', shippingOptions);

    useEffect(() => {
        if (addresses.length > 0) {
            const defaultAddress = addresses.find((address) => address.isDefault);
            if (defaultAddress) {
                setSelectedAddress(defaultAddress);
            }
        }
    }, [addresses, setSelectedAddress]);


    const handleSelectAddress = () => {
        navigation.navigate('AddressBookScreen');
    };
    const handleSelectShippingOption = (optionId: string) => {
        const selectedOption = shippingOptions.find((option: any) => option.id === optionId);
        if (selectedOption) {
            setShippingOption(`${selectedOption.name} (${selectedOption.deliveryTime})`);
            setModalVisible(false);
        }
    };

    if (shippingLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading ...</Text>
            </View>
        );
    }


    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={28} color="black" />
                </Pressable>
                <Text style={styles.headerTitle}>Thanh Toán</Text>
            </View>
            <View>
                <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                {selectedAddress ? (
                    <Pressable style={styles.productItem} onPress={handleSelectAddress}>
                        <View>
                            <View style={styles.addressDetail}>
                                <FontAwesome name="user" size={18} color="black" />
                                <Text style={styles.name}>  {selectedAddress.name}</Text>
                            </View>
                            <View style={styles.addressDetail}>
                                <Feather name="phone" size={14} color="black" />
                                <Text>  {selectedAddress.phone}</Text>
                            </View>
                            <View style={styles.addressDetail}>
                                <Feather name="map-pin" size={14} color="black" />
                                <Text>  {selectedAddress.address}</Text>
                            </View>
                        </View>
                    </Pressable>
                ) : (
                    <Pressable style={styles.productItem} onPress={handleSelectAddress}>
                        <Text style={styles.noAddressText}>Vui lòng chọn địa chỉ</Text>
                    </Pressable>
                )}
            </View>
            {/* Order Summary Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
                {products?.map((product) => (
                    <View key={product.product_id} style={styles.orderSummary}>
                        <Image source={{ uri: product.image }} style={styles.productImage} />
                        <View style={styles.productDetails}>
                            <Text style={styles.productName}>{product.product_name}</Text>
                            <Text style={styles.productQuantity}>x{product.quantity_pur}</Text>
                            <Text style={styles.productPrice}>{(product.price * product.quantity_pur).toLocaleString()} VND</Text>
                        </View>
                    </View>
                ))}
            </View>
            {/* Shipping Option Section */}
            <View style={styles.section}>
                <View style={styles.shippingHeader}>
                    <Text style={styles.sectionTitle}>Tùy chọn giao hàng</Text>
                    <Pressable onPress={() => setModalVisible(true)}>
                        <Text>Thay đổi</Text>
                    </Pressable>
                </View>
                <View style={styles.shippingOption}>
                    <MaterialIcons name="local-shipping" size={24} color="#006AF5" />
                    <Text style={styles.selectedOptionText}>  {shippingOption}</Text>
                </View>
            </View>

            {/* Payment Method Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                <Pressable style={styles.paymentOption}>
                    <Text style={styles.paymentOptionText}>Thẻ tín dụng/ghi nợ</Text>
                </Pressable>
                <Pressable style={styles.paymentOption}>
                    <Text style={styles.paymentOptionText}>Ví điện tử</Text>
                </Pressable>
                <Pressable style={styles.paymentOption}>
                    <Text style={styles.paymentOptionText}>Thanh toán khi nhận hàng</Text>
                </Pressable>
            </View>
            <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 8 }}>
                <TextInput
                    placeholder="Nhập mã giảm giá"
                    style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, backgroundColor: '#f8f8f8' }}
                >
                </TextInput>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
                <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Tiền tạm tính:</Text>
                    <Text style={styles.paymentDetailValue}>
                        {(products ?? []).reduce((sum, product) => sum + product.price * product.quantity_pur, 0).toLocaleString()} VND
                    </Text>
                </View>
                <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Phí giao hàng:</Text>
                    <Text style={styles.paymentDetailValue}>
                        {shippingOption.includes('1') ? '20,000' : '50,000'} VND
                    </Text>
                </View>
                <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Giảm giá:</Text>
                    <Text style={styles.paymentDetailValue}>0 VND</Text>
                </View>
                <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Tổng cộng:</Text>
                    <Text style={styles.paymentDetailValue}>
                        {(

                            (products ?? []).reduce((sum, product) => sum + product.price * product.quantity_pur, 0) +
                            (shippingOption.includes('1') ? 20000 : 50000)
                        ).toLocaleString()} VND
                    </Text>
                </View>
            </View>


            {/* Place Order Button */}
            <Pressable style={styles.placeOrderButton}>
                <Text style={styles.placeOrderButtonText}>Đặt hàng</Text>
            </Pressable>

            {/* Shipping Options Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalContainer} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Chọn tùy chọn giao hàng</Text>
                        {shippingOptions.map((option: any) => (
                            <Pressable key={option.id} style={styles.modalOption} onPress={() => handleSelectShippingOption(option.id)}>
                                <Text>{option.name} ({option.deliveryTime})</Text>
                            </Pressable>
                        ))}
                        <Pressable style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeModalText}>Đóng</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </ScrollView>
    );
};

export default CheckoutScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    backButton: {
        marginLeft: 5,
    },
    headerTitle: {
        marginLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        marginVertical: 5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    productItem: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
    productName: {
        fontSize: 16,
    },
    productQuantity: {
        fontSize: 16,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    paymentOption: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    paymentOptionText: {
        fontSize: 16,
    },
    placeOrderButton: {
        backgroundColor: '#006AF5',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        bottom: 10,
    },
    placeOrderButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    noAddressText: {
        fontSize: 16,
        color: '#888',
        marginBottom: 10,
    },
    selectedOptionText: {
        fontSize: 16,
        color: '#000',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalOption: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        width: '100%',
        alignItems: 'center',
    },
    closeModalButton: {
        marginTop: 20,
    },
    closeModalText: {
        color: '#006AF5',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    orderSummary: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
    },
    productImage: {
        width: 100,
        height: 100,
    },
    productDetails: {
        padding: 10,
    },
    addressDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    shippingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shippingOption: {
        flexDirection: 'row',
        padding: 10,
        borderWidth: 1,
        borderColor: '#a9a9a9',
        borderRadius: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text_footer: {
        justifyContent: 'space-between'
    },
    paymentDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    paymentDetailLabel: {
        fontSize: 16,
        color: '#333',
    },
    paymentDetailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },

});

