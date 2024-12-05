import { View, Text } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home1 from './Home1';
import Home2 from './Home2';

const Stack = createNativeStackNavigator();

const StackN = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen name="Home1" component={Home1} />
            <Stack.Screen name="Home2" component={Home2} />
        </Stack.Navigator>
    )
}

export default StackN