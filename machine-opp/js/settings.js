// =============================================
// SETTINGS MODULE - REAL SUPABASE INTEGRATION
// =============================================

// Global state (currentUserId is declared in mock-data.js)

// =============================================
// SETTINGS TAB SWITCHING
// =============================================
function switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-content').forEach(el => el.classList.add('hidden'));
    const targetContent = document.getElementById(`settings-content-${tabId}`);
    if (targetContent) targetContent.classList.remove('hidden');

    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.className = 'settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-slate-800/80 text-slate-400 hover:text-slate-200';
    });
    const targetTab = document.getElementById(`settings-tab-${tabId}`);
    if (targetTab) {
        targetTab.className = 'settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-blue-600 text-white shadow-md';
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
        currentUserId = user.id;
        await loadProfile();
        loadAppearanceSettings();
        loadNotificationSettings();
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

// =============================================
// PROFILE MANAGEMENT
// =============================================
async function loadProfile() {
    try {
        const { data, error } = await window.supabase
            .from('users')
            .select('id, username, email, phone')
            .eq('id', currentUserId)
            .single();

        if (error) throw error;

        if (data) {
            document.getElementById('settings-profile-name').value = data.username || '';
            document.getElementById('settings-profile-email').value = data.email || '';
            document.getElementById('settings-profile-phone').value = data.phone || '';
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
            .eq('id', currentUserId);

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
        barEl.className = 'h-full rounded-full transition-all duration-500 bg-rose-500';
        textEl.textContent = 'Weak';
        textEl.className = 'font-semibold text-rose-400';
    } else if (score < 60) {
        barEl.className = 'h-full rounded-full transition-all duration-500 bg-amber-500';
        textEl.textContent = 'Medium';
        textEl.className = 'font-semibold text-amber-400';
    } else if (score < 80) {
        barEl.className = 'h-full rounded-full transition-all duration-500 bg-blue-500';
        textEl.textContent = 'Strong';
        textEl.className = 'font-semibold text-blue-400';
    } else {
        barEl.className = 'h-full rounded-full transition-all duration-500 bg-emerald-500';
        textEl.textContent = 'Very Strong';
        textEl.className = 'font-semibold text-emerald-400';
    }
}

// =============================================
// NOTIFICATION CHANNELS (localStorage)
// =============================================

// Load notification settings
function loadNotificationSettings() {
    const saved = localStorage.getItem('erp_notification_channels');
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
    localStorage.setItem('erp_notification_channels', JSON.stringify(channels));
}

// =============================================
// APPEARANCE (localStorage)
// =============================================

// Set theme
function setTheme(theme) {
    localStorage.setItem('erp_theme', theme);

    // Update button styles
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.className = 'theme-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700 bg-slate-900/60 hover:border-blue-500/50 transition-all';
    });
    const activeBtn = document.getElementById(`settings-theme-${theme}`);
    if (activeBtn) {
        activeBtn.className = 'theme-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-500 bg-blue-500/10 transition-all';
        const span = activeBtn.querySelector('span:last-child');
        if (span) span.className = 'text-xs font-medium text-blue-400';
    }

    // Apply theme to body
    if (theme === 'light') {
        // Light theme implementation can be added here
    } else if (theme === 'dark') {
        document.body.className = document.body.className.replace(/bg-white/g, 'bg-slate-900').replace(/text-slate-900/g, 'text-slate-100');
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light', 'theme-system');
    } else {
        document.body.classList.add('theme-system');
        document.body.classList.remove('theme-light', 'theme-dark');
    }
}

// Set text size
function setTextSize(size) {
    localStorage.setItem('erp_text_size', size);

    // Update button styles
    document.querySelectorAll('.textsize-btn').forEach(btn => {
        btn.className = 'textsize-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700 bg-slate-900/60 hover:border-blue-500/50 transition-all';
    });
    const activeBtn = document.getElementById(`textsize-${size}`);
    if (activeBtn) {
        activeBtn.className = 'textsize-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-500 bg-blue-500/10 transition-all';
        const spans = activeBtn.querySelectorAll('span');
        if (spans.length > 1) spans[1].className = 'text-xs text-blue-400';
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
    const theme = localStorage.getItem('erp_theme') || 'dark';
    setTheme(theme);

    const textSize = localStorage.getItem('erp_text_size') || 'medium';
    setTextSize(textSize);
}

// =============================================
// MODULE DROPDOWN (FOR REPORTS)
// =============================================
function toggleModuleDropdown() {
    const dropdown = document.getElementById('report-module-options');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function updateModuleSelection() {
    const checkboxes = document.querySelectorAll('.module-checkbox');
    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    const textEl = document.getElementById('report-module-selected-text');
    if (selected.length === 0) {
        textEl.textContent = 'No Modules';
    } else if (selected.length === 8) {
        textEl.textContent = 'All Modules';
    } else {
        const labels = {
            'received-orders': 'Received Orders',
            'completed-orders': 'Completed Orders',
            'rework': 'Rework Records',
            'store-request': 'Store Requests'
        };
        textEl.textContent = selected.map(m => labels[m] || m).join(', ');
    }
    const optionsEl = document.getElementById('report-module-options');
    if (optionsEl) optionsEl.classList.add('hidden');
    if (typeof filterReports === 'function') {
        filterReports();
    }
}

function getSelectedModules() {
    return Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
}

// Close module dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('report-module-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        const options = document.getElementById('report-module-options');
        if (options) options.classList.add('hidden');
    }
});

// =============================================
// INITIALIZATION ON DOM LOAD
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings when DOM is loaded
    initSettings();

    // Password strength checker
    const newPwdInput = document.getElementById('settings-new-password');
    if (newPwdInput) {
        newPwdInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }

    // Note color buttons
    const noteColorButtons = document.querySelectorAll('.note-color-btn');
    if (noteColorButtons.length > 0) {
        noteColorButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                selectedNoteColor = this.getAttribute('data-color');
                noteColorButtons.forEach(b => b.classList.remove('ring-2', 'ring-white'));
                this.classList.add('ring-2', 'ring-white');
            });
        });
    }

    // Note checklist input Enter key
    const noteChecklistInput = document.getElementById('note-checklist-input');
    if (noteChecklistInput) {
        noteChecklistInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addChecklistItemFromModal();
            }
        });
    }
});