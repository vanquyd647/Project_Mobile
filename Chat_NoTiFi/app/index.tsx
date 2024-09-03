import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, TextInput, Image, SafeAreaView, TouchableOpacity, StatusBar, Alert, Modal } from "react-native";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { MaterialIcons } from '@expo/vector-icons';
import messaging from '@react-native-firebase/messaging';
import { useNavigation, NavigationProp } from "@react-navigation/native";

export default function Index() {
  const navigation = useNavigation<NavigationProp<any>>();

  const requestUserPermission = async (): Promise<void> => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  };

  useEffect(() => {
    requestUserPermission().then(() => {
      messaging().getToken().then(token => {
        console.log(token);
      });
    }).catch(() => {
      console.log("Permission not granted");
    });

    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    });

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
    });

    return unsubscribe;
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableOpacity onPress={() => navigation.navigate("signup")}>
        <Text>Edit app/index.tsx to edit this screen.</Text>
      </TouchableOpacity>
    </View>
  );
}
