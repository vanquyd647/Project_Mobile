import React, { useState, createContext, useContext, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Login from '../screen/Login';
import Signup from '../screen/Signup';
import Profile from '../screen/Profile';
import List_Chat from '../screen/List_Chat';
import Phone_Book from '../screen/Phone_Book';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome } from '@expo/vector-icons';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';

const AuthenticatedUserContext = createContext({});

const AuthenticatedUserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Thêm trạng thái đăng nhập

    return (
        <AuthenticatedUserContext.Provider value={{ user, setUser, isLoggedIn, setIsLoggedIn }}>
            {children}
        </AuthenticatedUserContext.Provider>
    );
};


const Tab = createBottomTabNavigator();
function BottomTabs({ setIsLoggedIn }) {
    return (
        <Tab.Navigator screenOptions={{
            tabBarStyle: {
                backgroundColor: "white",
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,

                borderTopWidth: 0
            }
        }}>
            <Tab.Screen
                name="Tin nhắn"
                component={List_Chat}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <FontAwesome name="comment" size={24} color="#006AF5" />
                        ) : (
                            <FontAwesome name="comment-o" size={24} color="black" />
                        ),
                }}
            />
            <Tab.Screen
                name="Danh bạ"
                component={Phone_Book}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <FontAwesome name="address-book" size={24} color="#006AF5" />
                        ) : (
                            <FontAwesome name="address-book-o" size={24} color="black" />
                        ),
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
        </Stack.Navigator>

    )
}
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
                if (authenticatedUser && isLoggedIn) { // Chỉ xác thực khi isLoggedIn là true
                    setUser(authenticatedUser);
                    setIsLoading(false);
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            }
        );

        return unsubscribeAuth;
    }, [isLoggedIn]); // Theo dõi thay đổi của isLoggedIn

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
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <AuthenticatedUserProvider>
            <RootNavigator setIsLoggedIn={setIsLoggedIn} />
        </AuthenticatedUserProvider>
    );
}
export default StackNavigator