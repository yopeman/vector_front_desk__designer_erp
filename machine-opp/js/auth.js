// =============================================
// AUTHENTICATION SYSTEM
// =============================================
const Auth = (function() {
    const SESSION_KEY = 'vector_erp_session';
    const PROFILE_KEY = 'vector_erp_profile';

    function hashPassword(password) {
        let hash = 0;
        const salt = 'vector_erp_salt_2026';
        const combined = salt + password;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'vp_' + Math.abs(hash).toString(36) + '_' + btoa(password).substring(0, 8);
    }

    function getStoredUsers() {
        try {
            const data = localStorage.getItem('vector_erp_users');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem('vector_erp_users', JSON.stringify(users));
    }

    function createDefaultUser() {
        const users = getStoredUsers();
        if (users.length === 0) {
            users.push({
                id: 'u1',
                email: 'admin@vector.com',
                password: hashPassword('12345678'),
                name: 'Admin User',
                title: 'Operations Manager',
                role: 'admin',
                createdAt: new Date().toISOString()
            });
            saveUsers(users);
        }
    }

    function getSession() {
        try {
            const data = localStorage.getItem(SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function saveSession(session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    function isAuthenticated() {
        const session = getSession();
        if (!session || !session.userId) return false;
        const users = getStoredUsers();
        const user = users.find(u => u.id === session.userId);
        if (!user) {
            clearSession();
            return false;
        }
        if (session.expiresAt && Date.now() > session.expiresAt) {
            clearSession();
            return false;
        }
        return true;
    }

    function getCurrentUser() {
        const session = getSession();
        if (!session || !session.userId) return null;
        const users = getStoredUsers();
        return users.find(u => u.id === session.userId) || null;
    }

    function login(email, password) {
        const users = getStoredUsers();
        const hashed = hashPassword(password);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === hashed);
        if (!user) {
            return { success: false, error: 'Invalid email or password' };
        }
        const session = {
            userId: user.id,
            email: user.email,
            loginTime: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        };
        saveSession(session);
        return { success: true, user: { id: user.id, email: user.email, name: user.name, title: user.title, role: user.role } };
    }

    function logout() {
        clearSession();
    }

    function updateUserProfile(userId, updates) {
        const users = getStoredUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) return { success: false, error: 'User not found' };
        if (updates.name) users[index].name = updates.name;
        if (updates.title) users[index].title = updates.title;
        if (updates.email) users[index].email = updates.email.toLowerCase();
        saveUsers(users);
        return { success: true };
    }

    function changePassword(userId, currentPassword, newPassword) {
        const users = getStoredUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) return { success: false, error: 'User not found' };
        if (users[index].password !== hashPassword(currentPassword)) {
            return { success: false, error: 'Current password is incorrect' };
        }
        if (!newPassword || newPassword.length < 8) {
            return { success: false, error: 'New password must be at least 8 characters' };
        }
        users[index].password = hashPassword(newPassword);
        saveUsers(users);
        return { success: true };
    }

    function getProfile() {
        try {
            const data = localStorage.getItem(PROFILE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function saveProfile(profile) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }

    createDefaultUser();

    return {
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