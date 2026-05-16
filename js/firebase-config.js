// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtAMhhXlQ6zrVTE9dlbszBa_xp4Fx8zFE",
  authDomain: "sonu-kirana-store.firebaseapp.com",
  projectId: "sonu-kirana-store",
  storageBucket: "sonu-kirana-store.firebasestorage.app",
  messagingSenderId: "1033236456469",
  appId: "1:1033236456469:web:3ea1e8792fd479c1e7da1c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore Database
export const auth = getAuth(app);
export const db = getFirestore(app);
