import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7Ub1U5yMf_16BG7GRnWUsdH9nyLcI7Mg",
  authDomain: "smart-groundwater.firebaseapp.com",
  projectId: "smart-groundwater",
  storageBucket: "smart-groundwater.firebasestorage.app",
  messagingSenderId: "418685406236",
  appId: "1:418685406236:web:a2bd259c5c739af8e9a3d9",
  measurementId: "G-DDTTBPLJKT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;