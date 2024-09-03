import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Modal, Button } from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../components/types';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/redux/cartSlice';
import { ProductDetailsScreenNavigationProp } from '../components/types';

type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetailsScreen'>;

const ProductDetailsScreen = () => {
    const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
    const route = useRoute<ProductDetailsRouteProp>();
    const { product } = route.params;
    const [modalVisible, setModalVisible] = useState(false);
    const [quantity_pur, setQuantity_pur] = useState(1);
    const [isBuyNow, setIsBuyNow] = useState(false);
    const dispatch = useDispatch();

    useFocusEffect(
        useCallback(() => {
            setIsBuyNow(false);
        }, [])
    );

    const handleIncrease = () => {
        if (quantity_pur < product.quantity) {
            setQuantity_pur(quantity_pur + 1);
        }
    };

    const handleDecrease = () => {
        if (quantity_pur > 1) {
            setQuantity_pur(quantity_pur - 1);
        }
    };

    const handleAddToCart = () => {
        if (quantity_pur <= product.quantity) {
            dispatch(addToCart({ ...product, quantity_pur }));
            setModalVisible(false);
        } else {
            alert('Số lượng sản phẩm không đủ');
        }
    };

    const handleBuyNow = () => {
        if (quantity_pur <= product.quantity) {
            setModalVisible(false);
            // Create the product object in the format similar to cart items
            const itemToCheckout = [
                {
                    image: product.image,
                    product_id: product.product_id,
                    product_name: product.product_name,
                    price: product.price,
                    quantity_pur: quantity_pur,
                },
            ];
    
            // Navigate to CheckoutScreen with the formatted products array
            navigation.navigate('CheckoutScreen', {
                products: itemToCheckout,
            });
        } else {
            alert('Số lượng sản phẩm không đủ');
        }
    };
    

    const openModal = (buyNow = false) => {
        setIsBuyNow(buyNow);
        setModalVisible(true);
    };



    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: product.image }} style={styles.productImage} />
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>{product.price.toLocaleString()} VND</Text>
                <Text style={styles.productSale}>Sale: {product.sale}%</Text>
            </View>
            <View>
                <Text style={styles.productName}>{product.product_name}</Text>
            </View>
            <View style={styles.rate_sell_container}>
                <View style={{ flexDirection: 'row' }}>
                    <AntDesign name="star" size={20} color="#FFD700" />
                    <Text style={styles.productStar}>{product.star}</Text>
                </View>
                <Text style={styles.productSold}>Đã bán {product.sold}</Text>
            </View>
            {/* Add other product details as needed */}
            <View style={styles.fixedFooter}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'column', marginHorizontal: 15 }}>
                        <Entypo name="shop" size={24} color="black" />
                        <Text>Shop</Text>
                    </View>
                    <View style={{ flexDirection: 'column', marginHorizontal: 15 }}>
                        <Entypo name="chat" size={24} color="black" />
                        <Text>Chat</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <View style={styles.footContainer}>
                        <Pressable onPress={() => openModal(true)}>
                            <Text style={styles.buttonText}>Mua ngay</Text>
                        </Pressable>
                    </View>
                    <View style={styles.footContainer2}>
                        <Pressable onPress={() => setModalVisible(true)}>
                            <Text style={styles.buttonText}>Thêm vào</Text>
                            <Text style={styles.buttonText}>giỏ hàng</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                    setIsBuyNow(false);
                }}>
                <View style={styles.modalContainer}>
                    <Pressable style={styles.overlay} onPress={() => {setModalVisible(false); setIsBuyNow(false);}} />
                    <View style={styles.modalView}>
                        <View style={styles.header}>
                            <View style={{ padding: 10 }}>
                                <Pressable onPress={() => {
                                    setModalVisible(false);
                                    setIsBuyNow(false);  
                                }}>
                                    <AntDesign name="close" size={24} color="#dcdcdc" />
                                </Pressable>
                            </View>
                        </View>
                        <Text style={styles.modalText}>Chọn Sản Phẩm và Số Lượng</Text>
                        <View style={styles.quantityContainer}>
                            <Pressable style={styles.quantityButton} onPress={handleDecrease} disabled={quantity_pur <= 1}>
                                <Text style={styles.quantityButtonText}>-</Text>
                            </Pressable>
                            <Text style={styles.quantityText}>{quantity_pur}</Text>
                            <Pressable style={[styles.quantityButton]} onPress={handleIncrease} disabled={quantity_pur > product.quantity}>
                                <Text style={styles.quantityButtonText}>+</Text>
                            </Pressable>
                        </View>
                        {quantity_pur >= product.quantity && (
                            <Text style={styles.warningText}>Vượt quá số lượng kho</Text>
                        )}
                        <Pressable style={styles.buttonAdd} onPress={isBuyNow ? handleBuyNow : handleAddToCart}>
                            <Text style={styles.buttonText2}>{isBuyNow ? 'Mua ngay' : 'Thêm vào giỏ hàng'}</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default ProductDetailsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // alignItems: 'center',
        backgroundColor: 'white',
    },
    imageContainer: {
        borderBottomWidth: 0.5,
        borderColor: '#ddd',
        width: '100%',
        aspectRatio: 1, // Giữ tỷ lệ vuông
    },
    priceContainer: {
        flexDirection: 'column',
        marginVertical: 10,
    },
    rate_sell_container: {
        alignItems: 'center',
        marginHorizontal: 10,
        flexDirection: 'row',
        // justifyContent: 'space-between',
        marginVertical: 10,
    },
    productImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    productName: {
        marginHorizontal: 10,
        fontSize: 24,
        fontWeight: 'bold',
    },
    productPrice: {
        marginHorizontal: 10,
        fontSize: 23,
        fontWeight: 'bold',
        color: '#006AF5',
        marginVertical: 5,
    },
    productSale: {
        marginHorizontal: 10,
        fontSize: 18,
        color: 'red',
    },
    productSold: {
        marginHorizontal: 10,
        fontSize: 16,
    },
    productStar: {
        fontSize: 18,
        color: '#FFD700',
    },
    footContainer: {
        backgroundColor: '#ffa500',
        width: 120,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    footContainer2: {
        backgroundColor: '#006AF5',
        width: 120,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    fixedFooter: {
        borderTopWidth: 1,
        borderColor: '#ddd',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        height: 55,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Màu nền mờ
    },
    modalView: {
        height: '50%',
        backgroundColor: "white",
        // borderTopLeftRadius: 20,
        // borderTopRightRadius: 20,
        // padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        alignItems: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonAdd: {
        width: '80%',
        backgroundColor: '#006AF5',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        bottom: 20,
        position: 'absolute',
    },
    buttonText: {
        color: 'white',
        fontWeight:'bold',
    },
    buttonText2: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    quantityButton: {
        backgroundColor: '#ddd',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    quantityButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    quantityText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    warningText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
});
