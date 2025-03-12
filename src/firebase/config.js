import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyD5E4oCBx2cLPda-k6sYDpgcI0qU4vYKPM",
    authDomain: "tos-merchant-tracker.firebaseapp.com",
    projectId: "tos-merchant-tracker",
    storageBucket: "tos-merchant-tracker.firebasestorage.app",
    messagingSenderId: "92080515702",
    appId: "1:92080515702:web:40f5883ad1d49f3841cd57",
    measurementId: "G-5918HNK4B1"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };