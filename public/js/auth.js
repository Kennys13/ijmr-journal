/**
 * IJMR SUPABASE AUTHENTICATION & PROFILE MANAGER
 * Configuration for Project: xspbtzxgawwynybzfznv
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
        this.monitorAuthState();
    }

    // 1. Monitor & Protect Routes
    monitorAuthState() {
        this.client.auth.onAuthStateChange(async (event, session) => {
            const path = window.location.pathname;
            
            if (session?.user) {
                this.user = session.user;
                await this.fetchUserProfile(this.user.id);
                
                // If on login page but logged in, go home
                if (path.includes('login.html') || path.includes('register.html')) {
                    window.location.href = 'index.html';
                }
            } else {
                this.user = null;
                this.userProfile = null;

                // PROTECT PROFILE PAGE: Redirect if not logged in
                if (path.includes('profile.html')) {
                    window.location.href = 'login.html';
                }
            }
            
            // Update UI when DOM is ready
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => this.updateUI(this.user));
            } else {
                this.updateUI(this.user);
            }
        });
    }

    async fetchUserProfile(userId) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (data) this.userProfile = data;
        } catch (err) {
            console.error("Profile load error:", err);
        }
    }

    // 2. Login Logic
    async login(email, password, role) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Verify Role matches Database
        const { data: profile } = await this.client
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile && role) {
            const dbRole = (profile.role || "").toLowerCase();
            const selectedRole = role.toLowerCase();
            if (!selectedRole.includes(dbRole) && !dbRole.includes(selectedRole)) {
                await this.logout();
                throw new Error(`Access Denied. You are registered as a "${profile.role}".`);
            }
        }
        return data.user;
    }

    // 3. Upload Avatar (Max 500KB)
    async uploadAvatar(file) {
        if (!this.user) throw new Error("Not logged in");
        
        // Size Validation (500KB = 500 * 1024 bytes)
        if (file.size > 500 * 1024) {
            throw new Error("File size exceeds 500KB limit.");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${this.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to 'avatars' bucket
        const { error: uploadError } = await this.client.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = this.client.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    // 4. Update Profile Data
    async updateProfileData(name, photoURL) {
        if (!this.user) return;

        // Update Database
        const { error } = await this.client
            .from('users')
            .update({ full_name: name, avatar_url: photoURL })
            .eq('id', this.user.id);

        if (error) throw error;

        // Update Local State & UI immediately
        this.userProfile = { ...this.userProfile, full_name: name, avatar_url: photoURL };
        this.updateUI(this.user);
    }

    async logout() {
        await this.client.auth.signOut();
        window.location.href = 'login.html';
    }

    // 5. Navbar UI with Profile Dropdown
    updateUI(user) {
        const nav = document.querySelector('nav');
        // Find existing login link logic
        let loginLink = null;
        if(nav) {
            nav.querySelectorAll('a').forEach(link => {
                if(link.textContent.includes('Login')) loginLink = link;
            });
        }

        // Cleanup
        const oldProfile = document.getElementById('user-profile-widget');
        if (oldProfile) oldProfile.remove();

        if (user && nav) {
            if(loginLink) loginLink.style.display = 'none';

            // Data
            const name = this.userProfile?.full_name || user.email;
            const photo = this.userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${name}&background=00d2ff&color=fff`;

            // Create Profile Widget
            const container = document.createElement('div');
            container.id = 'user-profile-widget';
            container.style.cssText = `display: flex; align-items: center; gap: 12px; cursor: pointer; margin-left: auto; position: relative;`;
            
            container.innerHTML = `
                <div style="text-align:right; line-height:1.2; display: none; sm:display: block;">
                    <div style="color:white; font-size:0.9rem; font-weight:600;">${name}</div>
                    <div style="color:#2dd4bf; font-size:0.75rem;">Online</div>
                </div>
                <img src="${photo}" style="width:42px; height:42px; border-radius:50%; border:2px solid #2dd4bf; object-fit: cover;">
            `;

            // Click to go to Profile Settings
            container.onclick = () => {
                window.location.href = 'profile.html';
            };

            nav.appendChild(container);
        } else {
            if(loginLink) loginLink.style.display = 'block';
        }
    }
}

const Auth = new AuthService();
export default Auth;