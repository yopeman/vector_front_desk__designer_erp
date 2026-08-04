// =============================================
// NOTIFICATIONS MODULE - MARKETING ERP
// =============================================

// Global state
const MarketingNotifications = {
    data: [],
    readData: [],
    currentUserId: null,
    channel: null
};

// =============================================
// INITIALIZE NOTIFICATIONS DATA
// =============================================
async function initNotificationsData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error('No authenticated user found');
            return;
        }
        MarketingNotifications.currentUserId = user.id;
        await MarketingNotifications.fetchNotifications();
        await MarketingNotifications.fetchReadNotifications();
        MarketingNotifications.setupSubscription();
    } catch (error) {
        console.error('Error initializing notifications:', error);
    }
}

// =============================================
// FETCH NOTIFICATIONS FROM SUPABASE
// =============================================
MarketingNotifications.fetchNotifications = async function() {
    try {
        const { data, error } = await window.supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                console.warn('Notifications table does not exist yet');
                MarketingNotifications.data = [];
                MarketingNotifications.render();
                return;
            }
            throw error;
        }

        MarketingNotifications.data = (data || []).map(notif => ({
            id: notif.id,
            title: notif.title,
            message: notif.body,
            priority: notif.priority || 'normal',
            category: notif.category || 'general',
            icon: notif.icon,
            color: notif.color,
            read: false,
            createdAt: formatNotificationTime(notif.created_at)
        }));

        MarketingNotifications.render();
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// =============================================
// FETCH READ NOTIFICATIONS FROM SUPABASE
// =============================================
MarketingNotifications.fetchReadNotifications = async function() {
    try {
        const { data, error } = await window.supabase
            .from('read_notifications')
            .select('*')
            .eq('user_id', MarketingNotifications.currentUserId);

        if (error) {
            if (error.code === '42P01') {
                console.warn('read_notifications table does not exist yet');
                MarketingNotifications.readData = [];
                MarketingNotifications.render();
                return;
            }
            throw error;
        }

        MarketingNotifications.readData = data || [];

        MarketingNotifications.data.forEach(notif => {
            const readRecord = MarketingNotifications.readData.find(rn => rn.notification_id === notif.id);
            notif.read = readRecord ? readRecord.is_read : false;
        });

        MarketingNotifications.render();
    } catch (error) {
        console.error('Error fetching read notifications:', error);
    }
}

function formatNotificationTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// =============================================
// SETUP REALTIME SUBSCRIPTION
// =============================================
MarketingNotifications.setupSubscription = function() {
    if (MarketingNotifications.channel) {
        window.supabase.removeChannel(MarketingNotifications.channel);
    }

    MarketingNotifications.channel = window.supabase
        .channel('notifications-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            },
            async (payload) => {
                const newNotif = {
                    id: payload.new.id,
                    title: payload.new.title,
                    message: payload.new.body,
                    priority: payload.new.priority || 'normal',
                    category: payload.new.category || 'general',
                    icon: payload.new.icon,
                    color: payload.new.color,
                    read: false,
                    createdAt: formatNotificationTime(payload.new.created_at)
                };
                MarketingNotifications.data.unshift(newNotif);
                MarketingNotifications.render();
                showNotification(payload.new.title, payload.new.body);
            }
        )
        .subscribe();
}

