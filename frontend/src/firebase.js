import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "voice-task-manager-25dcd.firebaseapp.com",
  projectId: "voice-task-manager-25dcd",
  storageBucket: "voice-task-manager-25dcd.appspot.com",
  messagingSenderId: "1027904874791",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function signInWithGooglePopup() {
  return signInWithPopup(auth, provider);
}

export default app;
