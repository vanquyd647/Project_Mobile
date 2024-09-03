import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useFirebaseMessaging from '../components/pushNotifications';
import StackNavigator from '@/components/StackNavigator';
import { store } from '../redux/store';
import { AddressSelectionProvider } from '../contextApi/addressSelectionContext';

const Index: React.FC = () => {
  useFirebaseMessaging();

  return (
    <Provider store={store}>
      <AddressSelectionProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StackNavigator />
        </GestureHandlerRootView>
      </AddressSelectionProvider>
    </Provider>
  );
};

export default Index;
