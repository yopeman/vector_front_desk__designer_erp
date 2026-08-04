// =============================================
// SETTINGS MODULE - MARKETING ERP
// =============================================

// Global state
const MarketingSettings = {
    currentUserId: null
};

// =============================================
// SETTINGS TAB SWITCHING
// =============================================
function switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-content').forEach(el => el.classList.add('hidden'));
    const targetContent = document.getElementById(`settings-content-${tabId}`);
    if (targetContent) targetContent.classList.remove('hidden');

    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.className = 'settings-tab-btn';
    });
    const targetTab = document.getElementById(`settings-tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// =============================================
// INITIALIZE SETTINGS
// =============================================
async function initSettings() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error('No authenticated user found');
            return;
        }
        MarketingSettings.currentUserId = user.id;
        await loadProfile();
        loadNotificationSettings();
        loadAppearanceSettings();
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

// =============================================
// PROFILE MANAGEMENT
// =============================================
async function loadProfile() {
    try {
        if (!MarketingSettings.currentUserId) {
            console.warn('No current user ID available');
            return;
        }

        const { data, error } = await window.supabase
            .from('users')
            .select('id, username, email, phone')
            .eq('id', MarketingSettings.currentUserId)
            .single();

        if (error) {
            if (error.code === '42P01') {
                console.warn('Users table does not exist yet');
                return;
            }
            throw error;
        }

        if (data) {
            document.getElementById('settings-profile-name').value = escapeHtml(data.username) || '';
            document.getElementById('settings-profile-email').value = escapeHtml(data.email) || '';
            document.getElementById('settings-profile-phone').value = escapeHtml(data.phone) || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function saveProfile() {
    const username = document.getElementById('settings-profile-name').value.trim();
    const email = document.getElementById('settings-profile-email').value.trim();
    const phone = document.getElementById('settings-profile-phone').value.trim();

    if (!username) {
        alert('Please enter your username.');
        return;
    }

    try {
        const { error } = await window.supabase
            .from('users')
            .update({
                username: username,
                email: email,
                phone: phone,
                updated_at: new Date().toISOString(),
            })
            .eq('id', MarketingSettings.currentUserId);

        if (error) throw error;

        alert('Profile saved successfully!');
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile: ' + error.message);
    }
}

function resetProfileForm() {
    loadProfile();
}

// =============================================
// PASSWORD MANAGEMENT
// =============================================
async function updatePassword() {
    const currentPwd = document.getElementById('settings-current-password').value;
    const newPwd = document.getElementById('settings-new-password').value;
    const confirmPwd = document.getElementById('settings-confirm-password').value;

    if (!currentPwd) {
        alert('Please enter your current password.');
        return;
    }

    if (newPwd !== confirmPwd) {
        alert('New password and confirm password do not match.');
        return;
    }

    if (newPwd.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }

    try {
        // Verify current password by attempting to sign in
        const { data: { user } } = await window.supabase.auth.getUser();
        const { error: signInError } = await window.supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPwd,
        });

        if (signInError) {
            alert('Current password is incorrect');
            return;
        }

        // Current password is correct, now update to new password
        const { error } = await window.supabase.auth.updateUser({
            password: newPwd,
        });

        if (error) throw error;

        document.getElementById('settings-current-password').value = '';
        document.getElementById('settings-new-password').value = '';
        document.getElementById('settings-confirm-password').value = '';
        document.getElementById('settings-password-strength').classList.add('hidden');

        alert('Password updated successfully!');
    } catch (error) {
        console.error('Error updating password:', error);
        alert('Error updating password: ' + error.message);
    }
}

function resetPasswordForm() {
    document.getElementById('settings-current-password').value = '';
    document.getElementById('settings-new-password').value = '';
    document.getElementById('settings-confirm-password').value = '';
    document.getElementById('settings-password-strength').classList.add('hidden');
}

// =============================================
// PASSWORD STRENGTH CHECKER
// =============================================
function checkPasswordStrength(password) {
    const strengthEl = document.getElementById('settings-password-strength');
    const barEl = document.getElementById('settings-password-strength-bar');
    const textEl = document.getElementById('settings-password-strength-text');

    if (!password) {
        strengthEl.classList.add('hidden');
        return;
    }

    strengthEl.classList.remove('hidden');
    let score = 0;

    if (password.length >= 6) score += 20;
    if (password.length >= 10) score += 10;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;

    barEl.style.width = score + '%';

    if (score < 30) {
        barEl.className = 'password-strength-bar weak';
        textEl.textContent = 'Weak';
        textEl.className = 'password-strength-text weak';
    } else if (score < 60) {
        barEl.className = 'password-strength-bar medium';
        textEl.textContent = 'Medium';
        textEl.className = 'password-strength-text medium';
    } else if (score < 80) {
        barEl.className = 'password-strength-bar strong';
        textEl.textContent = 'Strong';
        textEl.className = 'password-strength-text strong';
    } else {
        barEl.className = 'password-strength-bar very-strong';
        textEl.textContent = 'Very Strong';
        textEl.className = 'password-strength-text very-strong';
    }
}

// =============================================
// NOTIFICATION CHANNELS (localStorage)
// =============================================

// Load notification settings
function loadNotificationSettings() {
    const saved = localStorage.getItem('marketing_notification_channels');
    if (saved) {
        try {
            const channels = JSON.parse(saved);
            document.getElementById('settings-notif-email').checked = channels.email !== false;
            document.getElementById('settings-notif-push').checked = channels.push !== false;
            document.getElementById('settings-notif-sms').checked = channels.sms === true;
            document.getElementById('settings-notif-inapp').checked = channels.inapp !== false;
        } catch(e) {}
    }
}

// Save notification settings
function saveNotificationSettings() {
    const channels = {
        email: document.getElementById('settings-notif-email').checked,
        push: document.getElementById('settings-notif-push').checked,
        sms: document.getElementById('settings-notif-sms').checked,
        inapp: document.getElementById('settings-notif-inapp').checked
    };
    localStorage.setItem('marketing_notification_channels', JSON.stringify(channels));
}

// =============================================
// APPEARANCE (localStorage)
// =============================================

// Set theme
function setTheme(theme) {
    localStorage.setItem('marketing_theme', theme);

    // Update button styles
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`settings-theme-${theme}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Apply theme to body
    if (theme === 'light') {
        document.body.classList.add('theme-light');
        document.body.classList.remove('theme-dark');
    } else if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
    } else {
        document.body.classList.remove('theme-light', 'theme-dark');
    }
}

