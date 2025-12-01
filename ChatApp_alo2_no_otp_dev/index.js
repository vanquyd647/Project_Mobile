/**
 * Entry point for ChatLofi app
 * Handles background notifications when app is killed/closed
 */

import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import App from './App';

// Register background message handler BEFORE app starts
// IMPORTANT: This only runs when app is in BACKGROUND (not killed)
// When app is KILLED, FCM shows notification automatically via system tray
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
  // FCM will automatically display the notification
  // No need to schedule local notification here
  return Promise.resolve();
});

// Handle notification when app is opened from killed state
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      console.log('App opened from quit state by notification:', remoteMessage);
      // Store initial notification data for navigation
      global.initialNotification = remoteMessage;
    }
  });

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Register the main component
registerRootComponent(App);
