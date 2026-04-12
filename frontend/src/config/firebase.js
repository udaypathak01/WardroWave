// src/config/firebase.js
// Firebase SDK configuration for WardroWave

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            "AIzaSyCgOBfDTfO13kQAnyQGXNeMg_OY1GpqRko",
  authDomain:        "wardrowave.firebaseapp.com",
  projectId:         "wardrowave",
  storageBucket:     "wardrowave.firebasestorage.app",
  messagingSenderId: "1092423491775",
  appId:             "1:1092423491775:web:6e60acd1a1fdcf1885e60a",
  measurementId:     "G-5MWLTNY8H4",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;

