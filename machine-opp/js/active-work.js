// =============================================
// ACTIVE WORK MODULE (In Progress production orders)
// =============================================

let activeWorkData = [];
let awCurrentIndex = -1;
let awChatMessages = [];
let awChatChannel = null;
let awChatPollInterval = null;
let awPendingFiles = [];

async function fetchActiveWork() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    const machineIds = typeof Auth !== 'undefined' && Auth.getAssignedMachineIds ? await Auth.getAssignedMachineIds() : null;

    let query = supabase
        .from('production_orders')
        .select(`
            id,
            task_type,
            priority,
            status,
            job_type,
            material,
            thickness,
            color,
            length,
            width,
            height,
            gram,
            attached_file_ids,
            started_at,
            completed_at,
            created_at,
            users!designer_id(username),
            machines(name, machine_type),
            orders(id, order_no, order_date),
            job_orders(job_no)
        `)
        .eq('job_type', 'received')
        .eq('status', 'In Progress');

    if (machineIds) {
        query = query.in('machine_id', machineIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching active work:', error);
        return;
    }

    activeWorkData = (data || []).map((po, index) => ({
        id: po.id,
        orderId: po.orders?.id || null,
        no: String(index + 1).padStart(2, '0'),
        date: po.orders?.order_date || formatDate(po.created_at),
        taskType: po.task_type || 'task',
        jobNum: po.job_orders?.job_no || null,
        orderNum: po.job_orders?.job_no || po.orders?.order_no || 'N/A',
        designer: po.users?.username || 'Unknown',
        title: po.job_orders?.job_no || po.orders?.order_no || 'Untitled Order',
        priority: po.priority === 'High' ? 'urgent' : (po.priority === 'Medium' ? 'normal' : 'normal'),
        machine: po.machines?.machine_type || po.machines?.name || 'N/A',
        material: po.material || '',
        thickness: po.thickness || '',
        color: po.color || '',
        length: po.length || '',
        width: po.width || '',
        height: po.height || '',
        gram: po.gram || '',
        status: po.status.toLowerCase().replace(/\s+/g, '-'),
        attachedFileIds: po.attached_file_ids || [],
        startedAt: po.started_at || null,
        completedAt: po.completed_at || null
    }));

    awUpdateSidebarCount();
}

function awUpdateSidebarCount() {
    const el = document.getElementById('sidebar-count-active-work');
    if (el) {
        el.textContent = Array.isArray(activeWorkData) ? activeWorkData.length : 0;
    }
}

