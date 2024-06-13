import React from 'react';
import { StatusBar } from 'react-native';
import StackNavigator from "../src/navigation/StackNavigator";
import { ChatsProvider } from '../src/contextApi/ChatContext'; // Sửa lại nếu cần thiết

export default function Index() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#9acd32" />
      <ChatsProvider>
        <StackNavigator />
      </ChatsProvider>
    </>
  );
}
