import React from 'react';
import { useSelector } from 'react-redux';
import { View, Text } from 'react-native';
import { Item } from '../src/actions';

const Cart = () => {
    const cart = useSelector((state: { cart: Item[] }) => state.cart);

    // Calculate the number of distinct items in the cart
    const distinctItemCount = cart.length;

    return (
        <View>
            <Text>Number of Distinct Products in Cart: {distinctItemCount}</Text>
            {cart.map((item) => (
                <Text key={item.id}>{item.name} - Quantity: {item.quantity}</Text>
            ))}
        </View>
    );
};

export default Cart;