// =============================================
// RENDER ACTIVE WORK TABLE
// =============================================
async function renderActiveWorkTable() {
    await fetchActiveWork();

    const tbody = document.getElementById('active-work-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!activeWorkData.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="p-8 text-center text-slate-400">
                    No active (in progress) work found
                </td>
            </tr>
        `;
        awUpdateStats();
        return;
    }

    activeWorkData.forEach((order, index) => {
        const isUrgent = order.priority === 'urgent';
        const row = document.createElement('tr');
        row.className = `aw-order-row hover:bg-blue-600/10 transition-colors relative ${isUrgent ? 'bg-rose-500/5' : ''}`;
        row.setAttribute('data-id', order.id);
        row.setAttribute('data-aw-index', index);
        row.innerHTML = `
            <td class="p-4 text-center font-mono font-medium ${isUrgent ? 'text-rose-400' : 'text-slate-400'} border-l-4 ${isUrgent ? 'border-rose-500' : 'border-slate-600'}">
                ${order.no}
            </td>
            <td class="p-4 font-mono">${order.date}</td>
            <td class="p-4">
                <span class="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-medium border border-blue-500/20 capitalize">${order.taskType}</span>
            </td>
            <td class="p-4 font-mono text-slate-400">
                <span class="inline-flex items-center gap-2">
                    <span class="prod-unread-dot" title="Unread production chat" style="width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;display:${productionUnreadIds.has(order.id) ? 'inline-block' : 'none'};"></span>
                    ${order.orderNum}
                </span>
            </td>
            <td class="p-4 font-medium">
                <span class="inline-flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'} inline-flex items-center justify-center text-[9px] font-bold shrink-0">${order.designer.charAt(0)}</span>
                    ${order.designer}
                </span>
            </td>
            <td class="p-4 ${isUrgent ? 'font-semibold' : ''}">${order.title}</td>
            <td class="p-4">
                ${isUrgent 
                    ? `<span class="badge-urgent inline-flex items-center gap-1 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
                          <i class="fa-solid fa-exclamation-circle text-[9px]"></i> urgent
                        </span>` 
                    : `<span class="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 text-slate-300 rounded-full text-xs font-semibold border border-slate-600/40">
                          <i class="fa-regular fa-circle-check text-[9px] text-emerald-400"></i> normal
                        </span>`
                }
            </td>
            <td class="p-4 text-center">
                ${renderStatusBadge(order.status)}
            </td>
            <td class="p-4">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded-lg text-[11px] font-mono border border-slate-700/50">
                    <i class="fa-solid fa-microchip text-[8px] text-slate-500"></i>
                    ${order.machine}
                </span>
            </td>
            <td class="p-4 text-center">
                <button onclick="event.stopPropagation(); openActiveWorkDetail(${index})" class="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all" title="View details & chat">
                    <i class="fa-solid fa-eye mr-1"></i>Show
                </button>
            </td>
        `;
        row.addEventListener('click', function() {
            openActiveWorkDetail(index);
        });
        tbody.appendChild(row);
    });

    awUpdateStats();
}

function awUpdateStats() {
    const activeEl = document.getElementById('aw-stats-active');
    const urgentEl = document.getElementById('aw-stats-urgent');
    const unreadEl = document.getElementById('aw-stats-unread');

    const active = activeWorkData.length;
    const urgent = activeWorkData.filter(o => o.priority === 'urgent').length;
    const unread = activeWorkData.filter(o => productionUnreadIds.has(o.id)).length;

    if (activeEl) activeEl.textContent = active;
    if (urgentEl) urgentEl.textContent = urgent;
    if (unreadEl) unreadEl.textContent = unread;
}

function awRefreshUnreadDots() {
    document.querySelectorAll('tr.aw-order-row').forEach(row => {
        const id = row.getAttribute('data-id');
        const dot = row.querySelector('.prod-unread-dot');
        if (!dot || !id) return;
        dot.style.display = productionUnreadIds.has(id) ? 'inline-block' : 'none';
    });
    awUpdateStats();
}

// =============================================
// DETAIL MODAL + TABS
// =============================================
function openActiveWorkDetail(index) {
    const order = activeWorkData[index];
    if (!order) return;

    awCurrentIndex = index;

    const modal = document.getElementById('aw-detail-modal');
    if (modal) modal.classList.add('open');
    document.body.classList.add('modal-open');

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '-';
    };

    setVal('aw-det-task-type', order.taskType);
    setVal('aw-det-order-num', order.orderNum);
    setVal('aw-det-date', order.date);
    setVal('aw-det-title', order.title);
    setVal('aw-det-designer', order.designer);
    setVal('aw-det-machine', order.machine);
    setVal('aw-det-material', `${order.material || '-'} / ${order.thickness || '-'} / ${order.color || '-'}`);
    setVal('aw-det-length', order.length);
    setVal('aw-det-width', order.width);
    setVal('aw-det-height-gram', `${order.height || '-'} / ${order.gram || '-'}`);

    awSwitchTab('details');

    awRenderOrderFiles(order.attachedFileIds);
}

function awRenderOrderFiles(fileIds) {
    const container = document.getElementById('aw-det-attached-files');
    if (!container) return;

    if (!fileIds || fileIds.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        return;
    }

    supabase
        .from('files')
        .select('id, name, path, mime_type')
        .in('id', fileIds)
        .then(({ data, error }) => {
            if (error || !data || data.length === 0) {
                container.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
                return;
            }
            container.innerHTML = data.map(file => `
                <button onclick="downloadFileById('${file.id}')" title="Download ${escapeHtml(file.name)}" class="w-full flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 transition-colors text-left">
                    <i class="fa-solid ${productionFileTypeIcon(file.mime_type)} text-cyan-400 text-xs shrink-0"></i>
                    <span class="text-xs text-slate-300 truncate flex-1">${escapeHtml(file.name)}</span>
                    <i class="fa-solid fa-download text-slate-400 text-[10px]"></i>
                </button>
            `).join('');
        });
}

function awSwitchTab(tab) {
    const detailsTab = document.getElementById('aw-tab-details');
    const commTab = document.getElementById('aw-tab-communication');
    const detailsPane = document.getElementById('aw-pane-details');
    const commPane = document.getElementById('aw-pane-communication');

    const isComm = tab === 'communication';

    if (detailsTab && commTab) {
        if (isComm) {
            commTab.className = 'px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white transition-all';
            detailsTab.className = 'px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all';
        } else {
            detailsTab.className = 'px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white transition-all';
            commTab.className = 'px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all';
        }
    }

    if (detailsPane) detailsPane.classList.toggle('hidden', isComm);
    if (commPane) commPane.classList.toggle('hidden', !isComm);

    if (isComm) {
        awLoadChat();
    }
}

function awCloseDetailModal(event) {
    if (event && event.target !== document.getElementById('aw-detail-modal')) return;
    const modal = document.getElementById('aw-detail-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    awCurrentIndex = -1;

    if (awChatChannel && typeof supabase !== 'undefined') {
        supabase.removeChannel(awChatChannel);
        awChatChannel = null;
    }
    if (awChatPollInterval) {
        clearInterval(awChatPollInterval);
        awChatPollInterval = null;
    }

    awPendingFiles = [];
    awRenderPendingFiles();
}

// =============================================
// COMMUNICATION (production chat) for active work
// =============================================
async function awLoadChat() {
    const order = activeWorkData[awCurrentIndex];
    if (!order) return;

    const messagesContainer = document.getElementById('aw-chat-messages');
    if (messagesContainer) messagesContainer.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">Loading messages...</div>';

    awChatMessages = await fetchProductionCommunications(order.id);

    // Auto-mark unread incoming messages as read once the chat is open
    const myId = Auth.getCurrentUser() ? Auth.getCurrentUser().id : null;
    const pendingUnread = awChatMessages.filter(m => !m.isRead && m.senderId !== myId);
    if (pendingUnread.length > 0 && typeof supabase !== 'undefined') {
        supabase
            .from('production_communications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', pendingUnread.map(m => m.id))
            .then(({ error }) => {
                if (!error) {
                    pendingUnread.forEach(m => { m.isRead = true; m.readAt = new Date().toISOString(); });
                    awRenderChat();
                }
            });
    }
    loadProductionUnreadIds();

    awRenderChat();

    if (awChatChannel) {
        supabase.removeChannel(awChatChannel);
    }
    if (awChatPollInterval) {
        clearInterval(awChatPollInterval);
    }

    if (typeof supabase !== 'undefined') {
        awChatChannel = supabase
            .channel(`aw-production-communications-${order.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'production_communications',
                filter: `production_order_id=eq.${order.id}`
            }, async (payload) => {
                const newComm = await fetchSingleProductionCommunication(payload.new.id);
                if (newComm) {
                    if (!awChatMessages.find(m => m.id === newComm.id)) {
                        awChatMessages.push(newComm);
                        awRenderChat();
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Active work realtime chat connected');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Active work realtime channel error');
                }
            });

        awChatPollInterval = setInterval(async () => {
            if (awCurrentIndex >= 0 && activeWorkData[awCurrentIndex]) {
                const refreshed = await fetchProductionCommunications(activeWorkData[awCurrentIndex].id);
                const existingIds = new Set(awChatMessages.map(m => m.id));
                const newMsgs = refreshed.filter(m => !existingIds.has(m.id));
                if (newMsgs.length > 0) {
                    awChatMessages.push(...newMsgs);
                    awChatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    awRenderChat();
                }
            }
        }, 5000);
    }
}

