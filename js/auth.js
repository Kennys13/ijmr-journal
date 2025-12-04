/**
 * IJMR FIREBASE SERVICE (AUTH + DATABASE)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- NEW: Import Firestore Functions ---
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

        this.app = initializeApp(this.firebaseConfig);
        this.analytics = getAnalytics(this.app);
        this.auth = getAuth(this.app);
        
        // --- NEW: Initialize Database ---
        this.db = getFirestore(this.app);
        
        this.user = null;
        this.userProfile = null; // Store extra DB data here (role, etc)

        this.monitorAuthState();
    }

    monitorAuthState() {
        onAuthStateChanged(this.auth, async (user) => {
            this.user = user;
            if (user) {
                // If logged in, fetch their profile from Database
                await this.fetchUserProfile(user.uid);
            } else {
                this.userProfile = null;
            }
            
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => this.updateUI(user));
            } else {
                this.updateUI(user);
            }
        });
    }

    // --- NEW: Helper to fetch data from Firestore ---
    async fetchUserProfile(uid) {
        try {
            const docRef = doc(this.db, "users", uid); // Look in 'users' collection
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.userProfile = docSnap.data(); // Save DB data to memory
                console.log("Database Data Loaded:", this.userProfile);
            } else {
                console.log("No such document!");
                this.userProfile = null;
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }

    /**
     * Register User & Save to Database
     */
    async register(name, email, password, role, photoBase64) {
        try {
            // 1. Create Authentication Account
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // 2. Update Auth Profile
            await updateProfile(user, { displayName: name });

            // 3. --- NEW: Save Extended Data to Firestore Database ---
            // We create a document inside the "users" collection with the same ID as the Auth UID
            await setDoc(doc(this.db, "users", user.uid), {
                fullName: name,
                email: email,
                role: role,
                joinedDate: new Date().toISOString(),
                // Note: Saving Base64 to DB is okay for small icons, 
                // but usually better to use Firebase Storage. Keeping it simple here.
                profilePhoto: photoBase64 || null 
            });

            return user;
        } catch (error) {
            console.error("Registration Error:", error.code);
            throw this.handleError(error);
        }
    }

    /**
     * Login with Role Verification
     */
    async login(email, password, selectedRole) {
        try {
            // 1. Authenticate with Firebase Auth (Email/Pass check)
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // 2. Verify Role from Database
            // We must verify the user is actually the role they claim to be in the dropdown
            const docRef = doc(this.db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await signOut(this.auth); // Logout immediately if no profile
                throw new Error("User profile not found. Please register.");
            }

            const dbData = docSnap.data();
            const registeredRole = dbData.role || "User";

            // Normalize strings for comparison (Handle "Author" matching "Author / Researcher")
            // We check if the Selected Role string *contains* the Registered Role word, or vice versa
            const normSelected = selectedRole.toLowerCase();
            const normRegistered = registeredRole.toLowerCase();

            // Logic: If I registered as "Author", I can login as "Author / Researcher".
            // If I registered as "Reviewer", I CANNOT login as "Editor".
            const isMatch = normSelected.includes(normRegistered) || normRegistered.includes(normSelected);

            if (!isMatch) {
                await signOut(this.auth); // Deny access
                throw new Error(`Access Denied: You are registered as a "${registeredRole}", not a "${selectedRole}".`);
            }

            return user;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    handleError(error) {
        let message = error.message || "Operation failed.";
        
        // Map standard Firebase errors
        if (error.code === 'auth/wrong-password') message = "Incorrect password.";
        else if (error.code === 'auth/user-not-found') message = "No account found.";
        else if (error.code === 'auth/invalid-credential') message = "Invalid email or password.";
        
        return new Error(message);
    }

    updateUI(user) {
        const nav = document.querySelector('nav');
        let loginLink = document.querySelector('nav a[href="login.html"]');
        const oldProfileBtn = document.getElementById('profile-btn');
        if (oldProfileBtn) oldProfileBtn.remove();

        if (user) {
            if(loginLink) loginLink.style.display = 'none';

            // Get Data from DB (if loaded) or fallback to Auth default
            const dbPhoto = this.userProfile?.profilePhoto;
            const dbRole = this.userProfile?.role || 'User'; // Get Role from DB!
            
            const initials = (user.displayName || user.email || 'U').substring(0, 2).toUpperCase();
            const photoURL = dbPhoto || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=00d2ff&color=fff`;
            
            const profileBtn = document.createElement('div');
            profileBtn.id = 'profile-btn';
            profileBtn.style.cssText = `display: flex; align-items: center; gap: 10px; cursor: pointer;`;

            profileBtn.innerHTML = `
                <div style="text-align:right; line-height:1.2;">
                    <div style="color:white; font-size:0.9rem; font-weight:bold;">${user.displayName || user.email}</div>
                    <div style="color:var(--primary); font-size:0.75rem;">${dbRole}</div>
                </div>
                <div style="
                    width: 40px; height: 40px; border-radius: 50%; 
                    background-image: url('${photoURL}'); background-size: cover; background-position: center;
                    border: 2px solid var(--primary); box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
                "></div>
            `;
            
            profileBtn.onclick = (e) => {
                if(confirm(`Sign out?`)) this.logout();
            };

            if(nav) nav.appendChild(profileBtn);
        } else {
            if(loginLink) loginLink.style.display = 'inline-block';
        }
    }
}

const Auth = new AuthService();
export default Auth;