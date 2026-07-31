// Top Navigation Bar Component
// Handles the main navigation, dropdowns, and user interactions

class TopNavigationBar {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.notifications = [];
        this.messages = [];
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.checkAuthState();
    }

    render() {
        const header = document.createElement('header');
        header.className = 'glass-heavy border-b border-slate-700/40 sticky top-0 z-50 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xl shadow-black/10 gap-3';
        header.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <i class="fa-solid fa-industry text-lg text-white relative z-10"></i>
                </div>
                <div class="hidden sm:block">
                    <h1 class="text-base font-bold tracking-tight text-white flex items-center gap-2">
                        ERP System
                    </h1>
                    <p class="text-[10px] text-slate-400 font-medium">Machine Operation Management</p>
                </div>
            </div>

            <div class="flex items-center gap-1.5">
                <!-- Notification Bell -->
                <div class="relative" id="notif-dropdown-container">
                    <button onclick="topNav.toggleNotifDropdown()" id="notif-bell-btn" class="relative p-2 rounded-xl hover:bg-slate-700/40 transition-colors group" aria-label="Notifications">
                        <i class="fa-solid fa-bell text-slate-400 group-hover:text-white transition-colors text-sm"></i>
                        <span id="notif-badge" class="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center hidden">0</span>
                    </button>
                    <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
                            <h3 class="text-sm font-semibold text-white">Notifications</h3>
                            <button onclick="topNav.markAllNotifRead()" class="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors">Mark all read</button>
                        </div>
                        <div id="notif-dropdown-list" class="max-h-72 overflow-y-auto">
                            <div class="p-4 text-center text-slate-400 text-xs">No notifications</div>
                        </div>
                        <div class="px-4 py-2 border-t border-slate-700/40">
                            <button onclick="switchTab('notifications')" class="w-full text-center text-[11px] text-blue-400 hover:text-blue-300 font-medium py-1 transition-colors">Show all notifications</button>
                        </div>
                    </div>
                </div>

                <!-- Message Icon -->
                <div class="relative" id="msg-dropdown-container">
                    <button onclick="topNav.toggleMsgDropdown()" id="msg-bell-btn" class="relative p-2 rounded-xl hover:bg-slate-700/40 transition-colors group" aria-label="Messages">
                        <i class="fa-solid fa-envelope text-slate-400 group-hover:text-white transition-colors text-sm"></i>
                        <span id="msg-badge" class="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center hidden">0</span>
                    </button>
                    <div id="msg-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
                            <h3 class="text-sm font-semibold text-white">Messages</h3>
                            <button onclick="topNav.markAllMsgRead()" class="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors">Mark all read</button>
                        </div>
                        <div id="msg-dropdown-list" class="max-h-72 overflow-y-auto">
                            <div class="p-4 text-center text-slate-400 text-xs">No messages</div>
                        </div>
                        <div class="px-4 py-2 border-t border-slate-700/40">
                            <button onclick="switchTab('messages')" class="w-full text-center text-[11px] text-blue-400 hover:text-blue-300 font-medium py-1 transition-colors">Show all messages</button>
                        </div>
                    </div>
                </div>

                <div class="w-px h-6 bg-slate-700/50 mx-1"></div>

                <!-- User Info & Logout -->
                <div class="flex items-center gap-2.5">
                    <div id="user-info-badge" class="user-info-badge hidden items-center gap-2">
                        <div class="user-avatar-sm" id="topbar-avatar">AD</div>
                        <span id="topbar-username" class="text-xs font-medium text-slate-300 hidden lg:inline">Admin User</span>
                    </div>
                    <button id="logout-btn" class="logout-btn hidden px-2.5 py-1.5 text-[11px] font-semibold bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5" onclick="topNav.handleLogout()">
                        <i class="fa-solid fa-right-from-bracket text-[10px]"></i>
                        <span class="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        `;

        document.body.prepend(header);
    }

    attachEventListeners() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const notifContainer = document.getElementById('notif-dropdown-container');
            const msgContainer = document.getElementById('msg-dropdown-container');
            
            if (notifContainer && !notifContainer.contains(e.target)) {
                this.closeNotifDropdown();
            }
            if (msgContainer && !msgContainer.contains(e.target)) {
                this.closeMsgDropdown();
            }
        });
    }

    checkAuthState() {
        if (Auth.isAuthenticated()) {
            this.isLoggedIn = true;
            this.currentUser = Auth.getCurrentUser();
            this.updateUserUI();
        }
    }

    updateUserUI() {
        const userBadge = document.getElementById('user-info-badge');
        const logoutBtn = document.getElementById('logout-btn');
        const avatar = document.getElementById('topbar-avatar');
        const username = document.getElementById('topbar-username');

        if (this.isLoggedIn && this.currentUser) {
            userBadge.classList.remove('hidden');
            userBadge.classList.add('flex');
            logoutBtn.classList.remove('hidden');
            
            if (avatar && this.currentUser.initials) {
                avatar.textContent = this.currentUser.initials;
            }
            if (username && this.currentUser.name) {
                username.textContent = this.currentUser.name;
            }
        }
    }

    toggleNotifDropdown() {
        const dropdown = document.getElementById('notif-dropdown');
        dropdown.classList.toggle('hidden');
        this.closeMsgDropdown();
    }

    closeNotifDropdown() {
        const dropdown = document.getElementById('notif-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    toggleMsgDropdown() {
        const dropdown = document.getElementById('msg-dropdown');
        dropdown.classList.toggle('hidden');
        this.closeNotifDropdown();
    }

    closeMsgDropdown() {
        const dropdown = document.getElementById('msg-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    markAllNotifRead() {
        // Call the global function from notifications.js if available
        if (typeof markAllNotifRead === 'function') {
            markAllNotifRead();
        } else {
            console.log('Marking all notifications as read');
        }
        this.closeNotifDropdown();
    }

    markAllMsgRead() {
        // Call the global function from messages.js if available
        if (typeof markAllMsgRead === 'function') {
            markAllMsgRead();
        } else {
            console.log('Marking all messages as read');
        }
        this.closeMsgDropdown();
    }

    async handleLogout() {
        if (typeof Auth !== 'undefined' && Auth.logout) {
            await Auth.logout();
        }
        
        this.isLoggedIn = false;
        this.currentUser = null;
        
        const userBadge = document.getElementById('user-info-badge');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userBadge) {
            userBadge.classList.add('hidden');
            userBadge.classList.remove('flex');
        }
        if (logoutBtn) {
            logoutBtn.classList.add('hidden');
        }
        
        // Trigger auth overlay to show
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) {
            authOverlay.classList.remove('hidden');
        }
        document.body.classList.add('modal-open');
        
        // Reset login form
        const loginForm = document.getElementById('auth-login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Clear any auth errors
        document.querySelectorAll('.auth-error').forEach(el => el.classList.remove('visible'));
        document.querySelectorAll('.auth-input').forEach(el => el.classList.remove('error'));
        
        console.log('Logged out successfully');
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notif-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    updateMessageBadge(count) {
        const badge = document.getElementById('msg-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.topNav = new TopNavigationBar();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TopNavigationBar;
    }
});