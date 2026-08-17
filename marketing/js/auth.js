// =============================================
// AUTHENTICATION SYSTEM (Marketing ERP)
// Uses Supabase Auth + users table (marketer/admin_marketer roles)
// =============================================
const MarketingAuth = (function() {
    let currentUser = null;
    let isAuthed = false;

    async function fetchCurrentUser(userId) {
        const { data, error } = await window.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user profile:', error);
            return;
        }

        if (data) {
            currentUser = {
                id: data.id,
                email: data.email,
                name: data.username || '',
                role: data.role
            };
        }
    }

    async function getUserRole(userId) {
        const { data, error } = await window.supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

        if (error || !data) return null;
        return data.role;
    }

    // Auto-create a users row if the signed-in auth user has no profile yet.
    // New marketing users default to 'marketer'; promote to 'admin_marketer' manually.
    async function ensureUserProfile(user) {
        const { data: existing } = await window.supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (existing) return;

        const email = user.email || 'unknown@email.com';
        const username = email.split('@')[0];

        const { error } = await window.supabase
            .from('users')
            .insert({
                id: user.id,
                username: username,
                email: email,
                role: 'marketer'
            });

        if (error) {
            console.error('Failed to auto-create user profile:', error);
        }
    }

    function isMarketingRole(role) {
        return role === 'marketer' || role === 'admin_marketer' || role === 'admin';
    }

    async function init() {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session?.user) {
            await ensureUserProfile(session.user);
            const role = await getUserRole(session.user.id);
            if (isMarketingRole(role)) {
                isAuthed = true;
                await fetchCurrentUser(session.user.id);
            } else {
                await window.supabase.auth.signOut();
            }
        }

        window.supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const role = await getUserRole(session.user.id);
                if (isMarketingRole(role)) {
                    isAuthed = true;
                    await fetchCurrentUser(session.user.id);
                } else {
                    isAuthed = false;
                    currentUser = null;
                    await window.supabase.auth.signOut();
                }
            } else {
                isAuthed = false;
                currentUser = null;
            }
            updateAuthUI();
        });

        updateAuthUI();
    }

    async function login(email, password) {
        // Check location first
        const locationResult = await LocationCheck.checkLocation();
        if (!locationResult.success) {
            return { success: false, error: locationResult.error || 'Location check failed' };
        }

        const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        const user = data?.user;
        if (!user) {
            return { success: false, error: 'Login failed' };
        }

        // Auto-create a users row if this auth user has no profile yet
        await ensureUserProfile(user);

        const role = await getUserRole(user.id);
        if (!isMarketingRole(role)) {
            await window.supabase.auth.signOut();
            return { success: false, error: 'Access denied. Marketing role required.' };
        }

        await fetchCurrentUser(user.id);
        isAuthed = true;
        updateAuthUI();

        return {
            success: true,
            user: currentUser ? Object.assign({}, currentUser) : { email }
        };
    }

    async function logout() {
        const { error } = await window.supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        isAuthed = false;
        currentUser = null;
        updateAuthUI();
    }

    function updateAuthUI() {
        const overlay = document.getElementById('auth-overlay');
        if (!overlay) return;

        overlay.classList.toggle('hidden', isAuthed);
    }

    function isAuthenticated() {
        return isAuthed;
    }

    function getCurrentUser() {
        return currentUser ? Object.assign({}, currentUser) : null;
    }

    const initPromise = init();

    return {
        initPromise,
        isAuthenticated,
        getCurrentUser,
        login,
        logout,
        updateAuthUI
    };
})();

// =============================================
// AUTH OVERLAY HANDLERS (called by auth-overlay.js)
// =============================================

async function handleAuthLogin(event) {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-login-error');

    // Clear previous errors
    errorEl.style.display = 'none';
    document.getElementById('auth-email').classList.remove('error');
    document.getElementById('auth-password').classList.remove('error');

    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('auth-email').classList.add('error');
        document.getElementById('auth-email-error').style.display = 'block';
        return;
    }
    if (password.length < 8) {
        document.getElementById('auth-password').classList.add('error');
        document.getElementById('auth-password-error').style.display = 'block';
        return;
    }

    const result = await MarketingAuth.login(email, password);
    if (!result.success) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    // Success - overlay hides via updateAuthUI()
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
}

function toggleAuthPassword() {
    const input = document.getElementById('auth-password');
    const icon = document.getElementById('auth-toggle-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash text-sm';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye text-sm';
    }
}