// settings Section Component
// Renders the settings section HTML

class SettingsSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('settings-section-container');
        if (container) {
            container.innerHTML = `<div>
                    <h2 class="section-title">
                        <i class="fa-solid fa-gear"></i>
                        Settings
                    </h2>
                    <p class="section-subtitle">Manage your profile and security settings.</p>
                </div>

                <!-- Settings Tabs Navigation -->
                <div class="settings-tabs">
                    <button onclick="switchSettingsTab('profile')" id="settings-tab-profile" class="settings-tab-btn active">My Profile</button>
                    <button onclick="switchSettingsTab('security')" id="settings-tab-security" class="settings-tab-btn">Security</button>
                </div>

                <!-- My Profile Section -->
                <div id="settings-content-profile" class="settings-content">
                    <div class="settings-card">
                        <div class="card-header">
                            <div class="card-icon profile-icon">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div class="card-title-group">
                                <h3>Edit Profile</h3>
                                <p>Update your personal information</p>
                            </div>
                        </div>

                        <div class="form-grid">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" id="settings-profile-name" class="form-input" placeholder="Enter your full name">
                            </div>
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" id="settings-profile-email" class="form-input" placeholder="email@example.com">
                            </div>
                            <div class="form-group full-width">
                                <label>Phone Number</label>
                                <input type="text" id="settings-profile-phone" class="form-input" placeholder="+251 9XX XXX XXXX">
                            </div>
                        </div>

                        <div class="form-actions">
                            <button onclick="resetProfileForm()" class="btn-secondary">Reset</button>
                            <button onclick="saveProfile()" class="btn-primary">
                                <i class="fa-solid fa-floppy-disk"></i> Save Profile
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Security Section -->
                <div id="settings-content-security" class="settings-content hidden">
                    <div class="settings-card">
                        <div class="card-header">
                            <div class="card-icon security-icon">
                                <i class="fa-solid fa-lock"></i>
                            </div>
                            <div class="card-title-group">
                                <h3>Change Password</h3>
                                <p>Update your account password</p>
                            </div>
                        </div>

                        <div class="form-vertical">
                            <div class="form-group">
                                <label>Current Password</label>
                                <div class="input-with-icon">
                                    <input type="password" id="settings-current-password" class="form-input" placeholder="Enter current password">
                                    <button onclick="togglePasswordVisibility('settings-current-password', this)" class="password-toggle">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>New Password</label>
                                <div class="input-with-icon">
                                    <input type="password" id="settings-new-password" class="form-input" placeholder="Enter new password">
                                    <button onclick="togglePasswordVisibility('settings-new-password', this)" class="password-toggle">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Confirm New Password</label>
                                <div class="input-with-icon">
                                    <input type="password" id="settings-confirm-password" class="form-input" placeholder="Confirm new password">
                                    <button onclick="togglePasswordVisibility('settings-confirm-password', this)" class="password-toggle">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="settings-password-strength" class="password-strength hidden">
                                <div class="strength-label">
                                    <span>Password Strength</span>
                                    <span id="settings-password-strength-text"></span>
                                </div>
                                <div class="strength-bar-bg">
                                    <div id="settings-password-strength-bar" class="password-strength-bar" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button onclick="resetPasswordForm()" class="btn-secondary">Reset</button>
                            <button onclick="updatePassword()" class="btn-danger">
                                <i class="fa-solid fa-key"></i> Update Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new SettingsSection();
});

// Helper function to toggle password visibility
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}
