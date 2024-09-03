import React from 'react';
import { Button, View, Text } from 'react-native';
import { signInWithGoogle } from '../config/googleSignIn';

export default function Index() {
  const handleGoogleSignIn = async () => {
    try {
      const userInfo = await signInWithGoogle();
      console.log('User Info:', userInfo);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button title="Google Sign-In" onPress={handleGoogleSignIn} />
    </View>
  );
}