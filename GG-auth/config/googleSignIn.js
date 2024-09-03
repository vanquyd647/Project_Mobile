// googleSignIn.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';

GoogleSignin.configure({
    webClientId: '148816240907-6nnvsft43h23kg5807f8i3vo0corg1af.apps.googleusercontent.com', 
});

export const signInWithGoogle = async () => {
    try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
        await signInWithCredential(auth, googleCredential);
        console.log('User signed in with Google:', userInfo);
        return userInfo;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
