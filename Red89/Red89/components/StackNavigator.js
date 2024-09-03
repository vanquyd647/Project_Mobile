import React, { useState, createContext, useContext, useEffect } from 'react';
import { StatusBar, SafeAreaView, View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome, Feather, AntDesign, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import Home from '../screens/Home';
import Message from '../screens/Message';
import Favourite from '../screens/Favourite';
import Shoppingcart from '../screens/Shoppingcart';
import Profile from '../screens/Profile';
import Accessory from '@/screens/Accessory';
import Clothes from '@/screens/Clothes';
import Cosmetics from '@/screens/Cosmetics';
import Footwear from '@/screens/Footwear';
import Backpack from '@/screens/Backpack';
import Watch from '@/screens/Watch';
import ProductDetailsScreen from '@/screens/ProductDetailsScreen';
import CheckoutScreen from '@/screens/CheckoutScreen';
import SettingScreen from '@/screens/SettingScreen';
import OdersScreen from '@/screens/OdersScreen';
import AddressBookScreen from '@/screens/AddressBookScreen';
import Add_addressScreen from '@/screens/Add_addressScreen';

const AuthenticatedUserContext = createContext({});

const AuthenticatedUserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(
            auth,
            (authenticatedUser) => {
                if (authenticatedUser) {
                    setUser(authenticatedUser);
                    setIsLoggedIn(true);
                } else {
                    setUser(null);
                    setIsLoggedIn(false);
                }
            }
        );
        return unsubscribeAuth;
    }, []);

    return (
        <AuthenticatedUserContext.Provider value={{ user, setUser, isLoggedIn, setIsLoggedIn }}>
            {children}
        </AuthenticatedUserContext.Provider>
    );
};

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.tabBarContainer}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };
                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };
                const tabBarIcon = options.tabBarIcon({ focused: isFocused });
                const tabBarLabel = options.tabBarLabel({ focused: isFocused });
                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={[styles.tabBarItem, route.name === 'Shoppingcart' && styles.ShoppingcartTab, route.name === 'Cá nhân' && styles.profileTab]}
                    >
                        {tabBarIcon}
                        <Text style={{ color: isFocused ? '#006AF5' : 'black', fontSize: 12 }}>
                            {tabBarLabel}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const HomeStack = () => {
    const Stack = createNativeStackNavigator();
    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
            <Stack.Screen name="Clothes" component={Clothes} options={{ headerShown: false }} />
            <Stack.Screen name="Accessory" component={Accessory} options={{ headerShown: false }} />
            <Stack.Screen name="Cosmetics" component={Cosmetics} options={{ headerShown: false }} />
            <Stack.Screen name="Footwear" component={Footwear} options={{ headerShown: false }} />
            <Stack.Screen name="Backpack" component={Backpack} options={{ headerShown: false }} />
            <Stack.Screen name="Watch" component={Watch} options={{ headerShown: false }} />
            
        </Stack.Navigator>
    );
};

const BottomTabs = ({ setIsLoggedIn }) => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: "white",
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderTopWidth: 0,
                    height: 70,
                }
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <MaterialCommunityIcons name="home-variant" size={24} color="#006AF5" />
                        ) : (
                            <MaterialCommunityIcons name="home-variant-outline" size={24} color="black" />
                        ),
                    tabBarLabel: ({ focused }) => "Trang chủ",
                }}
            />
            <Tab.Screen
                name="Favourite"
                component={Favourite}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <FontAwesome name="heart" size={24} color="#006AF5" />
                        ) : (
                            <FontAwesome name="heart-o" size={24} color="black" />
                        ),
                    tabBarLabel: ({ focused }) => "Yêu thích",
                }}
            />
            <Tab.Screen
                name="Shoppingcart"
                component={Shoppingcart}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <MaterialCommunityIcons name="shopping" size={24} color="#006AF5" />
                        ) : (
                            <MaterialCommunityIcons name="shopping-outline" size={24} color="black" />
                        ),
                    tabBarLabel: ({ focused }) => "Giỏ hàng",
                }}
            />
            <Tab.Screen
                name="Message"
                component={Message}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <MaterialIcons name="messenger" size={24} color="#006AF5" />
                        ) : (
                            <MaterialIcons name="messenger-outline" size={24} color="black" />
                        ),
                    tabBarLabel: ({ focused }) => "Tin nhắn",
                }}
            />
            <Tab.Screen
                name="Cá nhân"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <FontAwesome name="user" size={24} color="#006AF5" />
                        ) : (
                            <FontAwesome name="user-o" size={24} color="black" />
                        ),
                    tabBarLabel: ({ focused }) => "Cá nhân",
                }}
            >
                {props => <Profile {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

const Stack = createNativeStackNavigator();

const ChatStack = ({ setIsLoggedIn }) => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
                {props => <BottomTabs {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="ProductDetailsScreen" component={ProductDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SettingScreen" component={SettingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OdersScreen" component={OdersScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddressBookScreen" component={AddressBookScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Add_addressScreen" component={Add_addressScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

const AuthStack = ({ setIsLoggedIn }) => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Login'>
                {props => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name='Signup'>
                {props => <Signup {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

function RootNavigator() {
    const { user, setUser } = useContext(AuthenticatedUserContext);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(
            auth,
            async (authenticatedUser) => {
                if (authenticatedUser && isLoggedIn) {
                    setUser(authenticatedUser);
                    setIsLoading(false);
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            }
        );

        return unsubscribeAuth;
    }, [isLoggedIn]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size='large' />
            </View>
        );
    }

    return (
        <>
            {user ? <ChatStack setIsLoggedIn={setIsLoggedIn} /> : <AuthStack setIsLoggedIn={setIsLoggedIn} />}
        </>
    );
}

const StackNavigator = () => {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" backgroundColor="black" />
            <AuthenticatedUserProvider>
                <RootNavigator />
            </AuthenticatedUserProvider>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 55,
        borderTopWidth: 0,
        elevation: 5,
        overflow: 'hidden',
    },
    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 5,
    },
    ShoppingcartTab: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    profileTab: {},
});

export default StackNavigator;
