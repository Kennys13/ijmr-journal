/**
 * IJMR SUPABASE AUTHENTICATION
 * Configuration for Project: xspbtzxgawwynybzfznv
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- YOUR SUPABASE CONFIGURATION ---
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

    monitorAuthState() {
        this.client.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                this.user = session.user;
                // Fetch extra details (Role, Name) from 'users' table
                await this.fetchUserProfile(this.user.id);
                console.log("Logged in:", this.user.email);
            } else {
                this.user = null;
                this.userProfile = null;
            }
            
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => this.updateUI(this.user));
            } else {
                this.updateUI(this.user);
            }
        });
    }

    async fetchUserProfile(userId) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) this.userProfile = data;
        if (error) console.error("Profile Error:", error.message);
    }

    async login(email, password, role) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Strict Role Check
        const { data: profile } = await this.client
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

        // If the role selected in dropdown doesn't match database role
        if (profile && role && !role.toLowerCase().includes(profile.role.toLowerCase()) && !profile.role.toLowerCase().includes(role.toLowerCase())) {
            await this.logout();
            throw new Error(`Access Denied. You are registered as a ${profile.role}.`);
        }

        return data.user;
    }

    async register(name, email, password, role, photoBase64) {
        // 1. Sign Up in Auth
        const { data, error } = await this.client.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: name } }
        });

        if (error) throw error;
        const user = data.user;

        // 2. Save Profile to 'users' table
        // Note: photoBase64 is ignored here to keep database light. 
        // In a real app, upload to Storage. We use UI Avatars fallback.
        const { error: dbError } = await this.client
            .from('users')
            .insert([{ 
                id: user.id, 
                full_name: name, 
                email: email, 
                role: role 
            }]);

        if (dbError) throw dbError;
        return user;
    }

    async logout() {
        await this.client.auth.signOut();
        window.location.href = 'login.html';
    }

    updateUI(user) {
        const nav = document.querySelector('nav');
        // Try to find the login link container or link itself
        let loginLink = document.querySelector('nav a[href="login.html"]');
        
        // Remove old profile button
        const oldBtn = document.getElementById('profile-btn');
        if (oldBtn) oldBtn.remove();

        if (user) {
            if(loginLink) loginLink.style.display = 'none';

            // Data Fallbacks
            const name = this.userProfile?.full_name || user.user_metadata?.full_name || user.email;
            const role = this.userProfile?.role || 'User';
            const initials = name.substring(0, 2).toUpperCase();
            const photoUrl = `https://ui-avatars.com/api/?name=${name}&background=00d2ff&color=fff`;

            // Create Profile Button
            const btn = document.createElement('div');
            btn.id = 'profile-btn';
            btn.style.cssText = `
                display: flex; align-items: center; gap: 10px; cursor: pointer; margin-left: auto;
            `;
            
            btn.innerHTML = `
                <div style="text-align:right; line-height:1.2;">
                    <div style="color:#e2e8f0; font-size:0.9rem; font-weight:bold;">${name}</div>
                    <div style="color:var(--primary); font-size:0.75rem;">${role}</div>
                </div>
                <div style="
                    width: 40px; height: 40px; border-radius: 50%;
                    background-image: url('${photoUrl}'); background-size: cover;
                    border: 2px solid var(--primary);
                "></div>
            `;

            btn.onclick = () => { if(confirm('Logout?')) this.logout(); };
            
            if(nav) nav.appendChild(btn);
        } else {
            if(loginLink) loginLink.style.display = 'block';
        }
    }
}

const Auth = new AuthService();
export default Auth;