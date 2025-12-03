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
            
            // Wait for DOM to be ready before updating UI
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => this.updateUI(user));
            } else {
                this.updateUI(user);
            }
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
            } else if (error.code === 'auth/network-request-failed') {
                message = "Network error. Check your internet connection.";
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
        const nav = document.querySelector('nav');
        // Find login link
        let loginLink = document.querySelector('nav a[href="login.html"]');
        
        // Fallback search for login link
        if (!loginLink && nav) {
             const links = nav.querySelectorAll('a');
             for (const link of links) {
                 if (link.textContent.includes('Logout') || link.textContent.includes('Login')) {
                     loginLink = link;
                     break;
                 }
             }
        }

        // Cleanup old elements
        const oldProfileBtn = document.getElementById('profile-btn');
        if (oldProfileBtn) oldProfileBtn.remove();

        if (user && loginLink) {
            // --- LOGGED IN STATE ---
            
            // 1. Change "Login" to "Logout"
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.style.color = '#ff6b6b'; 
            loginLink.onclick = (e) => {
                e.preventDefault();
                if(confirm(`Sign out from ${user.email}?`)) this.logout();
            };

            // 2. Create Profile Button
            const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';
            // Use UI Avatars service as fallback
            const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=00d2ff&color=fff&size=128`;
            
            const profileBtn = document.createElement('a');
            profileBtn.id = 'profile-btn';
            profileBtn.href = '#'; 
            
            profileBtn.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                width: 38px;
                height: 38px;
                margin-left: 15px;
                margin-right: 5px;
                border-radius: 50%;
                border: 2px solid var(--primary);
                background-color: rgba(0, 210, 255, 0.1); 
                background-image: url('${photoURL}');
                background-size: cover;
                background-position: center;
                color: #fff;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.2s ease;
                box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
                text-decoration: none;
            `;
            
            // Inner text (hidden if image loads)
            profileBtn.innerHTML = `<span style="opacity:0">${initials}</span>`;

            profileBtn.onclick = (e) => {
                e.preventDefault();
                const role = localStorage.getItem('ijmr_user_role') || 'User';
                alert(`Profile: ${user.email}\nRole: ${role}`);
            };

            if(nav) nav.insertBefore(profileBtn, loginLink);

        } else if (loginLink) {
            // --- LOGGED OUT STATE ---
            loginLink.textContent = 'Login';
            loginLink.href = 'login.html';
            loginLink.style.color = ''; 
            loginLink.onclick = null;
        }
    }
}

// Initialize
const Auth = new AuthService();

// EXPORT IT (Crucial for the new login.html)
export default Auth;