function awRenderChat() {
    const container = document.getElementById('aw-chat-messages');
    if (!container) return;
    renderProductionChat(awChatMessages, container, 'awMarkAsRead');
}

async function awMarkAsRead(commId) {
    if (!commId || typeof supabase === 'undefined') return;

    const { error } = await supabase
        .from('production_communications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', commId);

    if (error) return;

    const msg = awChatMessages.find(m => m.id === commId);
    if (msg) {
        msg.isRead = true;
        msg.readAt = new Date().toISOString();
        awRenderChat();
    }
    loadProductionUnreadIds();
}

function awOnFileSelect(input) {
    if (!input || !input.files) return;
    for (const file of input.files) {
        awPendingFiles.push(file);
    }
    input.value = '';
    awRenderPendingFiles();
}

function awRemovePendingFile(index) {
    if (index < 0 || index >= awPendingFiles.length) return;
    awPendingFiles.splice(index, 1);
    awRenderPendingFiles();
}

function awRenderPendingFiles() {
    const container = document.getElementById('aw-chat-pending-files');
    if (!container) return;
    if (awPendingFiles.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }
    container.classList.remove('hidden');
    container.innerHTML = awPendingFiles.map((file, index) => `
        <span class="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
            <i class="fa-solid ${productionFileTypeIcon(file.type || '')} text-cyan-400 text-[10px]"></i>
            <span class="max-w-[140px] truncate">${escapeHtml(file.name)}</span>
            <button onclick="awRemovePendingFile(${index})" class="text-slate-400 hover:text-rose-400 transition-colors" title="Remove">
                <i class="fa-solid fa-xmark text-[10px]"></i>
            </button>
        </span>
    `).join('');
}

async function awSendMessage() {
    const order = activeWorkData[awCurrentIndex];
    if (!order) return;

    const input = document.getElementById('aw-chat-input');
    if (!input) return;
    const messageText = input.value.trim();

    if (!messageText && awPendingFiles.length === 0) return;

    input.value = '';

    let attachedFileIds = [];
    if (typeof uploadFile === 'function' && awPendingFiles.length > 0) {
        for (const file of awPendingFiles) {
            const fileData = await uploadFile(file);
            if (fileData && fileData.id) {
                attachedFileIds.push(fileData.id);
            }
        }
        awPendingFiles = [];
        awRenderPendingFiles();
    }

    await sendProductionCommunication(order.id, messageText, attachedFileIds);
    const refreshed = await fetchProductionCommunications(order.id);
    awChatMessages = refreshed;
    awRenderChat();
}