import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyARiZYDRmAPutSoq8_oiMu1f77Dx3iSM',
  authDomain: 'aeternumintelligence.firebaseapp.com',
  projectId: 'aeternumintelligence',
  storageBucket: 'aeternumintelligence.appspot.com',
  messagingSenderId: '581680312893',
  appId: '1:581680312893:web:a7b8dfe93be5798fed2b8a',
  measurementId: 'G-NF5TESZ9B4',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
