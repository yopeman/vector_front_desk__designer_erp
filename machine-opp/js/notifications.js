// =============================================
// NOTIFICATIONS MODULE - REAL SUPABASE INTEGRATION
// =============================================

// Global state (notificationsData and currentUserId are declared in mock-data.js)
let readNotificationsData = [];
let notificationsChannel = null;

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
        currentUserId = user.id;
        await fetchNotifications();
        await fetchReadNotifications();
        setupNotificationsSubscription();
    } catch (error) {
        console.error('Error initializing notifications:', error);
    }
}

// =============================================
// FETCH NOTIFICATIONS FROM SUPABASE
// =============================================
async function fetchNotifications() {
    try {
        const { data, error } = await window.supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        notificationsData = (data || []).map(notif => ({
            id: notif.id,
            title: notif.title,
            message: notif.body,
            priority: notif.priority || 'normal',
            category: notif.category || 'general',
            icon: notif.icon,
            color: notif.color,
            read: false, // Will be determined by read_notifications
            createdAt: formatNotificationTime(notif.created_at)
        }));

        renderNotifications();
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// =============================================
// FETCH READ NOTIFICATIONS FROM SUPABASE
// =============================================
async function fetchReadNotifications() {
    try {
        const { data, error } = await window.supabase
            .from('read_notifications')
            .select('*')
            .eq('user_id', currentUserId);

        if (error) throw error;

        readNotificationsData = data || [];

        // Update read status in notificationsData
        notificationsData.forEach(notif => {
            const readRecord = readNotificationsData.find(rn => rn.notification_id === notif.id);
            notif.read = readRecord ? readRecord.is_read : false;
        });

        renderNotifications();
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
function setupNotificationsSubscription() {
    if (notificationsChannel) {
        window.supabase.removeChannel(notificationsChannel);
    }

    notificationsChannel = window.supabase
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
                notificationsData.unshift(newNotif);
                renderNotifications();
                showNotification(payload.new.title, payload.new.body);
            }
        )
        .subscribe();
}

// =============================================
// RENDER NOTIFICATIONS
// =============================================
function renderNotifications() {
    const container = document.getElementById('notifications-list');
    const noResults = document.getElementById('notif-no-results');
    if (!container) return;

    const searchVal = (document.getElementById('notif-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('notif-status-filter')?.value || 'all';
    const priorityFilter = document.getElementById('notif-priority-filter')?.value || 'all';

    let filtered = notificationsData;

    // Apply search
    if (searchVal) {
        filtered = filtered.filter(n => 
            (n.title + ' ' + n.message).toLowerCase().includes(searchVal)
        );
    }

    // Apply status filter
    if (statusFilter === 'unread') {
        filtered = filtered.filter(n => !n.read);
    } else if (statusFilter === 'read') {
        filtered = filtered.filter(n => n.read);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    container.innerHTML = '';

    if (filtered.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        document.getElementById('notif-filter-count').textContent = '0';
        updateNotifStats();
        return;
    }

    if (noResults) noResults.classList.add('hidden');

    filtered.forEach((notif, idx) => {
        const realIndex = notificationsData.indexOf(notif);
        const item = document.createElement('div');
        item.className = `notif-item p-4 flex items-start gap-4 transition-all hover:bg-slate-800/40 ${notif.read ? 'opacity-80' : 'bg-slate-800/20'}`;

        // Priority icon and color
        const priorityConfig = {
            high: { icon: 'fa-solid fa-circle-exclamation', color: 'text-rose-400', bg: 'bg-rose-500/15' },
            normal: { icon: 'fa-solid fa-circle-info', color: 'text-blue-400', bg: 'bg-blue-500/15' },
            low: { icon: 'fa-solid fa-circle-check', color: 'text-emerald-400', bg: 'bg-emerald-500/15' }
        };
        const pConfig = priorityConfig[notif.priority] || priorityConfig.normal;

        // Category icon
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
            <div class="w-10 h-10 rounded-xl ${pConfig.bg} flex items-center justify-center shrink-0">
                <i class="${pConfig.icon} ${pConfig.color} text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <h4 class="text-sm font-semibold text-white truncate ${notif.read ? '' : 'pr-2'}">
                            ${!notif.read ? '<span class="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2 align-middle"></span>' : ''}
                            ${escapeHtml(notif.title)}
                        </h4>
                        <p class="text-xs text-slate-400 mt-1 line-clamp-2">${escapeHtml(notif.message)}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <span class="text-[10px] text-slate-500 font-mono whitespace-nowrap">${notif.createdAt}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 mt-2.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${pConfig.bg} ${pConfig.color} border border-current/20 capitalize">
                        <i class="${catIcon} text-[8px]"></i>
                        ${notif.priority} · ${notif.category}
                    </span>
                    <button onclick="toggleNotifRead(${realIndex})" class="text-[10px] text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-blue-500/10" title="${notif.read ? 'Mark as unread' : 'Mark as read'}">
                        <i class="fa-solid ${notif.read ? 'fa-envelope' : 'fa-envelope-open'} text-[10px]"></i>
                        ${notif.read ? 'Unread' : 'Read'}
                    </button>
                    <button onclick="deleteNotification(${realIndex})" class="text-[10px] text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-rose-500/10" title="Delete notification">
                        <i class="fa-solid fa-trash text-[10px]"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById('notif-filter-count').textContent = filtered.length;
    updateNotifStats();
}

// =============================================
// UPDATE NOTIFICATION STATS
// =============================================
function updateNotifStats() {
    const total = notificationsData.length;
    const unread = notificationsData.filter(n => !n.read).length;
    const read = notificationsData.filter(n => n.read).length;
    const high = notificationsData.filter(n => n.priority === 'high').length;

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
    renderNotifications();
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
    renderNotifications();
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
    renderNotifications();
}

// =============================================
// NOTIFICATION ACTIONS
// =============================================
async function toggleNotifRead(notifId) {
    try {
        const existing = readNotificationsData.find(
            rn => rn.notification_id === notifId && rn.user_id === currentUserId
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
                    user_id: currentUserId,
                    notification_id: notifId,
                    is_read: true,
                    read_at: new Date().toISOString(),
                });
            if (error) throw error;
        }

        await fetchReadNotifications();
    } catch (error) {
        console.error('Error toggling notification read status:', error);
    }
}

async function markAllNotifRead() {
    try {
        const unreadNotifs = notificationsData.filter(n => !n.read);

        await Promise.all(
            unreadNotifs.map(async (notif) => {
                const existing = readNotificationsData.find(
                    rn => rn.notification_id === notif.id && rn.user_id === currentUserId
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
                            user_id: currentUserId,
                            notification_id: notif.id,
                            is_read: true,
                            read_at: new Date().toISOString(),
                        });
                }
            })
        );

        await fetchReadNotifications();
        renderNotifDropdown();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

async function deleteNotification(notifId) {
    if (!confirm('Delete this notification?')) return;
    
    try {
        const { error } = await window.supabase
            .from('notifications')
            .delete()
            .eq('id', notifId);

        if (error) throw error;

        notificationsData = notificationsData.filter(n => n.id !== notifId);
        renderNotifications();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// =============================================
// NOTIFICATION MODAL
// =============================================
function openNotificationModal() {
    const modal = document.getElementById('notification-modal');
    if (!modal) return;
    
    document.getElementById('notif-title').value = '';
    document.getElementById('notif-message').value = '';
    document.getElementById('notif-priority').value = 'normal';
    document.getElementById('notif-category').value = 'system';
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('notif-title').focus(), 300);
}

function closeNotificationModal(event) {
    const modal = document.getElementById('notification-modal');
    if (!modal) return;
    
    if (event && event.target !== modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

async function saveNotification() {
    const title = document.getElementById('notif-title').value.trim();
    const message = document.getElementById('notif-message').value.trim();
    const priority = document.getElementById('notif-priority').value;
    const category = document.getElementById('notif-category').value;

    if (!title || !message) {
        alert('Please enter both a title and message for the notification.');
        return;
    }

    try {
        const { error } = await window.supabase
            .from('notifications')
            .insert({
                title: title,
                body: message,
                priority: priority,
                category: category,
                icon: 'fa-bell',
                color: '#2563eb',
            });

        if (error) throw error;

        closeNotificationModal();
        await fetchNotifications();
        alert('Notification sent successfully!');
    } catch (error) {
        console.error('Error saving notification:', error);
        alert('Error saving notification: ' + error.message);
    }
}

// =============================================
// NOTIFICATION DROPDOWN
// =============================================
async function renderNotifDropdown() {
    const list = document.getElementById('notif-dropdown-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;
    
    const unread = notificationsData.filter(n => !n.read).length;
    if (badge) {
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : unread;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    if (notificationsData.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">No notifications</div>';
        return;
    }
    
    const priorityColors = {
        high: 'bg-rose-500/10 text-rose-400',
        normal: 'bg-blue-500/10 text-blue-400',
        low: 'bg-emerald-500/10 text-emerald-400'
    };
    const priorityIcons = {
        high: 'fa-exclamation-circle',
        normal: 'fa-info-circle',
        low: 'fa-check-circle'
    };
    
    list.innerHTML = notificationsData.slice(0, 10).map(n => {
        const colorClass = priorityColors[n.priority] || priorityColors.normal;
        const iconClass = priorityIcons[n.priority] || priorityIcons.normal;
        return `
            <div class="notif-dropdown-item ${n.read ? '' : 'unread'}" onclick="toggleNotifRead('${n.id}')">
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
    toast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse';
    toast.innerHTML = `
        <div class="font-semibold">${title}</div>
        <div class="text-sm">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
