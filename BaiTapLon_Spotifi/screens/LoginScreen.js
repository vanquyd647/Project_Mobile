// Date: 2021-09-06
import { StyleSheet, Text, View, SafeAreaView, Pressable, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Entypo, MaterialIcons, AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { authorize } from 'react-native-app-auth';

const CLIENT_ID = "fb1a236871bf4ce0822800333610feef";
const SPOTIFY_AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
const REDIRECT_URL_AFTER_LOGIN = "http://localhost:19006/"; 
const SPACE_DELIMITER = "%20";
const SCOPES = [
  "user-read-email",
  "user-library-read",
  "user-read-recently-played",
  "user-top-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public"
];
const SCOPES_URL_PARAM = SCOPES.join(SPACE_DELIMITER);

const config = {
  clientId: CLIENT_ID,
  redirectUrl: REDIRECT_URL_AFTER_LOGIN,
  scopes: SCOPES,
  serviceConfiguration: {
    authorizationEndpoint: SPOTIFY_AUTHORIZE_ENDPOINT,
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
  },
};

const getReturnedParamsFromSpotifyAuth = (hash) => {
  const stringAfterHashtag = hash.substring(1);
  const paramsInUrl = stringAfterHashtag.split("&");
  const paramsSplitUp = paramsInUrl.reduce((accumulator, currentValue) => {
    const [key, value] = currentValue.split("=");
    accumulator[key] = value;
    return accumulator;
  }, {});

  return paramsSplitUp;
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web' && window.location.hash) {
      const { access_token, expires_in, token_type } = getReturnedParamsFromSpotifyAuth(window.location.hash);

      AsyncStorage.clear();

      AsyncStorage.setItem("accessToken", access_token);
      AsyncStorage.setItem("tokenType", token_type);
      AsyncStorage.setItem("expiresIn", expires_in);

      setAccessToken(access_token);
      console.log(access_token);
    }
  }, []);

  useEffect(() => {
    const storeToken = async () => {
      if (accessToken) {
        const expiresIn = await AsyncStorage.getItem("expiresIn");
        const expirationDate = new Date().getTime() + parseInt(expiresIn, 10) * 1000;

        await AsyncStorage.setItem("token", accessToken);
        await AsyncStorage.setItem("expirationDate", expirationDate.toString());

        navigation.navigate("Main");
      }
    };

    storeToken();
  }, [accessToken]);

  const handleLogin = async () => {
    if (Platform.OS === 'web') {
      window.location = `${SPOTIFY_AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL_AFTER_LOGIN}&scope=${SCOPES_URL_PARAM}&response_type=token&show_dialog=true`;
    } else {
      try {
        const authState = await authorize(config);
        await AsyncStorage.setItem("accessToken", authState.accessToken);
        await AsyncStorage.setItem("tokenType", authState.tokenType);
        await AsyncStorage.setItem("expiresIn", authState.accessTokenExpirationDate);

        setAccessToken(authState.accessToken);
      } catch (error) {
        console.error("Failed to log in", error);
      }
    }
  };

  return (
    <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
      <SafeAreaView>
        <View style={{ height: 80 }} />
        <Entypo
          style={{ textAlign: "center" }}
          name="spotify"
          size={80}
          color="white"
        />
        <Text
          style={{
            color: "white",
            fontSize: 40,
            fontWeight: "bold",
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Millions of Songs Free on Spotify!
        </Text>

        <View style={{ height: 80 }} />
        <Pressable
          onPress={handleLogin}
          style={{
            backgroundColor: "#1DB954",
            padding: 10,
            marginLeft: "auto",
            marginRight: "auto",
            width: 300,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 10
          }}
        >
          <Text>Sign In with Spotify</Text>
        </Pressable>

        <Pressable
          style={{
            backgroundColor: "#131624",
            padding: 10,
            marginLeft: "auto",
            marginRight: "auto",
            width: 300,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 10,
            borderColor: "#C0C0C0",
            borderWidth: 0.8
          }}
        >
          <MaterialIcons name="phone-android" size={24} color="white" />
          <Text style={{ fontWeight: "500", color: "white", textAlign: "center", flex: 1 }}>Continue with Phone Number</Text>
        </Pressable>

        <Pressable
          style={{
            backgroundColor: "#131624",
            padding: 10,
            marginLeft: "auto",
            marginRight: "auto",
            width: 300,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 10,
            borderColor: "#C0C0C0",
            borderWidth: 0.8
          }}
        >
          <AntDesign name="google" size={24} color="red" />
          <Text style={{ fontWeight: "500", color: "white", textAlign: "center", flex: 1 }}>Continue with Google</Text>
        </Pressable>

        <Pressable
          style={{
            backgroundColor: "#131624",
            padding: 10,
            marginLeft: "auto",
            marginRight: "auto",
            width: 300,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 10,
            borderColor: "#C0C0C0",
            borderWidth: 0.8
          }}
        >
          <Entypo name="facebook" size={24} color="blue" />
          <Text style={{ fontWeight: "500", color: "white", textAlign: "center", flex: 1 }}>Sign In with Facebook</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({});
