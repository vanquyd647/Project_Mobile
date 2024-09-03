import React from 'react';
import { useDispatch } from 'react-redux';
import { View, Button } from 'react-native';
import { addToCart, Item, UnknownAction } from '../src/actions'; 

const ProductList = () => {
    const dispatch = useDispatch();

    const handleAddToCart = (item: Item) => {
        dispatch(addToCart(item) as UnknownAction); 
    };

    return (
        <View>
            <Button title="Add Product 1 to Cart" onPress={() => handleAddToCart({ id: 1, name: 'Product 1' })} />
            <Button title="Add Product 2 to Cart" onPress={() => handleAddToCart({ id: 2, name: 'Product 2' })} />
        </View>
    );
};

export default ProductList;
