// notifications Section Component
// Renders the notifications section HTML

class NotificationsSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('notifications-section-container');
        if (container) {
            container.innerHTML = `<div class="section-header">
                    <div>
                        <h2 class="section-title">
                            <i class="fa-solid fa-bell"></i>
                            Notification Center
                        </h2>
                        <p class="section-subtitle">Manage system notifications, mark as read/unread, search, filter, and delete.</p>
                    </div>
                </div>

                <!-- Stats Summary Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon rose">
                            <i class="fa-solid fa-bell"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Total</p>
                            <p class="stat-value" id="notif-stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon blue">
                            <i class="fa-solid fa-envelope-open"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Unread</p>
                            <p class="stat-value" id="notif-stats-unread">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon emerald">
                            <i class="fa-solid fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Read</p>
                            <p class="stat-value" id="notif-stats-read">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon amber">
                            <i class="fa-solid fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">High Priority</p>
                            <p class="stat-value" id="notif-stats-high">0</p>
                        </div>
                    </div>
                </div>

                <!-- Search & Filter Bar -->
                <div class="filter-bar">
                    <div class="filter-group">
                        <div class="search-wrapper">
                            <i class="fa-solid fa-magnifying-glass search-icon"></i>
                            <input type="text" id="notif-search" onkeyup="filterNotifications()" placeholder="Search notifications..." class="search-input">
                            <button id="notif-search-clear" onclick="clearNotifSearch()" class="search-clear">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div class="select-wrapper">
                            <select id="notif-status-filter" onchange="filterNotifications()" class="form-select">
                                <option value="all">All Status</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                            </select>
                        </div>
                        <div class="select-wrapper">
                            <select id="notif-priority-filter" onchange="filterNotifications()" class="form-select">
                                <option value="all">All Priority</option>
                                <option value="high">High</option>
                                <option value="normal">Normal</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div class="filter-count">
                            <i class="fa-regular fa-filter"></i>
                            <span>Showing: <strong id="notif-filter-count">0</strong></span>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button onclick="topNav.markAllNotifRead()" class="btn-secondary">
                            <i class="fa-solid fa-check-double"></i> Mark All Read
                        </button>
                        <button onclick="resetNotifFilters()" class="btn-secondary">
                            <i class="fa-solid fa-rotate-left"></i> Reset
                        </button>
                    </div>
                </div>

                <!-- Notifications List -->
                <div class="notifications-list">
                    <div id="notifications-list" class="notif-items">
                        <!-- Rendered by JS -->
                    </div>
                    <!-- No results state -->
                    <div id="notif-no-results" class="empty-state hidden">
                        <div class="empty-icon">
                            <i class="fa-solid fa-bell-slash"></i>
                        </div>
                        <p class="empty-title">No notifications found</p>
                        <p class="empty-subtitle">Try adjusting your search or filter settings</p>
                        <button onclick="resetNotifFilters()" class="btn-secondary">
                            <i class="fa-solid fa-rotate-left"></i> Reset Filters
                        </button>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new NotificationsSection();
});
