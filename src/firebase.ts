import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

  apiKey: "AIzaSyAsW-4kVd13ZW_ty-Jr34HC65t4l3edgPU",

  authDomain: "whoisthispokemon-1f13f.firebaseapp.com",

  projectId: "whoisthispokemon-1f13f",

  storageBucket: "whoisthispokemon-1f13f.firebasestorage.app",

  messagingSenderId: "841384576640",

  appId: "1:841384576640:web:de6231db2f172000b4c865",

  measurementId: "G-6Q6WDYZBRV"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
