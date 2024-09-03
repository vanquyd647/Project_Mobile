import { StatusBar } from 'expo-status-bar';
import StackNavigator from './src/navigation/StackNavigator';
import { ChatsProvider } from './src/contextApi/ChatContext';

export default function App() {
  return (
    <>
      {/* <StatusBar barStyle="light-content" backgroundColor="blue" style='auto'/> */}
      <ChatsProvider>
        <StackNavigator />
      </ChatsProvider>
    </>


  );
}