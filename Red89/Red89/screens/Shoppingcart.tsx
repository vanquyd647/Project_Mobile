import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, Pressable, Alert, Button, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import CheckBox from '@react-native-community/checkbox';
import AntDesign from '@expo/vector-icons/AntDesign';
import { RootState } from '../redux/store';
import { useSelector, useDispatch } from 'react-redux';
import { loadCartFromFirebase, saveCartToFirebase } from '../redux/cartSlice';
import { addToCart, removeFromCart } from '../redux/cartSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../components/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckoutScreen'>;

const Shoppingcart = () => {

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const cartItems = useSelector((state: RootState) => state.cart.items);
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        dispatch(loadCartFromFirebase() as never);
    }, [dispatch]);

    useEffect(() => {
        dispatch(saveCartToFirebase(cartItems) as never);
    }, [cartItems, dispatch]);

    const handleIncrease = (item: any) => {
        if (item.quantity_pur < item.quantity) {
            dispatch(addToCart({ ...item, quantity_pur: 1 }));
        }
    };

    const handleDecrease = (item: any) => {
        if (item.quantity_pur > 1) {
            dispatch(addToCart({ ...item, quantity_pur: -1 }));
        } else {
            dispatch(removeFromCart(item.product_id));
        }
    };

    const handleDelete = (item: any) => {
        Alert.alert(
            "Xóa sản phẩm",
            "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
            [
                { text: "Hủy", style: "cancel" },
                { text: "Xóa", onPress: () => dispatch(removeFromCart(item.product_id)) }
            ]
        );
    };

    const handleDeleteSelected = () => {
        Alert.alert(
            "Xóa các sản phẩm đã chọn",
            "Bạn có chắc chắn muốn xóa các sản phẩm đã chọn khỏi giỏ hàng?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa", onPress: () => {
                        selectedItems.forEach(productId => dispatch(removeFromCart(productId)));
                        setSelectedItems(new Set());
                    }
                }
            ]
        );
    };

    const handleSelectItem = (productId: string) => {
        setSelectedItems(prevSelectedItems => {
            const updatedSet = new Set(prevSelectedItems);
            if (updatedSet.has(productId)) {
                updatedSet.delete(productId);
            } else {
                updatedSet.add(productId);
            }
            return updatedSet;
        });
    };

    const handleSelectAll = (value: boolean) => {
        setSelectAll(value);
        if (value) {
            const allProductIds = cartItems.map(item => item.product_id);
            setSelectedItems(new Set(allProductIds));
        } else {
            setSelectedItems(new Set());
        }
    };

    const renderRightActions = (item: any) => (
        <Pressable style={styles.deleteButton} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteButtonText}>Xóa</Text>
        </Pressable>
    );

    // Tính tổng cộng số tiền
    const totalAmount = Array.from(selectedItems).reduce((sum, productId) => {
        const item = cartItems.find(cartItem => cartItem.product_id === productId);
        return sum + (item ? item.price * item.quantity_pur : 0);
    }, 0);

    const handlePayment = () => {
        // Filter the selected items from the cart
        const itemsToCheckout = cartItems.filter(item => selectedItems.has(item.product_id));
        // If no items are selected, show an alert
        if (itemsToCheckout.length === 0) {
            Alert.alert("Chưa chọn sản phẩm", "Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
            return;
        }
        // Navigate to the CheckoutScreen and pass the items and total amount
        navigation.navigate('CheckoutScreen', {
            products: itemsToCheckout,
        });
    };


    const renderItem = ({ item }: { item: any }) => (
        <Swipeable renderRightActions={() => renderRightActions(item)}>
            <View style={styles.itemContainer}>
                <CheckBox
                    value={selectedItems.has(item.product_id)}
                    onValueChange={() => handleSelectItem(item.product_id)}
                />
                <View style={{ padding: 5 }}>
                    <Image source={{ uri: item.image }} style={{ width: 100, height: 100 }} />
                </View>
                <View style={{ padding: 5 }}>
                    <Text style={styles.productName}>{item.product_name}</Text>
                    <Text style={styles.productPrice}>{item.price.toLocaleString()} VND</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.productQuantity}>Số lượng:</Text>
                        {/* Add buttons to increase/decrease quantity */}
                        <View style={styles.quantityContainer}>
                            <Pressable style={styles.quantityButton} onPress={() => handleDecrease(item)} >
                                <Text style={styles.quantityButtonText}>-</Text>
                            </Pressable>
                            <Text style={styles.quantityText}>{item.quantity_pur}</Text>
                            <Pressable style={styles.quantityButton} onPress={() => handleIncrease(item)} disabled={item.quantity_pur > item.quantity}>
                                <Text style={styles.quantityButtonText}>+</Text>
                            </Pressable>
                        </View>
                    </View>
                    {item.quantity_pur >= item.quantity && (
                        <Text style={styles.warningText}>Vượt quá số lượng kho</Text>
                    )}
                </View>
            </View>
        </Swipeable>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text style={styles.title}> Giỏ hàng của tôi</Text>
                {selectedItems.size > 0 && (
                    <TouchableOpacity style={{ alignItems: 'flex-end' }} onPress={handleDeleteSelected}>
                        <AntDesign name="delete" size={24} color="black" />
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                contentContainerStyle={{ paddingBottom: 200 }}
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.product_id}
            />
            <View style={{ bottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50, backgroundColor: 'white' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckBox
                        value={selectAll}
                        onValueChange={handleSelectAll}
                    />
                    <Text>Tất cả</Text>
                </View>
                <Text style={styles.totalText}>Tổng cộng: {totalAmount.toLocaleString()} VND</Text>
                <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
                    <Text style={styles.paymentButtonText}>Thanh toán</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    itemContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    productPrice: {
        fontSize: 16,
        color: '#006AF5',
    },
    productQuantity: {
        fontSize: 16,
        color: '#006AF5',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        backgroundColor: '#ddd',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    quantityButtonText: {
        fontSize: 20,
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
    totalText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#006AF5',
    },
    paymentButton: {
        backgroundColor: '#006AF5',
        padding: 10,
        borderRadius: 5,
    },
    paymentButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default Shoppingcart;
