import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import firestore từ firebase/firestore
import { getStorage } from "firebase/storage";


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAWBafaQJArYSo-LRuQMupP-k24DJQscmY",
  authDomain: "demo1-sub.firebaseapp.com",
  projectId: "demo1-sub",
  storageBucket: "demo1-sub.appspot.com",
  messagingSenderId: "1077094001477",
  appId: "1:1077094001477:web:b51950f21a9beaf2e7ec2c",
  measurementId: "G-CNH4205XQM"
  //   @deprecated is deprecated Constants.manifestF
};
// initialize firebase
initializeApp(firebaseConfig);
export const auth = getAuth();
export const firestore = getFirestore(); // Sử dụng getFirestore() để khởi tạo firestore
export const storage = getStorage();
