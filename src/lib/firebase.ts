import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBIN7fjezgzsunbEcIpkBIxvrsoytM2iTw",
  authDomain: "vairal-ai.firebaseapp.com",
  projectId: "vairal-ai",
  storageBucket: "vairal-ai.firebasestorage.app",
  messagingSenderId: "225482085646",
  appId: "1:225482085646:web:835f71a3e116757974335f",
  measurementId: "G-EDTECSR9F0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics only runs in the browser
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
