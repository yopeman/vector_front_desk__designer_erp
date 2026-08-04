// Top Navigation Bar Component for Marketing ERP
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
        header.className = 'marketing-topbar';
        header.innerHTML = `
            <div class="topbar-left">
                <div class="topbar-logo">
                    <span class="logo-icon">V</span>
                    <div class="logo-text">
                        <h1>Vector Marketing ERP</h1>
                        <p>International Marketing Ultimate Edition</p>
                    </div>
                </div>
            </div>

            <div class="topbar-right">
                <!-- Notification Bell -->
                <div class="topbar-dropdown-container" id="notif-dropdown-container">
                    <button onclick="topNav.toggleNotifDropdown()" id="notif-bell-btn" class="topbar-icon-btn" aria-label="Notifications">
                        <i class="fa-solid fa-bell"></i>
                        <span id="notif-badge" class="topbar-badge hidden">0</span>
                    </button>
                    <div id="notif-dropdown" class="topbar-dropdown hidden">
                        <div class="dropdown-header">
                            <h3>Notifications</h3>
                            <button onclick="topNav.markAllNotifRead()" class="dropdown-action">Mark all read</button>
                        </div>
                        <div id="notif-dropdown-list" class="dropdown-list">
                            <div class="dropdown-empty">No notifications</div>
                        </div>
                        <div class="dropdown-footer">
                            <button onclick="switchView('notifications')" class="dropdown-link">Show all notifications</button>
                        </div>
                    </div>
                </div>

                <!-- Message Icon -->
                <div class="topbar-dropdown-container" id="msg-dropdown-container">
                    <button onclick="topNav.toggleMsgDropdown()" id="msg-bell-btn" class="topbar-icon-btn" aria-label="Messages">
                        <i class="fa-solid fa-envelope"></i>
                        <span id="msg-badge" class="topbar-badge hidden">0</span>
                    </button>
                    <div id="msg-dropdown" class="topbar-dropdown hidden">
                        <div class="dropdown-header">
                            <h3>Messages</h3>
                            <button onclick="topNav.markAllMsgRead()" class="dropdown-action">Mark all read</button>
                        </div>
                        <div id="msg-dropdown-list" class="dropdown-list">
                            <div class="dropdown-empty">No messages</div>
                        </div>
                        <div class="dropdown-footer">
                            <button onclick="switchView('messages')" class="dropdown-link">Show all messages</button>
                        </div>
                    </div>
                </div>

                <div class="topbar-divider"></div>

                <!-- User Info & Logout -->
                <div class="topbar-user-section">
                    <div id="user-info-badge" class="user-info-badge hidden">
                        <div class="user-avatar" id="topbar-avatar">-</div>
                        <span id="topbar-username" class="user-name">-</span>
                    </div>
                    <button id="logout-btn" class="logout-btn hidden" onclick="topNav.handleLogout()">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Logout</span>
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

    async checkAuthState() {
        if (MarketingAuth?.initPromise) {
            await MarketingAuth.initPromise;
        }
        if (MarketingAuth.isAuthenticated()) {
            this.isLoggedIn = true;
            this.currentUser = MarketingAuth.getCurrentUser();
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
            logoutBtn.classList.remove('hidden');
            
            if (avatar && this.currentUser.name) {
                avatar.textContent = this.currentUser.name.substring(0, 2).toUpperCase();
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
        if (typeof markAllNotifRead === 'function') {
            markAllNotifRead();
        } else {
            console.log('Marking all notifications as read');
        }
        this.closeNotifDropdown();
    }

    markAllMsgRead() {
        if (typeof markAllMsgRead === 'function') {
            markAllMsgRead();
        } else {
            console.log('Marking all messages as read');
        }
        this.closeMsgDropdown();
    }

    async handleLogout() {
        if (typeof MarketingAuth !== 'undefined' && MarketingAuth.logout) {
            await MarketingAuth.logout();
        }
        
        this.isLoggedIn = false;
        this.currentUser = null;
        
        const userBadge = document.getElementById('user-info-badge');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userBadge) {
            userBadge.classList.add('hidden');
        }
        if (logoutBtn) {
            logoutBtn.classList.add('hidden');
        }
        
        // Trigger auth overlay to show
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) {
            authOverlay.classList.remove('hidden');
        }
        
        // Reset login form
        const loginForm = document.getElementById('auth-login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
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
});
