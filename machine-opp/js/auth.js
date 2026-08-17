// =============================================
// AUTHENTICATION SYSTEM (Supabase Auth)
// =============================================
const Auth = (function() {
    let currentUser = null;
    let isAuthed = false;

    async function fetchCurrentUser(userId) {
        const { data, error } = await supabase
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
                title: '',
                role: data.role
            };
        }
    }

    async function getUserRole(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

        if (error || !data) return null;
        return data.role;
    }

    async function ensureDefaultUser() {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (existing && existing.length > 0) return;

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'admin@vector.com',
            password: '12345678'
        });

        if (authError || !authData.user) {
            console.error('Default user setup issue:', authError?.message || authError);
            return;
        }

        await supabase.from('users').insert({
            id: authData.user.id,
            username: 'admin',
            email: 'admin@vector.com',
            role: 'machine_operator'
        }).then(({ error }) => {
            if (error && !error.message.includes('duplicate')) {
                console.error('Failed to insert default user profile:', error);
            }
        });
    }

    async function init() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const role = await getUserRole(session.user.id);
            if (role === 'machine_operator' || role === 'finish') {
                isAuthed = true;
                await fetchCurrentUser(session.user.id);
            } else {
                await supabase.auth.signOut();
            }
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const role = await getUserRole(session.user.id);
                if (role === 'machine_operator' || role === 'finish') {
                    isAuthed = true;
                    await fetchCurrentUser(session.user.id);
                } else {
                    isAuthed = false;
                    currentUser = null;
                    await supabase.auth.signOut();
                }
            } else {
                isAuthed = false;
                currentUser = null;
            }
        });

        await ensureDefaultUser();

        if (!isAuthed) {
            const { data: { session: postSession } } = await supabase.auth.getSession();
            if (postSession?.user) {
                const role = await getUserRole(postSession.user.id);
                if (role === 'machine_operator' || role === 'finish') {
                    isAuthed = true;
                    await fetchCurrentUser(postSession.user.id);
                } else {
                    await supabase.auth.signOut();
                }
            }
        }
    }

    async function login(email, password) {
        // Check location first
        const locationResult = await LocationCheck.checkLocation();
        if (!locationResult.success) {
            return { success: false, error: locationResult.error || 'Location check failed' };
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Login failed' };
        }

        const role = await getUserRole(user.id);
        if (role !== 'machine_operator' && role !== 'finish') {
            await supabase.auth.signOut();
            return { success: false, error: 'Access denied. Machine operator role required.' };
        }

        await fetchCurrentUser(user.id);

        return {
            success: true,
            user: currentUser ? Object.assign({}, currentUser) : { email }
        };
    }

    async function logout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        isAuthed = false;
        currentUser = null;
    }

    async function updateUserProfile(userId, updates) {
        const dbUpdates = {};
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.name !== undefined) dbUpdates.username = updates.name;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

        const { error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        if (currentUser && currentUser.id === userId) {
            Object.assign(currentUser, updates);
        }

        return { success: true };
    }

    async function changePassword(userId, currentPassword, newPassword) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    function isAuthenticated() {
        return isAuthed;
    }

    function getCurrentUser() {
        return currentUser ? Object.assign({}, currentUser) : null;
    }

    function getProfile() {
        try {
            const data = localStorage.getItem('vector_erp_profile');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function saveProfile(profile) {
        localStorage.setItem('vector_erp_profile', JSON.stringify(profile));
    }

    const initPromise = init();

    return {
        initPromise,
        isAuthenticated,
        getCurrentUser,
        login,
        logout,
        updateUserProfile,
        changePassword,
        getProfile,
        saveProfile
    };
})();