// =============================================
// RENDER NOTIFICATIONS
// =============================================
MarketingNotifications.render = function() {
    const container = document.getElementById('notifications-list');
    const noResults = document.getElementById('notif-no-results');
    if (!container) return;

    const searchVal = (document.getElementById('notif-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('notif-status-filter')?.value || 'all';
    const priorityFilter = document.getElementById('notif-priority-filter')?.value || 'all';

    let filtered = MarketingNotifications.data;

    if (searchVal) {
        filtered = filtered.filter(n => 
            (n.title + ' ' + n.message).toLowerCase().includes(searchVal)
        );
    }

    if (statusFilter === 'unread') {
        filtered = filtered.filter(n => !n.read);
    } else if (statusFilter === 'read') {
        filtered = filtered.filter(n => n.read);
    }

    if (priorityFilter !== 'all') {
        filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    container.innerHTML = '';

    if (filtered.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        document.getElementById('notif-filter-count').textContent = '0';
        MarketingNotifications.updateStats();
        return;
    }

    if (noResults) noResults.classList.add('hidden');

    filtered.forEach((notif) => {
        const item = document.createElement('div');
        item.className = `notif-item ${notif.read ? 'read' : 'unread'}`;

        const priorityConfig = {
            high: { icon: 'fa-solid fa-circle-exclamation', color: 'text-rose', bg: 'bg-rose' },
            normal: { icon: 'fa-solid fa-circle-info', color: 'text-blue', bg: 'bg-blue' },
            low: { icon: 'fa-solid fa-circle-check', color: 'text-emerald', bg: 'bg-emerald' }
        };
        const pConfig = priorityConfig[notif.priority] || priorityConfig.normal;

        const categoryIcons = {
            system: 'fa-solid fa-server',
            order: 'fa-solid fa-clipboard-list',
            maintenance: 'fa-solid fa-screwdriver-wrench',
            hr: 'fa-solid fa-users',
            store: 'fa-solid fa-boxes-stacked',
            general: 'fa-solid fa-bell'
        };
        const catIcon = categoryIcons[notif.category] || 'fa-solid fa-bell';

        item.innerHTML = `
            <div class="notif-icon ${pConfig.bg}">
                <i class="${pConfig.icon} ${pConfig.color}"></i>
            </div>
            <div class="notif-content">
                <div class="notif-header">
                    <h4 class="notif-title">
                        ${!notif.read ? '<span class="unread-indicator"></span>' : ''}
                        ${escapeHtml(notif.title)}
                    </h4>
                    <span class="notif-time">${notif.createdAt}</span>
                </div>
                <p class="notif-message">${escapeHtml(notif.message)}</p>
                <div class="notif-footer">
                    <span class="notif-tag ${pConfig.bg} ${pConfig.color}">
                        <i class="${catIcon}"></i>
                        ${notif.priority} · ${notif.category}
                    </span>
                    <button onclick="MarketingNotifications.toggleRead('${notif.id}')" class="notif-action" title="${notif.read ? 'Mark as unread' : 'Mark as read'}">
                        <i class="fa-solid ${notif.read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
                        ${notif.read ? 'Unread' : 'Read'}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById('notif-filter-count').textContent = filtered.length;
    MarketingNotifications.updateStats();
}

// =============================================
// UPDATE NOTIFICATION STATS
// =============================================
MarketingNotifications.updateStats = function() {
    const total = MarketingNotifications.data.length;
    const unread = MarketingNotifications.data.filter(n => !n.read).length;
    const read = MarketingNotifications.data.filter(n => n.read).length;
    const high = MarketingNotifications.data.filter(n => n.priority === 'high').length;

    const totalEl = document.getElementById('notif-stats-total');
    const unreadEl = document.getElementById('notif-stats-unread');
    const readEl = document.getElementById('notif-stats-read');
    const highEl = document.getElementById('notif-stats-high');
    
    if (totalEl) totalEl.textContent = total;
    if (unreadEl) unreadEl.textContent = unread;
    if (readEl) readEl.textContent = read;
    if (highEl) highEl.textContent = high;
}

// =============================================
// FILTER NOTIFICATIONS
// =============================================
function filterNotifications() {
    MarketingNotifications.render();
    const searchVal = document.getElementById('notif-search')?.value || '';
    const clearBtn = document.getElementById('notif-search-clear');
    if (clearBtn) {
        if (searchVal.length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }
    }
}

function clearNotifSearch() {
    const input = document.getElementById('notif-search');
    const clearBtn = document.getElementById('notif-search-clear');
    if (input) input.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    MarketingNotifications.render();
}

function resetNotifFilters() {
    const search = document.getElementById('notif-search');
    const status = document.getElementById('notif-status-filter');
    const priority = document.getElementById('notif-priority-filter');
    const clearBtn = document.getElementById('notif-search-clear');
    
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (priority) priority.value = 'all';
    if (clearBtn) clearBtn.classList.remove('visible');
    MarketingNotifications.render();
}

// =============================================
// NOTIFICATION ACTIONS
// =============================================
MarketingNotifications.toggleRead = async function(notifId) {
    try {
        const existing = MarketingNotifications.readData.find(
            rn => rn.notification_id === notifId && rn.user_id === MarketingNotifications.currentUserId
        );

        if (existing) {
            const { error } = await window.supabase
                .from('read_notifications')
                .update({ is_read: !existing.is_read, read_at: new Date().toISOString() })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await window.supabase
                .from('read_notifications')
                .insert({
                    user_id: MarketingNotifications.currentUserId,
                    notification_id: notifId,
                    is_read: true,
                    read_at: new Date().toISOString(),
                });
            if (error) throw error;
        }

        await MarketingNotifications.fetchReadNotifications();
    } catch (error) {
        console.error('Error toggling notification read status:', error);
    }
}

MarketingNotifications.markAllRead = async function() {
    try {
        const unreadNotifs = MarketingNotifications.data.filter(n => !n.read);

        await Promise.all(
            unreadNotifs.map(async (notif) => {
                const existing = MarketingNotifications.readData.find(
                    rn => rn.notification_id === notif.id && rn.user_id === MarketingNotifications.currentUserId
                );

                if (existing) {
                    await window.supabase
                        .from('read_notifications')
                        .update({ is_read: true, read_at: new Date().toISOString() })
                        .eq('id', existing.id);
                } else {
                    await window.supabase
                        .from('read_notifications')
                        .insert({
                            user_id: MarketingNotifications.currentUserId,
                            notification_id: notif.id,
                            is_read: true,
                            read_at: new Date().toISOString(),
                        });
                }
            })
        );

        await MarketingNotifications.fetchReadNotifications();
        MarketingNotifications.renderDropdown();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

MarketingNotifications.delete = async function(notifId) {
    if (!confirm('Delete this notification?')) return;
    
    try {
        const { error } = await window.supabase
            .from('notifications')
            .delete()
            .eq('id', notifId);

        if (error) throw error;

        MarketingNotifications.data = MarketingNotifications.data.filter(n => n.id !== notifId);
        MarketingNotifications.render();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// =============================================
// NOTIFICATION DROPDOWN
// =============================================
MarketingNotifications.renderDropdown = async function() {
    const list = document.getElementById('notif-dropdown-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;
    
    const unread = MarketingNotifications.data.filter(n => !n.read).length;
    if (badge) {
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : unread;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    if (MarketingNotifications.data.length === 0) {
        list.innerHTML = '<div class="dropdown-empty">No notifications</div>';
        return;
    }
    
    const priorityColors = {
        high: 'bg-rose',
        normal: 'bg-blue',
        low: 'bg-emerald'
    };
    const priorityIcons = {
        high: 'fa-exclamation-circle',
        normal: 'fa-info-circle',
        low: 'fa-check-circle'
    };
    
    list.innerHTML = MarketingNotifications.data.slice(0, 10).map(n => {
        const colorClass = priorityColors[n.priority] || priorityColors.normal;
        const iconClass = priorityIcons[n.priority] || priorityIcons.normal;
        return `
            <div class="notif-dropdown-item ${n.read ? '' : 'unread'}" onclick="MarketingNotifications.toggleRead('${n.id}')">
                <div class="notif-icon ${colorClass}"><i class="fa-solid ${iconClass}"></i></div>
                <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-preview">${n.message}</div>
                    <div class="notif-time">${n.createdAt}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to show notifications
function showNotification(title, message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose functions to global scope for onclick handlers
window.filterNotifications = filterNotifications;
window.clearNotifSearch = clearNotifSearch;
window.resetNotifFilters = resetNotifFilters;
window.markAllRead = MarketingNotifications.markAllRead;
window.markAllNotifRead = MarketingNotifications.markAllRead;
window.MarketingNotifications = MarketingNotifications;
