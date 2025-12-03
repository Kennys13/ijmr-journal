/**
 * IJMR FIREBASE AUTHENTICATION (CDN MODULES)
 * Optimized for Vercel / Static Hosting
 */

// 1. Import Firebase functions from Google's CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 2. Your Web App's Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC1NY2JKe69QcXSW68cD4la9wtW_j0iWk0",
    authDomain: "ijmr-journal.firebaseapp.com",
    projectId: "ijmr-journal",
    storageBucket: "ijmr-journal.firebasestorage.app",
    messagingSenderId: "695247068404",
    appId: "1:695247068404:web:b62030d0e9b8c0763c52a1",
    measurementId: "G-LLGEZ2EFPM"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 4. Auth Service Class
class AuthService {
    constructor() {
        this.user = null;
        this.monitorAuthState();
    }

    // Monitor Login Status
    monitorAuthState() {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            this.updateUI(user);
            if (user) {
                console.log("Secure Connection Established:", user.email);
            }
        });
    }

    // Login Method
    async login(email, password, role) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Store role locally for UI display (Firebase doesn't store 'role' by default on the user object)
            localStorage.setItem('ijmr_user_role', role);
            return userCredential.user;
        } catch (error) {
            console.error("Auth Error:", error.code);
            let msg = "Login failed.";
            if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (error.code === 'auth/too-many-requests') msg = "Access temporarily blocked due to many failed attempts.";
            throw new Error(msg);
        }
    }

    // Logout Method
    async logout() {
        try {
            await signOut(auth);
            localStorage.removeItem('ijmr_user_role');
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    // Update Navbar UI
    updateUI(user) {
        const loginLink = document.querySelector('nav a[href="login.html"]');
        const nav = document.querySelector('nav');
        const oldBadge = document.getElementById('user-badge');
        
        if (oldBadge) oldBadge.remove();

        if (user && loginLink) {
            // LOGGED IN
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.onclick = (e) => {
                e.preventDefault();
                if(confirm('Sign out?')) this.logout();
            };

            // Add Role Badge
            const role = localStorage.getItem('ijmr_user_role') || 'User';
            const badge = document.createElement('span');
            badge.id = 'user-badge';
            badge.innerHTML = `<i class="fas fa-user-circle"></i> ${role}`;
            badge.style.cssText = `
                color: var(--primary); font-size: 0.8rem; border: 1px solid var(--primary); 
                padding: 2px 10px; border-radius: 12px; margin-left: 10px; 
                display: inline-flex; align-items: center; gap: 5px;
            `;
            nav.insertBefore(badge, loginLink);

        } else if (loginLink) {
            // LOGGED OUT
            loginLink.textContent = 'Login';
            loginLink.href = 'login.html';
            loginLink.onclick = null;
        }
    }
}

// 5. Initialize and Expose to Window
const Auth = new AuthService();
window.Auth = Auth; // Essential: allows HTML inline scripts to use 'window.Auth.login()'