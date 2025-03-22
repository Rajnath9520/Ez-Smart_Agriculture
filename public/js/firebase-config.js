// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBitGLWajCNnwkoeKWx_4Q_pS3hdSk1mNc",
    authDomain: "ezcrop-7c579.firebaseapp.com",
    databaseURL: "https://ezcrop-7c579-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ezcrop-7c579",
    storageBucket: "ezcrop-7c579.firebasestorage.app",
    messagingSenderId: "20995707043",
    appId: "1:20995707043:web:d0385c11d3ed2631fe6f16",
    measurementId: "G-3PK0CZKV5Z",
    
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
