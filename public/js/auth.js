import { auth, db } from './config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

class AuthService {
    constructor() {
        this.auth = auth;
        this.db = db;
    }

    async login(email, password, role) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            localStorage.setItem('ijmr_user_role', role);
            return userCredential.user;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async register(name, email, password, role) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });
            await setDoc(doc(this.db, "users", user.uid), {
                fullName: name,
                email: email,
                role: role,
                createdAt: new Date().toISOString()
            });
            
            return user;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateUserProfile(name, photoURL) {
        if (!this.auth.currentUser) throw new Error("No user logged in");
        try {
            await updateProfile(this.auth.currentUser, {
                displayName: name,
                photoURL: photoURL
            });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async logout() {
        await signOut(this.auth);
        localStorage.removeItem('ijmr_user_role');
        window.location.href = 'login.html';
    }

    handleError(error) {
        let message = error.message;
        if (error.code === 'auth/invalid-credential') message = "Invalid email or password.";
        if (error.code === 'auth/email-already-in-use') message = "Email already registered.";
        if (error.code === 'auth/weak-password') message = "Password too weak.";
        return new Error(message);
    }
}

const authService = new AuthService();
export default authService;