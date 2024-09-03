import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, db } from './firebaseConfig'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

GoogleSignin.configure({
    webClientId: '148816240907-6nnvsft43h23kg5807f8i3vo0corg1af.apps.googleusercontent.com',
});

export const signInWithGoogle = async () => {
    
    try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);
        // Lấy UID của người dùng
        const uid = userCredential.user.uid;
        console.log('User UID:', uid);
        // Lấy thông tin người dùng từ Google
        const { email, name, photo } = userInfo.user;
        // Kiểm tra xem document với UID đã tồn tại chưa
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef)
        if (!userDoc.exists()) {
            // Lưu thông tin người dùng vào Firestore nếu chưa tồn tại
            await setDoc(userDocRef, {
                UID: uid,
                gender: 'Nam',
                birthdate: `1/1/2000`,
                email: email,
                name: name,
                photoURL: photo,
            });
            console.log('User information saved to Firestore');
        } else {
            console.log('User already exists in Firestore');
        }
        return userInfo;
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        throw error;
    }
};