// Set text size
function setTextSize(size) {
    localStorage.setItem('marketing_text_size', size);

    // Update button styles
    document.querySelectorAll('.textsize-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`textsize-${size}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Apply text size to body
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (size === 'small') {
        root.style.fontSize = '14px';
    } else if (size === 'medium') {
        root.style.fontSize = '16px';
    } else if (size === 'large') {
        root.style.fontSize = '18px';
    }
}

// Load appearance settings
function loadAppearanceSettings() {
    const theme = localStorage.getItem('marketing_theme') || 'dark';
    setTheme(theme);

    const textSize = localStorage.getItem('marketing_text_size') || 'medium';
    setTextSize(textSize);
}

// =============================================
// INITIALIZATION ON DOM LOAD
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    // Password strength checker
    const newPwdInput = document.getElementById('settings-new-password');
    if (newPwdInput) {
        newPwdInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
});

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose functions to global scope for onclick handlers
window.switchSettingsTab = switchSettingsTab;
window.loadProfile = loadProfile;
window.saveProfile = saveProfile;
window.resetProfileForm = resetProfileForm;
window.updatePassword = updatePassword;
window.checkPasswordStrength = checkPasswordStrength;
window.loadNotificationSettings = loadNotificationSettings;
window.saveNotificationSettings = saveNotificationSettings;
window.setTheme = setTheme;
window.setTextSize = setTextSize;
window.loadAppearanceSettings = loadAppearanceSettings;
// togglePasswordVisibility is defined in settings-section.js
