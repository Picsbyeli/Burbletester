// ✅ Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5In_8cVRzcEWpOd7u16eQ0w_bJbz39io",
  authDomain: "evol-b02ac.firebaseapp.com",
  databaseURL: "https://evol-b02ac-default-rtdb.firebaseio.com",
  projectId: "evol-b02ac",
  storageBucket: "evol-b02ac.firebasestorage.app",
  messagingSenderId: "556948955579",
  appId: "1:556948955579:web:98d9b3c47e34682ff3649e",
  measurementId: "G-DC5956Y2G1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// Add YouTube scope for playlist access
provider.addScope('https://www.googleapis.com/auth/youtube.readonly');