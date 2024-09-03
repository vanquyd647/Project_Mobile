import { Image, ScrollView, StyleSheet, Text, View , Pressable} from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


const PrimiumScreen = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const navigation = useNavigation();
  

  useEffect(() => {
    const getPlaylists = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("token");
        const response = await axios.get(
          "https://api.spotify.com/v1/me/playlists",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setPlaylists(response.data.items);
      } catch (error) {
        console.error("Error retrieving playlists:", error);
      }
    };

    getPlaylists();
  }, []);
  useEffect(() => {
    getProfile();
  }, []);
  const getProfile = async () => {
    console.log("hi");
    const accessToken = await AsyncStorage.getItem("token");
    console.log("accesssssed token", accessToken);
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setUserProfile(data);
      return data;
    } catch (error) {
      console.log("error my friend", error.message);
    }
  };
  console.log(playlists);
  return (
    <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
      <View style={{justifyContent:'center',alignItems:'center',flex:1}}>
        <Image style={{width:250, height:250}} source={require('../assets/Spotify.png')}/>

      </View>
    </LinearGradient>
  );
};

export default PrimiumScreen;

const styles = StyleSheet.create({});
