// This file contains the configuration details for connecting to our Firebase project.

// Firebase project credentials, taken from the v7 prototype.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// A central list of our Universal Knowledge Base collections.
export const COLLECTIONS = ['perks', 'weapon_mastery', 'game_constants', 'status_effects', 'attribute_bonuses', 'builds', 'effects', 'abilities'];

