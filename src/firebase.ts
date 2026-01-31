// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Added for Firestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqsx9tKxNtf_IXB3uzB9mmGlBUJPj6tRU",
  authDomain: "planix-8fefc.firebaseapp.com",
  projectId: "planix-8fefc",
  storageBucket: "planix-8fefc.firebasestorage.app",
  messagingSenderId: "67238502369",
  appId: "1:67238502369:web:8597f7b00a673efb6c7ca0",
  measurementId: "G-CPZHEQ86S9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app); // Export db for use in other files