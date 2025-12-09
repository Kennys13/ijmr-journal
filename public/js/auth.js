/**
 * IJMR AUTHENTICATION & PROFILE MANAGER (v2.0)
 * Handles detailed profiles, role-based access, and secure routing.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://xspbtzxgawwynybzfznv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcGJ0enhnYXd3eW55Ynpmem52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzA0MzcsImV4cCI6MjA4MDc0NjQzN30.0Htpq1U2B8EhpgeyEwRr6FByEEUF58h_PTo7twYQN7k';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AuthService {
    constructor() {
        this.client = supabase;
        this.user = null;
        this.userProfile = null;
        
        // Initial UI State: Hide Profile, Show Login
        this.updateUI(null); 
        this.monitorAuthState();
    }

    monitorAuthState() {
        this.client.auth.onAuthStateChange(async (event, session) => {
            const path = window.location.pathname;
            
            if (session?.user) {
                this.user = session.user;
                await this.fetchUserProfile(this.user.id);
                
                // Redirect from public auth pages if logged in
                if (path.includes('login.html') || path.includes('register.html')) {
                    window.location.href = 'index.html';
                }
            } else {
                this.user = null;
                this.userProfile = null;

                // Protect Private Routes
                if (path.includes('profile.html') || path.includes('submit.html')) {
                    window.location.href = 'login.html';
                }
            }
            this.updateUI(this.user);
        });
    }

    async fetchUserProfile(userId) {
        try {
            const { data } = await this.client
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (data) this.userProfile = data;
        } catch (err) {
            console.error("Profile Error:", err);
        }
    }

    // --- LOGIN ---
    async login(email, password, role) {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Role Verification
        const { data: profile } = await this.client
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

        // Allow fuzzy matching (e.g., "Author" matches "Author / Researcher")
        if (profile && role) {
            const dbRole = (profile.role || "").toLowerCase();
            const selectedRole = role.toLowerCase();
            
            if (!selectedRole.includes(dbRole) && !dbRole.includes(selectedRole)) {
                await this.logout();
                throw new Error(`Role Mismatch: You are registered as '${profile.role}'.`);
            }
        }
        return data.user;
    }

    // --- COMPLEX REGISTRATION ---
    async register(details) {
        // 1. Create Auth User
        const { data, error } = await this.client.auth.signUp({
            email: details.email,
            password: details.password,
            options: { data: { full_name: details.full_name } }
        });

        if (error) throw error;
        const user = data.user;
        if (!user) throw new Error("Registration failed.");

        // 2. Prepare Database Record (Remove password)
        delete details.password;
        details.id = user.id; // Link to Auth ID
        
        // Default Avatar
        details.avatar_url = `https://ui-avatars.com/api/?name=${details.full_name}&background=00d2ff&color=fff`;

        // 3. Insert into 'users' table
        const { error: dbError } = await this.client
            .from('users')
            .insert([details]);

        if (dbError) {
            // Rollback auth if DB fails (advanced) or just warn
            console.error("DB Error:", dbError);
            throw new Error("Account created but profile save failed. Please contact support.");
        }

        return user;
    }

    // --- PROFILE UPDATE ---
    async updateProfileData(userId, updates) {
        const { error } = await this.client
            .from('users')
            .update(updates)
            .eq('id', userId);
        
        if (error) throw error;
        
        // Refresh local state
        this.userProfile = { ...this.userProfile, ...updates };
        this.updateUI(this.user);
    }

    // --- FILE UPLOAD ---
    async uploadAvatar(file) {
        if (file.size > 500 * 1024) throw new Error("File exceeds 500KB limit.");
        
        const fileName = `${this.user.id}-${Date.now()}`;
        const { error } = await this.client.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data } = this.client.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
    }

    async logout() {
        await this.client.auth.signOut();
        window.location.href = 'login.html';
    }

    // --- UI MANAGEMENT ---
    updateUI(user) {
        const nav = document.querySelector('nav');
        let loginBtn = document.getElementById('nav-login-btn');
        let profileWidget = document.getElementById('user-profile-widget');

        // Create elements if missing (Logic ensures they exist before toggling)
        if (!loginBtn && nav) {
            loginBtn = document.createElement('a');
            loginBtn.id = 'nav-login-btn';
            loginBtn.href = 'login.html';
            loginBtn.textContent = 'Login';
            loginBtn.style.cssText = "margin-left: auto; font-weight: 600; color: white;";
            nav.appendChild(loginBtn);
        }

        if (user) {
            // LOGGED IN: Show Profile, Hide Login
            if (loginBtn) loginBtn.style.display = 'none';

            if (!profileWidget && nav) {
                profileWidget = document.createElement('div');
                profileWidget.id = 'user-profile-widget';
                nav.appendChild(profileWidget);
            }

            const name = this.userProfile?.full_name || user.email;
            const photo = this.userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${name}`;

            profileWidget.style.cssText = `display: flex; align-items: center; gap: 10px; cursor: pointer; margin-left: auto;`;
            profileWidget.innerHTML = `
                <div style="text-align:right; line-height:1.2;">
                    <div style="color:white; font-size:0.9rem; font-weight:600;">${name}</div>
                    <div style="color:#2dd4bf; font-size:0.75rem;">${this.userProfile?.role || 'Member'}</div>
                </div>
                <img src="${photo}" style="width:40px; height:40px; border-radius:50%; border:2px solid #2dd4bf; object-fit: cover;">
            `;
            profileWidget.onclick = () => window.location.href = 'profile.html';

        } else {
            // LOGGED OUT: Show Login, Remove Profile
            if (loginBtn) loginBtn.style.display = 'block';
            if (profileWidget) profileWidget.remove();
        }
    }
}

const Auth = new AuthService();
export default Auth;