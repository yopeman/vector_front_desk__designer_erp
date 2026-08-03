// =============================================
// AUTH OVERLAY MODULE
// Extracted from index.html for modular structure
// Styled to match LoginPage.jsx (teal theme)
// =============================================

(function() {
    const authOverlayHTML = `
    <!-- Auth Overlay (shown when not logged in) -->
    <div id="auth-overlay" class="auth-overlay hidden">
        <div class="auth-card">
            <!-- Teal Header Banner -->
            <div class="text-center mb-8 bg-[#00ced1] rounded-xl py-5 px-4">
                <div class="inline-flex items-center gap-2 mb-2">
                    <span class="text-3xl font-extrabold tracking-wider text-white uppercase">
                        V☰CTOR
                    </span>
                </div>
                <p class="text-[10px] text-white uppercase tracking-widest">
                    Advert & Manufacturing ERP
                </p>
            </div>

            <h2 class="text-lg font-bold text-gray-800 mb-1">Welcome back</h2>
            <p class="text-sm text-gray-400 mb-6">Sign in to your account to continue</p>

            <!-- Login Form -->
            <form id="auth-login-form">
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                            Email
                        </label>
                        <input type="email" id="auth-email" name="email" placeholder="Enter your email" required
                            class="auth-input">
                        <p class="auth-error" id="auth-email-error">Please enter a valid email address</p>
                    </div>
                    <div class="auth-field">
                        <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                            Password
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
                        </label>
                    </div>
                    <button type="submit" class="auth-btn">
                        <i class="fa-solid fa-right-to-bracket text-sm"></i>
                        Sign In
                    </button>
                </div>
            </form>

            <!-- Auth Footer -->
            <p class="text-center mt-6 text-[11px] text-gray-300">
                Internal use only &mdash; V☰CTOR ERP System
            </p>
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