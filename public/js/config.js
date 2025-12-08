import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC1NY2JKe69QcXSW68cD4la9wtW_j0iWk0",
    authDomain: "ijmr-journal.firebaseapp.com",
    projectId: "ijmr-journal",
    storageBucket: "ijmr-journal.firebasestorage.app",
    messagingSenderId: "695247068404",
    appId: "1:695247068404:web:b62030d0e9b8c0763c52a1",
    measurementId: "G-LLGEZ2EFPM"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };