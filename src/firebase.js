// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6Bn-r5R_m7ZyUQHjC5dnwAX_KcmKtYCw",
  authDomain: "robwestplumbing-2eb06.firebaseapp.com",
  projectId: "robwestplumbing-2eb06",
  storageBucket: "robwestplumbing-2eb06.firebasestorage.app",
  messagingSenderId: "1016017584876",
  appId: "1:1016017584876:web:2de84f833e7747ef459bc9",
  measurementId: "G-11YJK1JPV7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'rob-west-plumbing-main';