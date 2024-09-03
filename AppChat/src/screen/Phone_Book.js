import React, { useState } from 'react';
import { SafeAreaView, Pressable, StyleSheet, Text, View } from 'react-native';
import { AntDesign, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Friends from '../screen/Friends';
import Groups from '../screen/Groups';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const TabTop = createMaterialTopTabNavigator();

const Phone_Book = () => {
  const navigation = useNavigation();
  const [input, setInput] = useState("");

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <Pressable>
            <AntDesign name="search1" size={20} color="white" />
          </Pressable>
          <Pressable style={styles.searchInput} onPress={() => navigation.navigate("SearchFriend")}>
            <Text style={styles.textSearch}>Tìm kiếm</Text>
          </Pressable>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" />
          <Feather name="plus" size={30} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <TabTop.Navigator
            screenOptions={{
              tabBarActiveTintColor: '#006AF5', // Màu của viền dưới khi tab được chọn
              tabBarInactiveTintColor: 'black', // Màu của tab khi không được chọn
              tabBarIndicatorStyle: { backgroundColor: '#006AF5' }, // Màu nền của viền dưới khi tab được chọn
              tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' }, // Kiểu chữ của label
              tabBarStyle: { backgroundColor: 'white' },
            }}
          >
            <TabTop.Screen name="Bạn bè" component={Friends} />
            <TabTop.Screen name="Nhóm" component={Groups} />
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
    backgroundColor: "#006AF5",
    padding: 9,
    height: 48,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    justifyContent: "center",
    height: 48,
    marginLeft: 10,
  },
  textSearch: {
    color: "white",
    fontWeight: '500'
  },
});

export default Phone_Book;
