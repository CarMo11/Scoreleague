// Authentication UI Components for ScoreLeague
// Handles login/register modals and user interface

class AuthUI {
    constructor() {
        this.authService = window.authService;
        this.init();
    }

    init() {
        this.createAuthModals();
        this.setupEventListeners();
        this.checkAuthState();
    }

    // Create login and register modals
    createAuthModals() {
        const authHTML = `
            <!-- Login Modal -->
            <div id="login-modal" class="modal auth-modal">
                <div class="modal-content auth-modal-content">
                    <div class="auth-header">
                        <h3>🏆 Welcome to ScoreLeague</h3>
                        <button id="close-login-btn" class="close-btn">✕</button>
                    </div>
                    <div class="auth-form">
                        <div class="auth-tabs">
                            <button id="login-tab" class="auth-tab active">Login</button>
                            <button id="register-tab" class="auth-tab">Register</button>
                        </div>
                        
                        <!-- Login Form -->
                        <div id="login-form" class="auth-form-content active">
                            <div class="form-group">
                                <label for="login-email">Email</label>
                                <input type="email" id="login-email" placeholder="Enter your email" required>
                            </div>
                            <div class="form-group">
                                <label for="login-password">Password</label>
                                <input type="password" id="login-password" placeholder="Enter your password" required>
                            </div>
                            <button id="login-submit" class="auth-submit-btn">Login</button>
                            <div id="login-error" class="auth-error"></div>
                        </div>
                        
                        <!-- Register Form -->
                        <div id="register-form" class="auth-form-content">
                            <div class="form-group">
                                <label for="register-username">Username</label>
                                <input type="text" id="register-username" placeholder="Choose a username" required>
                            </div>
                            <div class="form-group">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" placeholder="Enter your email" required>
                            </div>
                            <div class="form-group">
                                <label for="register-password">Password</label>
                                <input type="password" id="register-password" placeholder="Create a password" required>
                            </div>
                            <div class="form-group">
                                <label for="register-confirm">Confirm Password</label>
                                <input type="password" id="register-confirm" placeholder="Confirm your password" required>
                            </div>
                            <button id="register-submit" class="auth-submit-btn">Create Account</button>
                            <div id="register-error" class="auth-error"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Auth Gate (shown when not logged in) -->
            <div id="auth-gate" class="auth-gate">
                <div class="auth-gate-content">
                    <div class="auth-gate-header">
                        <h1>🏆 ScoreLeague</h1>
                        <p>Free-to-Play Sports Betting</p>
                    </div>
                    <div class="auth-gate-features">
                        <div class="feature">
                            <span class="feature-icon">⚽</span>
                            <span>Live matches from top leagues</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🎯</span>
                            <span>Skill-based betting with virtual coins</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🏅</span>
                            <span>Compete on global leaderboards</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">📊</span>
                            <span>Track your betting statistics</span>
                        </div>
                    </div>
                    <div class="auth-gate-actions">
                        <button id="show-login-btn" class="auth-gate-btn primary">Login</button>
                        <button id="show-register-btn" class="auth-gate-btn secondary">Create Account</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', authHTML);
    }

    // Setup event listeners for auth UI
    setupEventListeners() {
        // Modal controls
        document.getElementById('close-login-btn').addEventListener('click', () => this.hideAuthModal());
        document.getElementById('show-login-btn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('show-register-btn').addEventListener('click', () => this.showAuthModal('register'));

        // Tab switching
        document.getElementById('login-tab').addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('register-tab').addEventListener('click', () => this.switchAuthTab('register'));

        // Form submissions
        document.getElementById('login-submit').addEventListener('click', (e) => this.handleLogin(e));
        document.getElementById('register-submit').addEventListener('click', (e) => this.handleRegister(e));

        // Enter key submissions
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin(e);
        });
        document.getElementById('register-confirm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister(e);
        });

        // Add logout button to header
        this.addLogoutButton();
    }

    // Check authentication state on load
    async checkAuthState() {
        await this.authService.init();
        const { isAuthenticated } = this.authService.getCurrentUser();
        
        if (isAuthenticated) {
            this.showApp();
            this.updateUserDisplay();
        } else {
            this.showAuthGate();
        }
    }

    // Show/hide auth gate
    showAuthGate() {
        document.getElementById('auth-gate').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }

    showApp() {
        document.getElementById('auth-gate').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }

    // Show auth modal
    showAuthModal(tab = 'login') {
        document.getElementById('login-modal').style.display = 'flex';
        this.switchAuthTab(tab);
    }

    hideAuthModal() {
        document.getElementById('login-modal').style.display = 'none';
        this.clearAuthErrors();
    }

    // Switch between login/register tabs
    switchAuthTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');

        // Update form content
        document.querySelectorAll('.auth-form-content').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');

        this.clearAuthErrors();
    }

    // Handle login
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showAuthError('login', 'Please fill in all fields');
            return;
        }

        this.setAuthLoading('login', true);
        
        const result = await this.authService.signIn(email, password);
        
        if (result.success) {
            this.hideAuthModal();
            this.showApp();
            this.updateUserDisplay();
        } else {
            this.showAuthError('login', result.error);
        }
        
        this.setAuthLoading('login', false);
    }

    // Handle registration
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        // Validation
        if (!username || !email || !password || !confirmPassword) {
            this.showAuthError('register', 'Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            this.showAuthError('register', 'Username must be at least 3 characters');
            return;
        }

        if (password.length < 6) {
            this.showAuthError('register', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showAuthError('register', 'Passwords do not match');
            return;
        }

        this.setAuthLoading('register', true);
        
        const result = await this.authService.signUp(email, password, username);
        
        if (result.success) {
            this.showAuthError('register', 'Account created! Please check your email to verify your account.', 'success');
            // Switch to login tab after successful registration
            setTimeout(() => {
                this.switchAuthTab('login');
                document.getElementById('login-email').value = email;
            }, 2000);
        } else {
            this.showAuthError('register', result.error);
        }
        
        this.setAuthLoading('register', false);
    }

    // Show auth errors/success messages
    showAuthError(form, message, type = 'error') {
        const errorElement = document.getElementById(`${form}-error`);
        errorElement.textContent = message;
        errorElement.className = `auth-error ${type}`;
        errorElement.style.display = 'block';
    }

    clearAuthErrors() {
        document.querySelectorAll('.auth-error').forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    }

    // Set loading state for auth buttons
    setAuthLoading(form, loading) {
        const button = document.getElementById(`${form}-submit`);
        if (loading) {
            button.disabled = true;
            button.textContent = 'Loading...';
        } else {
            button.disabled = false;
            button.textContent = form === 'login' ? 'Login' : 'Create Account';
        }
    }

    // Update user display in header
    updateUserDisplay() {
        const { profile } = this.authService.getCurrentUser();
        if (profile) {
            document.getElementById('username').textContent = profile.username;
            document.getElementById('coin-amount').textContent = profile.coins;
        }
    }

    // Add logout button to header
    addLogoutButton() {
        const userInfo = document.querySelector('.user-info');
        if (userInfo && !document.getElementById('logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logout-btn';
            logoutBtn.className = 'logout-btn';
            logoutBtn.textContent = '🚪';
            logoutBtn.title = 'Logout';
            logoutBtn.addEventListener('click', () => this.handleLogout());
            userInfo.appendChild(logoutBtn);
        }
    }

    // Handle logout
    async handleLogout() {
        const result = await this.authService.signOut();
        if (result.success) {
            this.showAuthGate();
            // Reset app state
            window.location.reload();
        }
    }
}

// Initialize auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authUI = new AuthUI();
});
