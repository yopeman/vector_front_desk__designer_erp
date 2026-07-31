// =============================================
// AUTH OVERLAY MODULE
// Extracted from index.html for modular structure
// =============================================

(function() {
    const authOverlayHTML = `
    <!-- Auth Overlay (shown when not logged in) -->
    <div id="auth-overlay" class="auth-overlay hidden">
        <div class="auth-card">
            <!-- Login Form -->
            <form id="auth-login-form">
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            <i class="fa-solid fa-envelope mr-1.5 text-slate-500"></i>Email Address
                        </label>
                        <input type="email" id="auth-email" name="email" placeholder="you@example.com" required
                            class="auth-input">
                        <p class="auth-error" id="auth-email-error">Please enter a valid email address</p>
                    </div>
                    <div class="auth-field">
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            <i class="fa-solid fa-lock mr-1.5 text-slate-500"></i>Password
                        </label>
                        <input type="password" id="auth-password" name="password" placeholder="Enter your password" required
                            minlength="8" class="auth-input pr-10">
                        <button type="button" id="auth-toggle-password-btn" class="auth-toggle-password">
                            <i class="fa-solid fa-eye text-sm" id="auth-toggle-icon"></i>
                        </button>
                        <p class="auth-error" id="auth-password-error">Password must be at least 8 characters</p>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="auth-remember" hidden checked class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20 focus:outline-none accent-blue-500">
                            <!-- <span class="text-xs text-slate-400">Remember me</span> -->
                        </label>
                    </div>
                    <button type="submit" class="auth-btn">
                        <i class="fa-solid fa-right-to-bracket text-sm"></i>
                        Sign In
                    </button>
                </div>
            </form>

            <!-- Auth Footer -->
            <div class="mt-6 pt-5 border-t border-slate-700/40 text-center">
                <p class="text-xs text-slate-500">
                    <i class="fa-solid fa-shield-halved mr-1 text-slate-600"></i>
                    Secure authentication &middot; Credentials saved locally
                </p>
            </div>
        </div>
    </div>
    `;

    async function injectAuthOverlay() {
        // Inject the auth overlay HTML at the beginning of the body
        document.body.insertAdjacentHTML('afterbegin', authOverlayHTML);

        // Set up event listeners (replacing inline handlers)
        const loginForm = document.getElementById('auth-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                if (typeof handleAuthLogin === 'function') {
                    await handleAuthLogin(event);
                }
            });
        }

        const toggleBtn = document.getElementById('auth-toggle-password-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                if (typeof toggleAuthPassword === 'function') {
                    toggleAuthPassword();
                }
            });
        }
    }

    // Inject on DOMContentLoaded (runs before other init code since this script loads first)
    document.addEventListener('DOMContentLoaded', injectAuthOverlay);
})();