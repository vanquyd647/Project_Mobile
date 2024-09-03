import React, { useState, createContext, useContext, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import Login from '../screen/Login';
import Signup from '../screen/Signup';
import Profile from '../screen/Profile';
import List_Chat from '../screen/List_Chat';
import Phone_Book from '../screen/Phone_Book';
import Setting_App from '../screen/Setting_App';    
import SearchFriend from '../screen/SearchFriend';
import Personal_Page from '../screen/Personal_Page';
import Friend_Request from '../screen/Friend_Request';
import Add_groups from '../screen/Add_groups';
import Chat_messages from '../screen/Chat_messages';
import Option_chat from '../screen/Option_chat';
import Setting_group from '../screen/Setting_group';
import Manager_group from '../screen/Manager_group';
import Forward_message from '../screen/Forward_message';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
                            <FontAwesome name="comment" size={24} color="#9acd32" />
                        ) : (
                            <FontAwesome name="comment-o" size={24} color="black" />
                        ),
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? '#9acd32' : 'black', fontSize: 12 }}>
                                Tin nhắn
                            </Text>
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
                            <FontAwesome name="address-book" size={24} color="#9acd32" />
                        ) : (
                            <FontAwesome name="address-book-o" size={24} color="black" />
                        ),
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? '#9acd32' : 'black', fontSize: 12 }}>
                                Danh bạ
                            </Text>
                        ),
                }}
            />
            <Tab.Screen
                name="Cá nhân"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <FontAwesome name="user" size={24} color="#9acd32" />
                        ) : (
                            <FontAwesome name="user-o" size={24} color="black" />
                        ),
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? '#9acd32' : 'black', fontSize: 12 }}>
                                Cá nhân
                            </Text>
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
            <Stack.Screen name="Setting_App" component={Setting_App} options={{ headerShown: false }}/>
            <Stack.Screen name="SearchFriend" component={SearchFriend} options={{ headerShown: false }}/>
            <Stack.Screen name="Personal_Page" component={Personal_Page} options={{ headerShown: false }}/>
            <Stack.Screen name="Friend_Request" component={Friend_Request} options={{ headerShown: false }}/>
            <Stack.Screen name="Add_groups" component={Add_groups} options={{ headerShown: false }}/>
            <Stack.Screen name="Chat_messages" component={Chat_messages} options={{ headerShown: false }}/>
            <Stack.Screen name="Option_chat" component={Option_chat} options={{ headerShown: false }}/>
            <Stack.Screen name="Setting_group" component={Setting_group} options={{ headerShown: false }}/>
            <Stack.Screen name="Manager_group" component={Manager_group} options={{ headerShown: false }}/>
            <Stack.Screen name="Forward_message" component={Forward_message} options={{ headerShown: false }}/>
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