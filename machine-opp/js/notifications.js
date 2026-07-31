// =============================================
// NOTIFICATIONS MODULE
// =============================================



// =============================================
// INITIALIZE NOTIFICATIONS DATA
// =============================================
function initNotificationsData() {
    const now = new Date();
    const timeStr = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const h = now.getHours();
    const m = now.getMinutes();

    notificationsData = [
        {
            id: notifIdCounter++,
            title: 'System Update Complete',
            message: 'The ERP system has been updated to version 2.0. All modules are now available.',
            priority: 'normal',
            category: 'system',
            read: false,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 30)}`
        },
        {
            id: notifIdCounter++,
            title: 'Urgent: CNC Maintenance Required',
            message: 'CNC Machine #01 has exceeded 500 operating hours. Schedule maintenance immediately.',
            priority: 'high',
            category: 'maintenance',
            read: false,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 60)}`
        },
        {
            id: notifIdCounter++,
            title: 'New Order Received',
            message: 'Order #0006/09 has been received from Abeba. UV print job for acrylic signage.',
            priority: 'normal',
            category: 'order',
            read: false,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 120)}`
        },
        {
            id: notifIdCounter++,
            title: 'Store Request Approved',
            message: 'The store request for brass sheets (Order #0004/09) has been approved and dispatched.',
            priority: 'low',
            category: 'store',
            read: true,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 180)}`
        },
        {
            id: notifIdCounter++,
            title: 'HR: Leave Request Update',
            message: 'Your leave request has been processed and approved by the HR department.',
            priority: 'normal',
            category: 'hr',
            read: true,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 240)}`
        }
    ];
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
function toggleNotifRead(index) {
    if (notificationsData[index]) {
        notificationsData[index].read = !notificationsData[index].read;
        renderNotifications();
    }
}

function markAllNotifRead() {
    notificationsData.forEach(n => n.read = true);
    renderNotifications();
    renderNotifDropdown();
}

function deleteNotification(index) {
    if (!confirm('Delete this notification?')) return;
    notificationsData.splice(index, 1);
    renderNotifications();
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

function saveNotification() {
    const title = document.getElementById('notif-title').value.trim();
    const message = document.getElementById('notif-message').value.trim();
    const priority = document.getElementById('notif-priority').value;
    const category = document.getElementById('notif-category').value;

    if (!title || !message) {
        alert('Please enter both a title and message for the notification.');
        return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    notificationsData.unshift({
        id: notifIdCounter++,
        title,
        message,
        priority,
        category,
        read: false,
        createdAt: `${dateStr} ${timeStr}`
    });

    closeNotificationModal();
    renderNotifications();
    alert('Notification sent successfully!');
}

// =============================================
// NOTIFICATION DROPDOWN
// =============================================
function renderNotifDropdown() {
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
            <div class="notif-dropdown-item ${n.read ? '' : 'unread'}" onclick="markNotifRead(${n.id})">
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
