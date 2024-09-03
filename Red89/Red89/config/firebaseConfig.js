import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config
const firebaseConfig = {
    apiKey: 'AIzaSyDF-_GnYs8IBi1lkLdcSuH4Qdrdz4CVnNw',
    authDomain: 'red89-f8933.firebaseapp.com',
    projectId: 'red89-f8933',
    storageBucket: 'red89-f8933.appspot.com',
    messagingSenderId: '148816240907',
    appId: '1:148816240907:web:9aba16f39bce554467820e',
    measurementId: 'G-L2NV721VLZ'
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
