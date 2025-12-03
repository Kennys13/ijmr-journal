/**
 * IJMR FIREBASE AUTHENTICATION
 * Configuration for ijmr-journal
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, // Added for Registration
    updateProfile,                  // Added for Profile Updates
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
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            localStorage.setItem('ijmr_user_role', role); // Store role locally
            return userCredential.user;
        } catch (error) {
            console.error("Login Error:", error.code);
            throw this.handleError(error);
        }
    }

    /**
     * Register Function (Create New Account)
     */
    async register(name, email, password, role) {
        try {
            // 1. Create User in Firebase
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // 2. Update Profile with Name
            await updateProfile(user, {
                displayName: name
                // photoURL: "default_url" // Optional
            });

            // 3. Store Role
            localStorage.setItem('ijmr_user_role', role);

            return user;
        } catch (error) {
            console.error("Registration Error:", error.code);
            throw this.handleError(error);
        }
    }

    /**
     * Update Profile Data
     */
    async updateUserProfile(name, photoURL) {
        if (!this.auth.currentUser) throw new Error("No user logged in.");
        
        try {
            await updateProfile(this.auth.currentUser, {
                displayName: name,
                photoURL: photoURL
            });
            // Force UI update
            this.updateUI(this.auth.currentUser);
        } catch (error) {
            console.error("Update Error:", error);
            throw new Error("Failed to update profile.");
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
     * Helper to format error messages
     */
    handleError(error) {
        let message = "Operation failed.";
        if (error.code === 'auth/wrong-password') message = "Incorrect password.";
        else if (error.code === 'auth/user-not-found') message = "No account found with this email.";
        else if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
        else if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
        else if (error.code === 'auth/invalid-email') message = "Invalid email format.";
        return new Error(message);
    }

    /**
     * Updates the Navbar based on login state
     */
    updateUI(user) {
        const nav = document.querySelector('nav');
        // Find login link
        let loginLink = document.querySelector('nav a[href="login.html"]');
        
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

            // 2. Create Circular Profile Button
            const initials = (user.displayName || user.email || 'U').substring(0, 2).toUpperCase();
            // Use UI Avatars service if no photoURL is set
            const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=00d2ff&color=fff&size=128`;
            
            const profileBtn = document.createElement('a');
            profileBtn.id = 'profile-btn';
            // LINK TO THE NEW PROFILE PAGE
            profileBtn.href = 'profile.html'; 
            
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

            // Hover effects
            profileBtn.onmouseover = () => { profileBtn.style.transform = 'scale(1.1)'; };
            profileBtn.onmouseout = () => { profileBtn.style.transform = 'scale(1)'; };

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

// Export
export default Auth;