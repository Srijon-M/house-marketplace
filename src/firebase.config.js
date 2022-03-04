import { getFirestore } from 'firebase/firestore'
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAXiJVolszDCW6IhUuJ9_njb38mbMiAPSE",
  authDomain: "house-marketplace-app-b1139.firebaseapp.com",
  projectId: "house-marketplace-app-b1139",
  storageBucket: "house-marketplace-app-b1139.appspot.com",
  messagingSenderId: "325588157042",
  appId: "1:325588157042:web:b754c8da601db78efef8eb"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const db = getFirestore()