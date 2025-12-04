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

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            // We don't need to pass 'role' manually anymore, we fetch it from DB in monitorAuthState
            return userCredential.user;
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
        let message = "Operation failed.";
        if (error.code === 'auth/wrong-password') message = "Incorrect password.";
        else if (error.code === 'auth/user-not-found') message = "No account found.";
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
                    <div style="color:white; font-size:0.9rem; font-weight:bold;">${user.displayName}</div>
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
```

### Key Changes Explained:

1.  **`getFirestore`, `doc`, `setDoc`**: These functions allow us to talk to the database.
2.  **`register` Function**: Now, after creating the account, it runs `setDoc`. This creates a folder in your database called `users`, finds the file named after the `user.uid`, and writes their Role, Name, and Photo into it.
3.  **`fetchUserProfile`**: When the website loads (`monitorAuthState`), it automatically asks the database: "Hey, give me the details for this User ID." It stores this in `this.userProfile`.
4.  **`updateUI`**: Now displays the **Role** fetched from the database, not just from LocalStorage.

### Step 3: Update `login.html` (Minor Change)

Since we are now fetching the role from the database automatically, you don't need to pass the `role` variable in the login function in your `login.html` script.

**Change this line in `login.html`:**
```javascript
// OLD
await Auth.login(email, password, role);

// NEW (Role is ignored during login, fetched from DB instead)
await Auth.login(email, password);