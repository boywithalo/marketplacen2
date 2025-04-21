// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAySFfS66D8NcrLIsFt5ryvNfNjERD3Fm0",
    authDomain: "alore-account.firebaseapp.com",
    projectId: "alore-account",
    storageBucket: "alore-account.firebasestorage.app",
    messagingSenderId: "1084840599343",
    appId: "1:1084840599343:web:45fa9574cabe097b298bda",
    measurementId: "G-PGTZL1W61C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Add CORS headers to storage requests in development
if (process.env.NODE_ENV === 'development') {
  // You can uncomment this to use the storage emulator if needed
  // connectStorageEmulator(storage, 'localhost', 9199);
}

// Configure auth to use popup mode with less restrictive settings
auth.useDeviceLanguage();

export { auth, db, storage };