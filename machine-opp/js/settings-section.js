// settings Section Component
// Renders the settings section HTML

class SettingsSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-settings');
        if (container) {
            container.innerHTML = `<div>
                    <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <i class="fa-solid fa-gear text-slate-400"></i>
                        Settings
                    </h2>
                    <p class="text-sm text-slate-400 mt-1">Manage your profile and security settings.</p>
                </div>

                <!-- Settings Tabs Navigation -->
                <div class="bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/50 flex flex-wrap gap-1">
                    <button onclick="switchSettingsTab('profile')" id="settings-tab-profile" class="settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-blue-600 text-white shadow-md">My Profile</button>
                    <button onclick="switchSettingsTab('security')" id="settings-tab-security" class="settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-slate-800/80 text-slate-400 hover:text-slate-200">Security</button>
                </div>

                <!-- =============================== -->
                <!-- My Profile Section              -->
                <!-- =============================== -->
                <div id="settings-content-profile" class="settings-content space-y-5">
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <div class="flex items-center gap-3 pb-4 border-b border-slate-700/60 mb-5">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <i class="fa-solid fa-user text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">Edit Profile</h3>
                                <p class="text-xs text-slate-400">Update your personal information</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                <input type="text" id="settings-profile-name" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="Enter your full name">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                <input type="email" id="settings-profile-email" disabled class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" placeholder="email@example.com">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                                <input type="text" id="settings-profile-phone" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="+251 9XX XXX XXXX">
                            </div>
                        </div>

                        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
                            <button onclick="resetProfileForm()" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">Reset</button>
                            <button onclick="saveProfile()" class="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-blue-500/15 flex items-center gap-1.5">
                                <i class="fa-solid fa-floppy-disk text-[10px]"></i> Save Profile
                            </button>
                        </div>
                    </div>
                </div>

                <!-- =============================== -->
                <!-- Security Section                -->
                <!-- =============================== -->
                <div id="settings-content-security" class="settings-content space-y-5 hidden">
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <div class="flex items-center gap-3 pb-4 border-b border-slate-700/60 mb-5">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                                <i class="fa-solid fa-lock text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">Change Password</h3>
                                <p class="text-xs text-slate-400">Update your account password</p>
                            </div>
                        </div>

                        <div class="space-y-4 max-w-md">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                                <div class="relative">
                                    <input type="password" id="settings-current-password" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="Enter current password">
                                    <button onclick="togglePasswordVisibility('settings-current-password', this)" class="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                        <i class="fa-solid fa-eye text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                                <div class="relative">
                                    <input type="password" id="settings-new-password" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="Enter new password">
                                    <button onclick="togglePasswordVisibility('settings-new-password', this)" class="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                        <i class="fa-solid fa-eye text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                                <div class="relative">
                                    <input type="password" id="settings-confirm-password" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="Confirm new password">
                                    <button onclick="togglePasswordVisibility('settings-confirm-password', this)" class="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                        <i class="fa-solid fa-eye text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="settings-password-strength" class="hidden">
                                <div class="flex items-center justify-between text-xs mb-1">
                                    <span class="text-slate-400 font-medium">Password Strength</span>
                                    <span id="settings-password-strength-text" class="font-semibold"></span>
                                </div>
                                <div class="w-full bg-slate-900/60 rounded-full h-1.5 overflow-hidden">
                                    <div id="settings-password-strength-bar" class="h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
                            <button onclick="resetPasswordForm()" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">Reset</button>
                            <button onclick="updatePassword()" class="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 rounded-xl transition-all shadow-lg shadow-rose-500/15 flex items-center gap-1.5">
                                <i class="fa-solid fa-key text-[10px]"></i> Update Password
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
