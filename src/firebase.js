import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTSBRwgEZ9JixSknZvJUmb4kJDV7SFmXY",
  authDomain: "kursova-53dbb.firebaseapp.com",
  projectId: "kursova-53dbb",
  storageBucket: "kursova-53dbb.firebasestorage.app",
  messagingSenderId: "355324991825",
  appId: "1:355324991825:web:0f31ffa9aa8c19baccdb70",
  measurementId: "G-B1PVLL99WP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);

export { db, analytics };