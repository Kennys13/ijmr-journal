/**
 * IJMR MOCK BACKEND SERVICE
 * Simulates server-side authentication and session management.
 */

class AuthService {
    constructor() {
        this.STORAGE_KEY = 'ijmr_auth_user';
        
        // Mock Database of Users
        this.users = [
            { 
                email: 'author@ijmr.org', 
                password: 'password', 
                role: 'Author', 
                name: 'Dr. Jane Doe',
                id: 'USR_001'
            },
            { 
                email: 'reviewer@ijmr.org', 
                password: 'password', 
                role: 'Reviewer', 
                name: 'Prof. Alan Smith',
                id: 'USR_002'
            },
            { 
                email: 'editor@ijmr.org', 
                password: 'password', 
                role: 'Editor', 
                name: 'Chief Editor',
                id: 'USR_003'
            },
            { 
                email: 'admin@ijmr.org', 
                password: 'admin', 
                role: 'Admin', 
                name: 'System Admin',
                id: 'ADM_001'
            }
        ];
    }

    /**
     * Simulates an API Login call
     * @param {string} email 
     * @param {string} password 
     * @param {string} role 
     * @returns {Promise<Object>} User object or Error
     */
    async login(email, password, role) {
        return new Promise((resolve, reject) => {
            console.log(`[Backend] Attempting login for ${email}...`);
            
            // Simulate network delay (1.5 seconds)
            setTimeout(() => {
                const user = this.users.find(u => u.email === email);

                if (!user) {
                    reject({ message: "User not found. Please register first." });
                    return;
                }

                if (user.password !== password) {
                    reject({ message: "Incorrect password." });
                    return;
                }

                // Simple role check (in a real app, role is assigned to user, not selected by them)
                // Here we just allow it if the user exists, but warn if role mismatch
                if (!user.role.includes(role.split(' ')[0])) { 
                     // e.g. "Author" matches "Author / Researcher"
                     // This is lenient for the demo
                }

                // Success: Create session
                this._createSession(user);
                resolve(user);
            }, 1500);
        });
    }

    /**
     * Log out the current user
     */
    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.href = 'login.html';
    }

    /**
     * Get currently logged in user
     * @returns {Object|null}
     */
    getCurrentUser() {
        const userStr = localStorage.getItem(this.STORAGE_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Internal: Save user to localStorage
     */
    _createSession(user) {
        // Exclude password from session storage for security (even in mock)
        const { password, ...safeUser } = user;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeUser));
    }

    /**
     * Update UI based on auth state (Auto-run on pages)
     */
    initUI() {
        const user = this.getCurrentUser();
        const loginLink = document.querySelector('nav a[href="login.html"]');
        
        if (user && loginLink) {
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if(confirm(`Sign out from ${user.email}?`)) {
                    this.logout();
                }
            });
            
            // Optional: Add profile icon
            const nav = document.querySelector('nav');
            if(nav && !document.getElementById('user-badge')) {
                const badge = document.createElement('span');
                badge.id = 'user-badge';
                badge.innerHTML = `<i class="fas fa-user-circle"></i> ${user.role}`;
                badge.style.cssText = "color:var(--primary); font-size:0.8rem; border:1px solid var(--primary); padding:2px 8px; border-radius:12px; margin-left:10px; display:inline-block;";
                nav.appendChild(badge);
            }
        }
    }
}

// Export a global instance
const Auth = new AuthService();

// Auto-initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.initUI();
});