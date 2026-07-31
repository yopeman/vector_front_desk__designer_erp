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
                    <p class="text-sm text-slate-400 mt-1">Manage your profile, security, notifications, and appearance preferences.</p>
                </div>

                <!-- Settings Tabs Navigation -->
                <div class="bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/50 flex flex-wrap gap-1">
                    <button onclick="switchSettingsTab('profile')" id="settings-tab-profile" class="settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-blue-600 text-white shadow-md">My Profile</button>
                    <button onclick="switchSettingsTab('security')" id="settings-tab-security" class="settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-slate-800/80 text-slate-400 hover:text-slate-200">Security</button>
                    <button onclick="switchSettingsTab('notifications')" id="settings-tab-notifications" class="settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-slate-800/80 text-slate-400 hover:text-slate-200">Notifications</button>
                    <button onclick="switchSettingsTab('appearance')" id="settings-tab-appearance" class="settings-tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg transition-all bg-slate-800/80 text-slate-400 hover:text-slate-200">Appearance</button>
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
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Title</label>
                                <input type="text" id="settings-profile-title" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. Operations Manager">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                <input type="email" id="settings-profile-email" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="email@example.com">
                            </div>
                            <div>
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

                <!-- =============================== -->
                <!-- Notification Channels Section   -->
                <!-- =============================== -->
                <div id="settings-content-notifications" class="settings-content space-y-5 hidden">
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <div class="flex items-center gap-3 pb-4 border-b border-slate-700/60 mb-5">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                <i class="fa-solid fa-bell text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">Notification Channels</h3>
                                <p class="text-xs text-slate-400">Toggle which notification channels you want to receive</p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="flex items-center justify-between bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-emerald-500/30 transition-all">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                                        <i class="fa-solid fa-envelope text-emerald-400 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-white">Email Notifications</p>
                                        <p class="text-xs text-slate-400">Receive updates via email</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="settings-notif-email" class="sr-only peer" onchange="saveNotificationSettings()" checked>
                                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                                </label>
                            </div>

                            <div class="flex items-center justify-between bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/30 transition-all">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                                        <i class="fa-solid fa-mobile-screen-button text-blue-400 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-white">Push Notifications</p>
                                        <p class="text-xs text-slate-400">Receive instant push notifications</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="settings-notif-push" class="sr-only peer" onchange="saveNotificationSettings()" checked>
                                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                                </label>
                            </div>

                            <div class="flex items-center justify-between bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-all">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                                        <i class="fa-solid fa-message text-amber-400 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-white">SMS Notifications</p>
                                        <p class="text-xs text-slate-400">Receive updates via SMS text messages</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="settings-notif-sms" class="sr-only peer" onchange="saveNotificationSettings()">
                                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                                </label>
                            </div>

                            <div class="flex items-center justify-between bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                                        <i class="fa-solid fa-comment-dots text-purple-400 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-white">In-App Notifications</p>
                                        <p class="text-xs text-slate-400">Receive notifications within the application</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="settings-notif-inapp" class="sr-only peer" onchange="saveNotificationSettings()" checked>
                                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-purple-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- =============================== -->
                <!-- Appearance Section              -->
                <!-- =============================== -->
                <div id="settings-content-appearance" class="settings-content space-y-5 hidden">
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <div class="flex items-center gap-3 pb-4 border-b border-slate-700/60 mb-5">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                                <i class="fa-solid fa-palette text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">Theme & Text Size</h3>
                                <p class="text-xs text-slate-400">Customize the look and feel of the application</p>
                            </div>
                        </div>

                        <!-- Theme Selection -->
                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-slate-300 mb-3">Theme Mode</label>
                            <div class="grid grid-cols-3 gap-3">
                                <button onclick="setTheme('light')" id="settings-theme-light" class="theme-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700 bg-slate-900/60 hover:border-blue-500/50 transition-all">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center shadow-md">
                                        <i class="fa-solid fa-sun text-amber-600 text-lg"></i>
                                    </div>
                                    <span class="text-xs font-medium text-slate-300">Light</span>
                                </button>
                                <button onclick="setTheme('dark')" id="settings-theme-dark" class="theme-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-500 bg-blue-500/10 transition-all">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
                                        <i class="fa-solid fa-moon text-slate-300 text-lg"></i>
                                    </div>
                                    <span class="text-xs font-medium text-blue-400">Dark</span>
                                </button>
                                <button onclick="setTheme('system')" id="settings-theme-system" class="theme-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700 bg-slate-900/60 hover:border-blue-500/50 transition-all">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-md">
                                        <i class="fa-solid fa-desktop text-slate-400 text-lg"></i>
                                    </div>
                                    <span class="text-xs font-medium text-slate-300">System</span>
                                </button>
                            </div>
                        </div>

                        <!-- Text Size Selection -->
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-3">Text Size</label>
                            <div class="grid grid-cols-3 gap-3">
                                <button onclick="setTextSize('small')" id="textsize-small" class="textsize-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700 bg-slate-900/60 hover:border-blue-500/50 transition-all">
                                    <span class="text-xs text-slate-400 font-medium">A</span>
                                    <span class="text-[10px] text-slate-500">Small</span>
                                </button>
                                <button onclick="setTextSize('medium')" id="textsize-medium" class="textsize-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-500 bg-blue-500/10 transition-all">
                                    <span class="text-base text-blue-400 font-bold">A</span>
                                    <span class="text-xs text-blue-400">Medium</span>
                                </button>
                                <button onclick="setTextSize('large')" id="textsize-large" class="textsize-btn flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700 bg-slate-900/60 hover:border-blue-500/50 transition-all">
                                    <span class="text-xl text-slate-300 font-bold">A</span>
                                    <span class="text-xs text-slate-500">Large</span>
                                </button>
                            </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new SettingsSection();
});
