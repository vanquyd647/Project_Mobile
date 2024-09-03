import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import firestore từ firebase/firestore
import { getStorage } from "firebase/storage";


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB56q0rIYvt9KbDVFkqysdDKeq6HunrBkA",
  authDomain: "chatlofi-9c2c8.firebaseapp.com",
  projectId: "chatlofi-9c2c8",
  storageBucket: "chatlofi-9c2c8.appspot.com",
  messagingSenderId: "901109384021",
  appId: "1:901109384021:web:e8c72a03840424509625dc",
  measurementId: "G-L0TG3RV89H"
};
// initialize firebase
initializeApp(firebaseConfig);
export const auth = getAuth();
export const firestore = getFirestore(); // Sử dụng getFirestore() để khởi tạo firestore
export const storage = getStorage();



