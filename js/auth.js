/**
 * IJMR FIREBASE AUTHENTICATION
 * Configuration for ijmr-journal
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

class AuthService {
    constructor() {
        // --- YOUR CONFIGURATION ---
        this.firebaseConfig = {
            apiKey: "AIzaSyC1NY2JKe69QcXSW68cD4la9wtW_j0iWk0",
            authDomain: "ijmr-journal.firebaseapp.com",
            projectId: "ijmr-journal",
            storageBucket: "ijmr-journal.firebasestorage.app",
            messagingSenderId: "695247068404",
            appId: "1:695247068404:web:b62030d0e9b8c0763c52a1",
            measurementId: "G-LLGEZ2EFPM"
        };
        // --------------------------

        // Initialize Firebase
        this.app = initializeApp(this.firebaseConfig);
        this.analytics = getAnalytics(this.app);
        this.auth = getAuth(this.app);
        
        this.user = null;

        // Start listening for auth changes immediately
        this.monitorAuthState();
    }

    /**
     * Real-time listener: Runs whenever user logs in or out
     */
    monitorAuthState() {
        onAuthStateChanged(this.auth, (user) => {
            this.user = user;
            this.updateUI(user);
        });
    }

    /**
     * Login Function
     */
    async login(email, password, role) {
        try {
            // 1. Authenticate with Firebase
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            
            // 2. Store the role locally for UI purposes
            localStorage.setItem('ijmr_user_role', role);

            return userCredential.user;
        } catch (error) {
            console.error("Login Error:", error.code);
            let message = "Login failed. Please check your credentials.";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                message = "Invalid email or password.";
            } else if (error.code === 'auth/too-many-requests') {
                message = "Too many attempts. Please wait a moment.";
            }
            throw new Error(message);
        }
    }

    /**
     * Logout Function
     */
    async logout() {
        try {
            await signOut(this.auth);
            localStorage.removeItem('ijmr_user_role');
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    /**
     * Updates the Navbar based on login state
     */
    updateUI(user) {
        const loginLink = document.querySelector('nav a[href="login.html"]');
        const nav = document.querySelector('nav');
        
        // Cleanup old elements
        const oldProfileBtn = document.getElementById('profile-btn');
        if (oldProfileBtn) oldProfileBtn.remove();

        if (user && loginLink) {
            // --- LOGGED IN STATE ---
            
            // 1. Change "Login" to "Logout"
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.style.color = '#ff6b6b'; // Make logout reddish
            loginLink.onclick = (e) => {
                e.preventDefault();
                if(confirm(`Sign out from ${user.email}?`)) this.logout();
            };

            // 2. Create Profile Button
            const role = localStorage.getItem('ijmr_user_role') || 'User';
            const profileBtn = document.createElement('a');
            profileBtn.id = 'profile-btn';
            profileBtn.href = '#profile'; // Placeholder link
            profileBtn.className = 'profile-btn';
            
            // Inline Styles for Glassmorphism Button
            profileBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-left: 10px;
                margin-right: 10px;
                padding: 8px 16px;
                background: rgba(0, 210, 255, 0.1);
                border: 1px solid var(--primary);
                border-radius: 30px;
                color: #fff;
                font-size: 0.9rem;
                text-decoration: none;
                transition: all 0.3s ease;
                cursor: pointer;
            `;

            profileBtn.innerHTML = `
                <i class="fas fa-user-circle" style="font-size: 1.1em;"></i>
                <span>${role}</span>
            `;

            // Hover effects
            profileBtn.onmouseover = () => {
                profileBtn.style.background = 'var(--primary)';
                profileBtn.style.color = '#000';
            };
            profileBtn.onmouseout = () => {
                profileBtn.style.background = 'rgba(0, 210, 255, 0.1)';
                profileBtn.style.color = '#fff';
            };
            
            profileBtn.onclick = (e) => {
                e.preventDefault();
                alert("Profile Dashboard Coming Soon!");
            };

            // Insert Profile Button BEFORE the Logout link
            nav.insertBefore(profileBtn, loginLink);

        } else if (loginLink) {
            // --- LOGGED OUT STATE ---
            loginLink.textContent = 'Login';
            loginLink.href = 'login.html';
            loginLink.style.color = ''; // Reset color
            loginLink.onclick = null;
        }
    }
}

// Initialize and attach to window
const Auth = new AuthService();
window.Auth = Auth;