import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// This should be populated with your actual Firebase project credentials.
const firebaseConfig = {
    apiKey: "AIzaSyArlZ2RyYDBAPufSoq8_oiWUlf77Ox3i5M",
  authDomain: "aeternumintelligence.firebaseapp.com",
  projectId: "aeternumintelligence",
  storageBucket: "aeternumintelligence.firebasestorage.app",
  messagingSenderId: "581686312895",
  appId: "1:581686312895:web:710b0fe93be5790fed2b0a",
  measurementId: "G-NF5TESZ9B4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the single, authoritative db instance for the entire application
export { db };