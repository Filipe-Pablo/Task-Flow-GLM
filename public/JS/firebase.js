/* ============ TASKFLOW — FIREBASE CONFIG ============ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9uWffYJvE_ixKMLChjexTwHDgiLtdV-I",
  authDomain: "to-do-list-232fd.firebaseapp.com",
  projectId: "to-do-list-232fd",
  storageBucket: "to-do-list-232fd.firebasestorage.app",
  messagingSenderId: "831519152195",
  appId: "1:831519152195:web:2f2019a4d1cc9eeb315cf6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
window.__firebase = { app, db };
