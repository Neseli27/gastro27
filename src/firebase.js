import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || "AIzaSyDTt_1ERzW7Kwmx0261f0TI_P9YeKy29wc",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN || "gastro27-65a88.firebaseapp.com",
  projectId: import.meta.env.VITE_FB_PROJECT_ID || "gastro27-65a88",
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET || "gastro27-65a88.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_ID || "825834531187",
  appId: import.meta.env.VITE_FB_APP_ID || "1:825834531187:web:5e5b0999ad44112f3ffd06",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
