// This file contains the configuration for the Firebase SDK.
// Its sole responsibility is to initialize the connection to the Firestore database
// and export the database instance for use throughout the application.
// This adheres to the "One Tool, One Job" architectural principle.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration, carried over from the v7.0 blueprint.
// CORRECTED: The apiKey and appId have been fixed to match the blueprint.
const firebaseConfig = {
  apiKey: "AIzaSyARiZYDRmAPutSoq8_oiMu1f77Dx3iSM",
  authDomain: "aeternumintelligence.firebaseapp.com",
  projectId: "aeternumintelligence",
  storageBucket: "aeternumintelligence.appspot.com",
  messagingSenderId: "581680312893",
  appId: "1:581680312893:web:a7b8dfe93be5798fed2b8a",
  measurementId: "G-NF5TESZ9B4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the database instance so we can use it in other parts of the engine.
export { db };

