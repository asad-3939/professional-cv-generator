import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use custom firestoreDatabaseId if configured in the applet config file, otherwise fallback to standard default
const dbId = (firebaseConfig as any).firestoreDatabaseId || "(default)";
export const db = getFirestore(app, dbId);
