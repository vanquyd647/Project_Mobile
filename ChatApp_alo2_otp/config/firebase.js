import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import firestore từ firebase/firestore
import { getStorage } from "firebase/storage";


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCSQoHGmnles9j5XfHsMwKFiLWSbFHN5J4",
  authDomain: "demo1-14597.firebaseapp.com",
  databaseURL: "https://demo1-14597-default-rtdb.firebaseio.com",
  projectId: "demo1-14597",
  storageBucket: "demo1-14597.appspot.com",
  messagingSenderId: "985434954999",
  appId: "1:985434954999:web:b8a6e5ab0be8e2d94f87f2"
  //   @deprecated is deprecated Constants.manifest
};
// initialize firebase
initializeApp(firebaseConfig);
export const auth = getAuth();
export const firestore = getFirestore(); // Sử dụng getFirestore() để khởi tạo firestore
export const storage = getStorage();



