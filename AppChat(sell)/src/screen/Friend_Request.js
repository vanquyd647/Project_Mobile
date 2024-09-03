import React from 'react';
import { SafeAreaView, Pressable, StyleSheet, Text, View } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Friend_received from "../screen/Friend_received";
import Friend_sent from "../screen/Friend_sent";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const TabTop = createMaterialTopTabNavigator();

const Friend_Request = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.searchContainer}>
                    <Pressable onPress={() => navigation.navigate("Main")}>
                        <AntDesign name="arrowleft" size={20} color="white" />
                    </Pressable>
                    <Text style={styles.textSearch}>Lời mời kết bạn</Text>
                    <Pressable>
                        <MaterialIcons name="settings" size={24} color="white" />
                    </Pressable>
                </View>
                <View style={{ flex: 1 }}>
                    <TabTop.Navigator
                        screenOptions={{
                            tabBarActiveTintColor: '#9acd32',
                            tabBarInactiveTintColor: 'black',
                            tabBarIndicatorStyle: { backgroundColor: '#9acd32' },
                            tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
                            tabBarStyle: { backgroundColor: 'white' },
                        }}
                    >
                        <TabTop.Screen name="Đã Nhận" component={Friend_received} />
                        <TabTop.Screen name="Đã gửi" component={Friend_sent} />
                    </TabTop.Navigator>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#9acd32",
        padding: 9,
        height: 48,
        width: '100%',
    },
    textSearch: {
        flex: 1,
        color: "white",
        fontWeight: '500',
        marginLeft: 20
    },
});

export default Friend_Request;
