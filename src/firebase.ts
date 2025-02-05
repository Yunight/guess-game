import { type FirebaseApp, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper function to securely retrieve environment variables
function getFirebaseEnvVar(key: string): string {
	const value = import.meta.env[key];
	if (!value || typeof value !== "string") {
		throw new Error(`Missing or invalid environment variable: ${key}`);
	}
	return value;
}

const firebaseConfig = {
	apiKey: getFirebaseEnvVar("VITE_FIREBASE_API_KEY"),
	authDomain: getFirebaseEnvVar("VITE_FIREBASE_AUTH_DOMAIN"),
	projectId: getFirebaseEnvVar("VITE_FIREBASE_PROJECT_ID"),
	storageBucket: getFirebaseEnvVar("VITE_FIREBASE_STORAGE_BUCKET"),
	messagingSenderId: getFirebaseEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
	appId: getFirebaseEnvVar("VITE_FIREBASE_APP_ID"),
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Initialize Firebase with error handling
let app: FirebaseApp;
try {
	app = initializeApp(firebaseConfig);
} catch (error: unknown) {
	console.error("Firebase initialization error:", error);
	throw error;
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
