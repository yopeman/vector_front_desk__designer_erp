// =============================================
// RECEIVED ORDERS MODULE
// =============================================

let receivedOrdersLoaded = false;
let currentSharedFile = null;
let approvedDesignVersions = [];
let designerChatChannel = null;
let designerChatPollInterval = null;
let productionChatChannel = null;
let productionChatPollInterval = null;
let productionChatUnreadPollInterval = null;
let productionUnreadIds = new Set();

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(2);
    return `${day}/${month}/${year}`;
}

function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function fetchReceivedOrders() {
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
            started_at,
            completed_at,
            created_at,
            users!designer_id(username),
            machines(name, machine_type),
            orders(id, order_no, order_date),
            job_orders(job_no)
        `)
        .eq('job_type', 'received')
        .in('status', ['New', 'In Progress']);

    if (machineIds) {
        query = query.in('machine_id', machineIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching received orders:', error);
        return;
    }

    ordersData = (data || []).map((po, index) => ({
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
        status: (po.status || 'New').toLowerCase().replace(/\s+/g, '-'),
        startedAt: po.started_at || null,
        completedAt: po.completed_at || null
    }));

    receivedOrdersLoaded = true;
    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
}

async function fetchApprovedDesignVersions(orderId) {
    if (!orderId || typeof supabase === 'undefined') return [];

    const { data: designs, error: designError } = await supabase
        .from('designs')
        .select(`
            id,
            design_versions!inner(
                id,
                version_number,
                status,
                sent_on,
                sent_by,
                file_id,
                files!inner(
                    id,
                    name,
                    path,
                    mime_type,
                    file_size
                )
            )
        `)
        .eq('order_id', orderId)
        .eq('design_versions.status', 'Approved');

    if (designError || !designs) return [];

    const versions = [];
    for (const design of designs || []) {
        for (const v of design.design_versions || []) {
            if (v.files) {
                versions.push({
                    designId: design.id,
                    versionId: v.id,
                    versionNumber: v.version_number,
                    sentOn: v.sent_on,
                    sentBy: v.sent_by,
                    fileId: v.files.id,
                    fileName: v.files.name,
                    filePath: v.files.path,
                    mimeType: v.files.mime_type,
                    fileSize: v.files.file_size
                });
            }
        }
    }

    versions.sort((a, b) => (a.version_number || 0) - (b.version_number || 0));
    return versions;
}

// =============================================
// RENDER RECEIVED ORDERS TABLE
// =============================================
async function renderOrdersTable() {
    if (!receivedOrdersLoaded) {
        await fetchReceivedOrders();
    }

    const tbody = document.getElementById('received-orders-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!ordersData.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="p-8 text-center text-slate-400">
                    No received orders found
                </td>
            </tr>
        `;
        updateStats();
        updateFilterCount();
        return;
    }

    ordersData.forEach((order, index) => {
        const isUrgent = order.priority === 'urgent';
        const seqNum = String(index + 1).padStart(2, '0');
        const row = document.createElement('tr');
        row.className = `order-row hover:bg-blue-600/10 transition-colors relative ${isUrgent ? 'bg-rose-500/5' : ''}`;
        row.setAttribute('data-priority', order.priority);
        row.setAttribute('data-machine', order.machine || '');
        row.setAttribute('data-status', order.status || '');
        row.setAttribute('data-index', index);
        row.innerHTML = `
            <td class="p-4 text-center font-mono font-medium ${isUrgent ? 'text-rose-400' : 'text-slate-400'} border-l-4 ${isUrgent ? 'border-rose-500' : 'border-slate-600'}">
                ${seqNum}
            </td>
            <td class="p-4 font-mono">${order.date}</td>
            <td class="p-4">
                <span class="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-medium border border-blue-500/20 capitalize">${order.taskType}</span>
            </td>
            <td class="p-4 font-mono text-slate-400">
                <span class="inline-flex items-center gap-2">
                    ${order.orderNum}
                </span>
            </td>
            <td class="p-4 ${isUrgent ? 'text-rose-300' : 'text-emerald-400'} font-medium">
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
                <button onclick="event.stopPropagation(); openProductionOrderInventoryModal('${order.id}', 'received')" class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all" title="Assign inventory items">
                    <i class="fa-solid fa-boxes-stacked mr-1"></i>Assign Items
                </button>
            </td>
        `;
        row.addEventListener('click', function() {
            openOrderDetails(index);
        });
        tbody.appendChild(row);
    });

    updateStats();
    updateFilterCount();
    populateMachineFilter();

    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

// =============================================
// RENDER STATUS BADGE
// =============================================
function renderStatusBadge(status) {
    const configs = {
        'new':          { color: 'text-blue-400',      bg: 'bg-blue-500/15',      border: 'border-blue-500/30',      icon: 'fa-regular fa-circle' },
        'in-progress':  { color: 'text-amber-400',     bg: 'bg-amber-500/15',     border: 'border-amber-500/30',     icon: 'fa-solid fa-spinner' },
        'completed':    { color: 'text-emerald-400',   bg: 'bg-emerald-500/15',   border: 'border-emerald-500/30',   icon: 'fa-solid fa-check-circle' }
    };
    const cfg = configs[status] || configs['new'];
    const label = status === 'in-progress' ? 'In Progress' : (status || 'new').replace(/-/g, ' ');
    return `
        <span class="inline-flex items-center gap-1 px-3 py-1 ${cfg.bg} ${cfg.color} ${cfg.border} rounded-full text-xs font-semibold capitalize">
            <i class="${cfg.icon} text-[9px] ${status === 'in-progress' ? 'animate-spin' : ''}"></i> ${label}
        </span>`;
}

// =============================================
// POPULATE MACHINE FILTER OPTIONS
// =============================================
function populateMachineFilter() {
    const machineFilter = document.getElementById('machine-filter');
    if (!machineFilter) return;

    const current = machineFilter.value;
    const machines = [...new Set(ordersData.map(o => o.machine).filter(m => m && m !== 'N/A'))].sort((a, b) => a.localeCompare(b));

    machineFilter.innerHTML = '<option value="all" class="text-slate-300">All Machines</option>';
    machines.forEach(machine => {
        const opt = document.createElement('option');
        opt.value = machine.toLowerCase();
        opt.textContent = machine;
        machineFilter.appendChild(opt);
    });

    if (current && [...machineFilter.options].some(o => o.value === current)) {
        machineFilter.value = current;
    } else {
        machineFilter.value = 'all';
    }
}

// =============================================
// UPDATE STATS CARDS
// =============================================
function updateStats() {
    const total = ordersData.length;
    const urgent = ordersData.filter(o => o.priority === 'urgent').length;
    const normal = ordersData.filter(o => o.priority === 'normal').length;

    const totalEl = document.getElementById('stats-total');
    const urgentEl = document.getElementById('stats-urgent');
    const normalEl = document.getElementById('stats-normal');
    
    if (totalEl) totalEl.textContent = total;
    if (urgentEl) urgentEl.textContent = urgent;
    if (normalEl) normalEl.textContent = normal;
}

// =============================================
// UPDATE FILTER COUNT
// =============================================
function updateFilterCount() {
    const filterValue = document.getElementById('priority-filter');
    const searchVal = document.getElementById('order-search');
    const filterCountEl = document.getElementById('filter-count');
    
    if (!filterValue || !searchVal || !filterCountEl) return;
    
    const visibleRows = document.querySelectorAll('.order-row:not(.hidden)');
    filterCountEl.textContent = visibleRows.length;
}

// =============================================
// SEARCH & FILTER ORDERS
// =============================================
function filterOrders() {
    const filterValue = document.getElementById('priority-filter');
    const machineFilter = document.getElementById('machine-filter');
    const statusFilter = document.getElementById('status-filter');
    const searchVal = document.getElementById('order-search');
    const noResults = document.getElementById('no-results-state');
    const clearBtn = document.getElementById('search-clear-btn');
    const filterCountEl = document.getElementById('filter-count');
    
    if (!filterValue || !searchVal) return;

    const priority = filterValue.value;
    const machine = machineFilter ? machineFilter.value : 'all';
    const status = statusFilter ? statusFilter.value : 'all';
    const search = searchVal.value.toLowerCase();
    const rows = document.querySelectorAll('.order-row');
    
    let visibleCount = 0;

    // Show/hide clear button
    if (search.length > 0) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }

    rows.forEach(row => {
        const rowPriority = row.getAttribute('data-priority');
        const rowMachine = (row.getAttribute('data-machine') || '').toLowerCase();
        const rowStatus = row.getAttribute('data-status');
        const text = row.innerText.toLowerCase();
        
        const matchesPriority = (priority === 'all' || rowPriority === priority);
        const matchesMachine = (machine === 'all' || rowMachine === machine);
        const matchesStatus = (status === 'all' || rowStatus === status);
        const matchesSearch = text.includes(search);
        
        if (matchesPriority && matchesMachine && matchesStatus && matchesSearch) {
            row.classList.remove('hidden');
            visibleCount++;
        } else {
            row.classList.add('hidden');
        }
    });

    // Show no results state if needed
    if (visibleCount === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }

    filterCountEl.textContent = visibleCount;
}

// =============================================
// CLEAR SEARCH
// =============================================
function clearSearch() {
    const searchInput = document.getElementById('order-search');
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    filterOrders();
}

// =============================================
// RESET FILTERS
// =============================================
function resetFilters() {
    const searchInput = document.getElementById('order-search');
    const priorityFilter = document.getElementById('priority-filter');
    const machineFilter = document.getElementById('machine-filter');
    const statusFilter = document.getElementById('status-filter');
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (searchInput) searchInput.value = '';
    if (priorityFilter) priorityFilter.value = 'all';
    if (machineFilter) machineFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (clearBtn) clearBtn.classList.remove('visible');
    filterOrders();
}

// =============================================
// OPEN ORDER MODAL
// =============================================
async function openOrderDetails(index) {
    const order = ordersData[index];
    if (!order) return;

    currentOrderIndex = index;
    currentDesignId = null;
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;
    
    // Populate all fields with order data
    document.getElementById('det-date').value = order.date;
    document.getElementById('det-title').value = `${order.title} (${order.orderNum})`;
    document.getElementById('det-material').value = order.material || 'Premium Acrylic';
    document.getElementById('det-thickness').value = order.thickness || '4mm';
    document.getElementById('det-color').value = order.color || 'Transparent Glossy';
    document.getElementById('det-machine').value = order.machine;
    document.getElementById('det-designer').value = order.designer;
    document.getElementById('det-order-num').value = order.orderNum;
    document.getElementById('det-order-num').dataset.orderId = order.id;

    // Fetch and populate note and attachments
    await populateOrderAttachments(order.id);

    // Set dimension values using dedicated IDs
    document.getElementById('det-length').value = order.length || '600 mm';
    document.getElementById('det-width').value = order.width || '400 mm';
    document.getElementById('det-height').value = order.height || '12 mm';
    document.getElementById('det-gram').value = order.gram || '150 g';

    // Set priority bar
    const isUrgent = order.priority === 'urgent';
    const priorityBar = document.getElementById('detail-priority-bar');
    const priorityText = document.getElementById('detail-priority-text');

    if (isUrgent) {
        priorityBar.className = 'flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 border-rose-500 bg-rose-500/10 text-sm';
        priorityBar.querySelector('i').className = 'fa-solid fa-circle-exclamation text-rose-400 text-lg';
        priorityText.innerHTML = '<strong class="text-rose-400">URGENT</strong> — This order requires immediate attention and should be prioritized.';
    } else {
        priorityBar.className = 'flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 text-sm';
        priorityBar.querySelector('i').className = 'fa-solid fa-circle-info text-emerald-400 text-lg';
        priorityText.innerHTML = '<strong class="text-emerald-400">NORMAL</strong> — Standard priority order. Process according to normal workflow.';
    }

    // Reset timeline
    const startEl = document.getElementById('ord-start-time');
    const endEl = document.getElementById('ord-end-time');
    const stepInProgress = document.getElementById('step-in-progress');
    const stepCompleted = document.getElementById('step-completed');

    if (order.startedAt) {
        const startTime = formatTimestamp(order.startedAt);
        startEl.innerText = `Started at: ${startTime}`;
        startEl.className = "text-[11px] text-center font-mono text-amber-400 font-bold border border-amber-500/30 bg-amber-500/10 py-1 rounded-lg shadow";
        stepInProgress.classList.add('active');
    } else {
        startEl.innerText = "recorded start time";
        startEl.className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";
    }

    if (order.completedAt) {
        const endTime = formatTimestamp(order.completedAt);
        endEl.innerText = `Ended at: ${endTime}`;
        endEl.className = "text-[11px] text-center font-mono text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 py-1 rounded-lg shadow";
        stepInProgress.classList.remove('active');
        stepInProgress.classList.add('completed');
        stepCompleted.classList.add('completed');
    } else {
        endEl.innerText = "recorded end time";
        endEl.className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";
    }

    // Reset timeline steps text
    document.getElementById('step-progress-text').innerHTML = order.completedAt ? 'Completed' : 'In Progress';
    document.getElementById('step-completed-text').innerHTML = 'Completed';

    // Reset and load shared design file versions
    currentSharedFile = null;
    const versionsList = document.getElementById('shared-versions-list');
    const sharedFileMeta = document.getElementById('shared-file-meta');

    if (versionsList) {
        versionsList.innerHTML = '<div class="text-xs text-slate-500">Loading approved versions...</div>';
    }
    if (sharedFileMeta) {
        sharedFileMeta.classList.add('hidden');
    }

    const versions = await fetchApprovedDesignVersions(order.orderId);
    approvedDesignVersions = versions;
    if (versionsList) {
        if (versions.length === 0) {
            versionsList.innerHTML = '<div class="text-xs text-slate-500">No approved versions found</div>';
        } else {
            versionsList.innerHTML = versions.map((v, idx) => `
                <div class="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 ${idx === versions.length - 1 ? 'ring-1 ring-emerald-500/30' : ''}">
                    <div class="flex items-center space-x-2 overflow-hidden">
                        <i class="fa-solid fa-file-vector text-emerald-400 text-lg flex-shrink-0"></i>
                        <div class="min-w-0">
                            <span class="text-xs text-slate-300 truncate font-mono block">${v.fileName}</span>
                            <span class="text-[10px] text-slate-500">v${v.versionNumber} · Approved · ${formatFileSize(v.fileSize)}</span>
                        </div>
                    </div>
                    <button onclick="downloadSharedFileVersion('${v.versionId}')" class="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded transition-all flex items-center shrink-0">
                        <i class="fa-solid fa-download mr-1"></i> download
                    </button>
                </div>
            `).join('');
            currentSharedFile = versions[versions.length - 1];
        }
    }

    // Open modal
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    
    // Reset modal scroll position
    modal.querySelector('.modal-container').scrollTop = 0;
}

// =============================================
// CLOSE ORDER MODAL
// =============================================
function closeOrderModal(event) {
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;
    
    // If event is passed and target is not the overlay itself, don't close
    if (event && event.target !== modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');

    const chatModal = document.getElementById('designer-chat-modal');
    if (chatModal) {
        chatModal.classList.remove('open');
    }

    const prodChatModal = document.getElementById('production-chat-modal');
    if (prodChatModal) {
        prodChatModal.classList.remove('open');
    }

    if (designerChatChannel && typeof supabase !== 'undefined') {
        supabase.removeChannel(designerChatChannel);
        designerChatChannel = null;
    }
    if (designerChatPollInterval) {
        clearInterval(designerChatPollInterval);
        designerChatPollInterval = null;
    }
    if (productionChatChannel && typeof supabase !== 'undefined') {
        supabase.removeChannel(productionChatChannel);
        productionChatChannel = null;
    }
    if (productionChatPollInterval) {
        clearInterval(productionChatPollInterval);
        productionChatPollInterval = null;
    }
}

// =============================================
// LOG ORDER STATUS TIME
// =============================================
async function logOrderStatusTime(mode) {
    if (currentOrderIndex < 0 || !ordersData[currentOrderIndex]) {
        alert('No order selected.');
        return;
    }

    const order = ordersData[currentOrderIndex];
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const isoNow = now.toISOString();
    
    const stepInProgress = document.getElementById('step-in-progress');
    const stepCompleted = document.getElementById('step-completed');
    
    if (mode === 'start') {
        const startEl = document.getElementById('ord-start-time');
        startEl.innerText = `Started at: ${timestamp}`;
        startEl.className = "text-[11px] text-center font-mono text-amber-400 font-bold border border-amber-500/30 bg-amber-500/10 py-1 rounded-lg shadow";
        
        // Update timeline
        stepInProgress.classList.add('active');
        document.getElementById('step-progress-text').innerHTML = 'In Progress <span class="text-amber-400 font-mono">(' + timestamp + ')</span>';
        
        // Persist to Supabase
        if (typeof supabase !== 'undefined' && order.id) {
            const { error } = await supabase
                .from('production_orders')
                .update({
                    started_at: isoNow,
                    status: 'In Progress'
                })
                .eq('id', order.id);

            if (error) {
                console.error('Error updating start time:', error);
                alert('Failed to save start time. Please try again.');
                return;
            }
        }
    } else if (mode === 'end') {
        const endEl = document.getElementById('ord-end-time');
        endEl.innerText = `Ended at: ${timestamp}`;
        endEl.className = "text-[11px] text-center font-mono text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 py-1 rounded-lg shadow";
        
        // Update timeline
        stepInProgress.classList.remove('active');
        stepInProgress.classList.add('completed');
        stepCompleted.classList.add('completed');
        document.getElementById('step-completed-text').innerHTML = 'Completed <span class="text-emerald-400 font-mono">(' + timestamp + ')</span>';
        
        // Persist to Supabase
        if (typeof supabase !== 'undefined' && order.id) {
            const { error } = await supabase
                .from('production_orders')
                .update({
                    completed_at: isoNow,
                    status: 'Completed'
                })
                .eq('id', order.id);

            if (error) {
                console.error('Error updating end time:', error);
                alert('Failed to save completion time. Please try again.');
                return;
            }
        }
    }
}

async function downloadSharedFileVersion(versionId) {
    const version = approvedDesignVersions.find(v => v.versionId === versionId) || currentSharedFile;
    if (!version || typeof supabase === 'undefined') {
        alert('No file selected for download.');
        return;
    }

    try {
        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(version.filePath, 60);

        if (error || !data?.signedUrl) {
            throw error || new Error('Failed to create download link');
        }

        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = version.fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file. Please try again.');
    }
}

// =============================================
// TEXT NOTE MODAL
// =============================================
function openTextNoteModal() {
    const modal = document.getElementById('text-note-modal');
    const editor = document.getElementById('text-note-editor');
    if (!modal || !editor) return;
    
    editor.value = '';
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(() => editor.focus(), 300);
}

function closeTextNoteModal(event) {
    const modal = document.getElementById('text-note-modal');
    if (!modal) return;
    
    if (event && event.target !== modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

function saveTextNote() {
    const note = document.getElementById('text-note-editor').value.trim();
    if (!note) {
        alert('Please write a note before saving.');
        return;
    }
    const modal = document.getElementById('text-note-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }
    alert('Note saved successfully!');
}

// =============================================
// VOICE RECORDING
// =============================================
let mediaRecorder = null;
let audioChunks = [];
let voiceTimerInterval = null;
let voiceSeconds = 0;

function startVoiceRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported in this browser.');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                const statusEl = document.getElementById('voice-recording-status');
                const statusTextEl = document.getElementById('voice-status-text');
                const timerEl = document.getElementById('voice-timer');
                
                if (statusEl) statusEl.classList.add('hidden');
                if (statusTextEl) statusTextEl.textContent = 'Recording...';
                if (timerEl) timerEl.textContent = '00:00';
                voiceSeconds = 0;
                clearInterval(voiceTimerInterval);
                
                alert('Voice recording saved! (' + Math.round(audioBlob.size / 1024) + ' KB recorded)');
            };
            
            mediaRecorder.start();
            
            // Show recording status
            const statusEl = document.getElementById('voice-recording-status');
            const statusTextEl = document.getElementById('voice-status-text');
            const timerEl = document.getElementById('voice-timer');
            
            if (statusEl) statusEl.classList.remove('hidden');
            if (statusTextEl) statusTextEl.textContent = 'Recording...';
            voiceSeconds = 0;
            if (timerEl) timerEl.textContent = '00:00';
            
            // Start timer
            clearInterval(voiceTimerInterval);
            voiceTimerInterval = setInterval(() => {
                voiceSeconds++;
                const mins = String(Math.floor(voiceSeconds / 60)).padStart(2, '0');
                const secs = String(voiceSeconds % 60).padStart(2, '0');
                if (timerEl) timerEl.textContent = mins + ':' + secs;
            }, 1000);
        })
        .catch(err => {
            alert('Microphone access denied. Please allow microphone permissions.');
        });
}

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// =============================================
// DESIGNER CHAT (design_communications)
// =============================================
let currentDesignId = null;
let designerChatMessages = [];

async function getDesignIdForOrder(orderId) {
    if (!orderId || typeof supabase === 'undefined') return null;

    const { data, error } = await supabase
        .from('designs')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

    if (error || !data) return null;
    return data.id;
}

async function fetchSingleCommunication(commId) {
    if (!commId || typeof supabase === 'undefined') return null;

    const { data, error } = await supabase
        .from('design_communications')
        .select(`
            *,
            sender:users!sender_id(username),
            receiver:users!receiver_id(username)
        `)
        .eq('id', commId)
        .single();

    if (error || !data) return null;

    let attachedFiles = [];
    if (data.attached_file_ids && data.attached_file_ids.length > 0) {
        const { data: files } = await supabase
            .from('files')
            .select('id, name, path')
            .in('id', data.attached_file_ids);
        attachedFiles = files || [];
    }

    return {
        id: data.id,
        message: data.message,
        isRead: data.is_read,
        readAt: data.read_at,
        createdAt: data.created_at,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        senderName: data.sender?.username || 'Unknown',
        receiverName: data.receiver?.username || 'Unknown',
        attachedFiles: attachedFiles
    };
}

async function fetchDesignCommunications(designId) {
    if (!designId || typeof supabase === 'undefined') return [];

    const { data, error } = await supabase
        .from('design_communications')
        .select(`
            *,
            sender:users!sender_id(username),
            receiver:users!receiver_id(username)
        `)
        .eq('design_id', designId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching design communications:', error);
        return [];
    }

    const communicationsWithFiles = await Promise.all(
        (data || []).map(async (comm) => {
            let attachedFiles = [];
            if (comm.attached_file_ids && comm.attached_file_ids.length > 0) {
                const { data: files } = await supabase
                    .from('files')
                    .select('id, name, path, mime_type')
                    .in('id', comm.attached_file_ids);
                attachedFiles = files || [];
            }
            return {
                id: comm.id,
                message: comm.message,
                isRead: comm.is_read,
                readAt: comm.read_at,
                createdAt: comm.created_at,
                senderId: comm.sender_id,
                receiverId: comm.receiver_id,
                senderName: comm.sender?.username || 'Unknown',
                receiverName: comm.receiver?.username || 'Unknown',
                attachedFiles: attachedFiles.map(f => ({ id: f.id, name: f.name, path: f.path, mimeType: f.mime_type }))
            };
        })
    );

    return communicationsWithFiles;
}

async function markAsRead(communicationId) {
    if (!communicationId || typeof supabase === 'undefined') return;

    const { error } = await supabase
        .from('design_communications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', communicationId);

    if (error) {
        console.error('Error marking as read:', error);
        return;
    }

    const msg = designerChatMessages.find(m => m.id === communicationId);
    if (msg) {
        msg.isRead = true;
        msg.readAt = new Date().toISOString();
        renderDesignChat(designerChatMessages);
    }
}

async function sendDesignCommunication(designId, messageText) {
    if (!designId || !messageText.trim() || typeof supabase === 'undefined') return null;

    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        alert('You must be logged in to send messages.');
        return null;
    }

    const { error } = await supabase
        .from('design_communications')
        .insert({
            design_id: designId,
            sender_id: currentUser.id,
            message: messageText.trim(),
            is_read: false
        });

    if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        return null;
    }

    return { success: true };
}

function renderDesignChat(messages) {
    const container = document.getElementById('designer-chat-messages');
    if (!container) return;

    const currentUser = Auth.getCurrentUser();
    const myId = currentUser ? currentUser.id : null;

    if (!messages.length) {
        container.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">No messages yet. Start the conversation!</div>';
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isMe = myId && msg.senderId === myId;
        const attachedHtml = (msg.attachedFiles && msg.attachedFiles.length > 0) ? `
            <div class="mt-2 space-y-1">
                ${msg.attachedFiles.map(file => `
                    <div class="flex items-center gap-2 bg-white/50 p-2 rounded">
                        <i class="fa-solid fa-file text-slate-500 text-xs"></i>
                        <span class="text-xs text-slate-700">${escapeHtml(file.name)}</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const unreadButton = (!msg.isRead && msg.senderId !== myId) ? `
            <button onclick="markAsRead('${msg.id}')" class="mt-1 text-xs text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer p-0">
                Mark as read
            </button>
        ` : '';

        return `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[80%] ${isMe ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'} rounded-xl px-4 py-2.5 text-sm shadow-sm">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-semibold ${isMe ? 'text-blue-200' : 'text-slate-400'}">${msg.senderName}</span>
                        <span class="text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-500'}">${formatChatTime(msg.createdAt)}</span>
                    </div>
                    <div class="text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(msg.message)}</div>
                    ${attachedHtml}
                    ${unreadButton}
                </div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimestamp(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(2);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${day}/${month}/${year} ${time}`;
}

async function openDesignerChat() {
    if (currentOrderIndex < 0 || !ordersData[currentOrderIndex]) {
        alert('Please select an order first.');
        return;
    }

    const order = ordersData[currentOrderIndex];
    const modal = document.getElementById('designer-chat-modal');
    if (!modal) return;

    modal.classList.add('open');
    document.body.classList.add('modal-open');
    designerChatMessages = [];

    const subtitle = document.getElementById('designer-chat-subtitle');
    if (subtitle) subtitle.textContent = 'Loading conversation...';

    const messagesContainer = document.getElementById('designer-chat-messages');
    if (messagesContainer) messagesContainer.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">Loading messages...</div>';

    const input = document.getElementById('designer-chat-input');
    if (input) {
        input.value = '';
        input.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendDesignerMessage();
            }
        };
    }

    if (!currentDesignId) {
        currentDesignId = await getDesignIdForOrder(order.orderId);
    }

    if (!currentDesignId) {
        if (messagesContainer) messagesContainer.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">No design linked to this order yet.</div>';
        if (subtitle) subtitle.textContent = 'No design linked';
        return;
    }

    designerChatMessages = await fetchDesignCommunications(currentDesignId);
    renderDesignChat(designerChatMessages);

    if (designerChatChannel) {
        supabase.removeChannel(designerChatChannel);
    }

    if (designerChatPollInterval) {
        clearInterval(designerChatPollInterval);
    }

    if (typeof supabase !== 'undefined' && currentDesignId) {
        designerChatChannel = supabase
            .channel(`design-communications-${currentDesignId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'design_communications',
                filter: `design_id=eq.${currentDesignId}`
            }, async (payload) => {
                const newComm = await fetchSingleCommunication(payload.new.id);
                if (newComm) {
                    if (!designerChatMessages.find(m => m.id === newComm.id)) {
                        designerChatMessages.push(newComm);
                        renderDesignChat(designerChatMessages);
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime chat connected');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime channel error');
                }
            });

        designerChatPollInterval = setInterval(async () => {
            if (currentDesignId) {
                const refreshed = await fetchDesignCommunications(currentDesignId);
                const existingIds = new Set(designerChatMessages.map(m => m.id));
                const newMsgs = refreshed.filter(m => !existingIds.has(m.id));
                if (newMsgs.length > 0) {
                    designerChatMessages.push(...newMsgs);
                    designerChatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    renderDesignChat(designerChatMessages);
                }
            }
        }, 5000);
    }

    const currentUser = Auth.getCurrentUser();
    if (subtitle) {
        subtitle.textContent = currentUser ? `Chatting as ${currentUser.name || currentUser.email}` : 'Chat';
    }
}

function closeDesignerChatModal(event) {
    if (event && event.target !== document.getElementById('designer-chat-modal')) return;
    const modal = document.getElementById('designer-chat-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-open');

    if (designerChatChannel && typeof supabase !== 'undefined') {
        supabase.removeChannel(designerChatChannel);
        designerChatChannel = null;
    }
    if (designerChatPollInterval) {
        clearInterval(designerChatPollInterval);
        designerChatPollInterval = null;
    }
}

async function sendDesignerMessage() {
    const input = document.getElementById('designer-chat-input');
    if (!input || !input.value.trim() || !currentDesignId) return;

    const messageText = input.value.trim();
    input.value = '';

    const sentMsg = await sendDesignCommunication(currentDesignId, messageText);
}

// Populate order attachments and note
async function populateOrderAttachments(orderId) {
    try {
        // Fetch production order with note and attached_file_ids
        const { data: productionOrder, error: orderError } = await supabase
            .from('production_orders')
            .select('note, attached_file_ids')
            .eq('id', orderId)
            .single();
        
        if (orderError) throw orderError;
        
        // Populate note
        const noteInput = document.getElementById('det-note');
        if (noteInput) {
            noteInput.value = productionOrder.note || '';
        }
        
        // Fetch and populate attached files
        const filesList = document.getElementById('attached-files-list');
        if (filesList && productionOrder.attached_file_ids && productionOrder.attached_file_ids.length > 0) {
            const { data: files, error: filesError } = await supabase
                .from('files')
                .select('*')
                .in('id', productionOrder.attached_file_ids);
            
            if (filesError) throw filesError;
            
            if (files && files.length > 0) {
                const fileHtmlPromises = files.map(async file => {
                    const fileUrl = await getFileUrl(file.path);
                    
                    return `
                        <div class="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <i class="fa-solid fa-file text-purple-400 text-xs shrink-0"></i>
                                <a href="${fileUrl}" target="_blank" class="text-xs text-slate-300 hover:text-blue-400 truncate max-w-[180px] transition-colors" title="Open in new tab">${file.name}</a>
                                <span class="text-[10px] text-slate-500 shrink-0">(${formatFileSize(file.file_size)})</span>
                            </div>
                            <button onclick="downloadFileById('${file.id}')" class="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1" title="Download without opening">
                                <i class="fa-solid fa-download text-[9px]"></i> Download
                            </button>
                        </div>
                    `;
                });
                filesList.innerHTML = (await Promise.all(fileHtmlPromises)).join('');
            } else {
                filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
            }
        } else if (filesList) {
            filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        }
    } catch (error) {
        console.error('Error populating attachments:', error);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get file URL with fallback
async function getFileUrl(filePath) {
    try {
        console.log('Attempting to get signed URL for:', filePath);
        const { data, error } = await window.supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
        if (error) {
            console.error('Supabase signed URL error:', error);
            // Try public URL as fallback
            const { data: publicData, error: publicError } = await window.supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            if (publicError) {
                console.error('Public URL error:', publicError);
                return null;
            }
            console.log('Using public URL:', publicData.publicUrl);
            return publicData.publicUrl;
        }
        console.log('Signed URL generated:', data.signedUrl);
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting file URL:', error);
        return null;
    }
}

// Download a file by its record id (looks up path and name from files table)
async function downloadFileById(fileId) {
    try {
        const { data, error } = await window.supabase
            .from('files')
            .select('name, path')
            .eq('id', fileId)
            .single();
        if (error || !data) {
            throw error || new Error('File not found');
        }
        await downloadFile(data.path, data.name);
    } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file. Please try again.');
    }
}

// Download a file directly without opening it
async function downloadFile(filePath, fileName) {
    try {
        const { data, error } = await window.supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 60);
        if (error || !data?.signedUrl) {
            throw error || new Error('Failed to create download link');
        }
        const response = await fetch(data.signedUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file. Please try again.');
    }
}

// =============================================
// PRODUCTION CHAT (production_communications)
// =============================================
let currentProductionOrderId = null;
let productionChatMessages = [];
let productionPendingFiles = [];

async function fetchSingleProductionCommunication(commId) {
    if (!commId || typeof supabase === 'undefined') return null;

    const { data, error } = await supabase
        .from('production_communications')
        .select(`
            *,
            sender:users!sender_id(username),
            receiver:users!receiver_id(username)
        `)
        .eq('id', commId)
        .single();

    if (error || !data) return null;

    let attachedFiles = [];
    if (data.attached_file_ids && data.attached_file_ids.length > 0) {
        const { data: files } = await supabase
            .from('files')
            .select('id, name, path, mime_type')
            .in('id', data.attached_file_ids);
        attachedFiles = files || [];
    }

    return {
        id: data.id,
        message: data.message,
        isRead: data.is_read,
        readAt: data.read_at,
        createdAt: data.created_at,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        senderName: data.sender?.username || 'Unknown',
        receiverName: data.receiver?.username || 'Unknown',
        attachedFiles: attachedFiles.map(f => ({ id: f.id, name: f.name, path: f.path, mimeType: f.mime_type }))
    };
}

async function fetchProductionCommunications(productionOrderId) {
    if (!productionOrderId || typeof supabase === 'undefined') return [];

    const { data, error } = await supabase
        .from('production_communications')
        .select(`
            *,
            sender:users!sender_id(username),
            receiver:users!receiver_id(username)
        `)
        .eq('production_order_id', productionOrderId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching production communications:', error);
        return [];
    }

    const communicationsWithFiles = await Promise.all(
        (data || []).map(async (comm) => {
            let attachedFiles = [];
            if (comm.attached_file_ids && comm.attached_file_ids.length > 0) {
                const { data: files } = await supabase
                    .from('files')
                    .select('id, name, path, mime_type')
                    .in('id', comm.attached_file_ids);
                attachedFiles = files || [];
            }
            return {
                id: comm.id,
                message: comm.message,
                isRead: comm.is_read,
                readAt: comm.read_at,
                createdAt: comm.created_at,
                senderId: comm.sender_id,
                receiverId: comm.receiver_id,
                senderName: comm.sender?.username || 'Unknown',
                receiverName: comm.receiver?.username || 'Unknown',
                attachedFiles: attachedFiles.map(f => ({ id: f.id, name: f.name, path: f.path, mimeType: f.mime_type }))
            };
        })
    );

    return communicationsWithFiles;
}

async function markProductionAsRead(communicationId) {
    if (!communicationId || typeof supabase === 'undefined') return;

    const { error } = await supabase
        .from('production_communications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', communicationId);

    if (error) {
        console.error('Error marking as read:', error);
        return;
    }

    const msg = productionChatMessages.find(m => m.id === communicationId);
    if (msg) {
        msg.isRead = true;
        msg.readAt = new Date().toISOString();
        renderProductionChat(productionChatMessages);
    }
}

async function sendProductionCommunication(productionOrderId, messageText, attachedFileIds) {
    if (!productionOrderId || typeof supabase === 'undefined') return null;
    if (!messageText.trim() && (!attachedFileIds || attachedFileIds.length === 0)) return null;

    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        alert('You must be logged in to send messages.');
        return null;
    }

    const insertData = {
        production_order_id: productionOrderId,
        sender_id: currentUser.id,
        message: messageText.trim(),
        is_read: false
    };
    if (attachedFileIds && attachedFileIds.length > 0) {
        insertData.attached_file_ids = attachedFileIds;
    }

    const { error } = await supabase
        .from('production_communications')
        .insert(insertData);

    if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        return null;
    }

    return { success: true };
}

function productionFileTypeIcon(mimeType) {
    if (!mimeType) return 'fa-file';
    if (mimeType.startsWith('image/')) return 'fa-file-image';
    if (mimeType.startsWith('video/')) return 'fa-file-video';
    if (mimeType.startsWith('audio/')) return 'fa-file-audio';
    if (mimeType.includes('pdf')) return 'fa-file-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'fa-file-word';
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'fa-file-excel';
    if (mimeType.startsWith('text/')) return 'fa-file-lines';
    if (mimeType.includes('zip') || mimeType.includes('compress')) return 'fa-file-zipper';
    return 'fa-file';
}

function renderProductionChat(messages, container, markReadFnName) {
    container = container || document.getElementById('production-chat-messages');
    markReadFnName = markReadFnName || 'markProductionAsRead';
    if (!container) return;

    const currentUser = Auth.getCurrentUser();
    const myId = currentUser ? currentUser.id : null;

    if (!messages.length) {
        container.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">No messages yet. Start the conversation!</div>';
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isMe = myId && msg.senderId === myId;
        const attachedHtml = (msg.attachedFiles && msg.attachedFiles.length > 0) ? `
            <div class="mt-2 space-y-1">
                ${msg.attachedFiles.map(file => `
                    <button onclick="event.stopPropagation(); downloadFileById('${file.id}')" title="Download ${escapeHtml(file.name)}" class="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 rounded transition-colors text-left">
                        <i class="fa-solid ${productionFileTypeIcon(file.mimeType)} text-emerald-400 text-xs"></i>
                        <span class="text-xs text-slate-200 truncate flex-1">${escapeHtml(file.name)}</span>
                        <i class="fa-solid fa-download text-slate-400 text-[10px]"></i>
                    </button>
                `).join('')}
            </div>
        ` : '';

        const unreadButton = (!msg.isRead && msg.senderId !== myId) ? `
            <button onclick="${markReadFnName}('${msg.id}')" class="mt-1 text-xs text-emerald-400 hover:text-emerald-200 bg-transparent border-none cursor-pointer p-0">
                Mark as read
            </button>
        ` : '';

        return `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[80%] ${isMe ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'} rounded-xl px-4 py-2.5 text-sm shadow-sm">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-semibold ${isMe ? 'text-emerald-100' : 'text-slate-400'}">${msg.senderName}</span>
                        <span class="text-[10px] ${isMe ? 'text-emerald-100' : 'text-slate-500'}">${formatChatTime(msg.createdAt)}</span>
                    </div>
                    <div class="text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(msg.message)}</div>
                    ${attachedHtml}
                    ${unreadButton}
                    ${isMe ? `<div class="text-right mt-1"><i class="fa-solid ${msg.isRead ? 'fa-check-double' : 'fa-check'} text-[9px] ${msg.isRead ? 'text-white' : 'text-emerald-100'}"></i></div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

async function openProductionChat() {
    if (currentOrderIndex < 0 || !ordersData[currentOrderIndex]) {
        alert('Please select an order first.');
        return;
    }

    const order = ordersData[currentOrderIndex];
    const modal = document.getElementById('production-chat-modal');
    if (!modal) return;

    modal.classList.add('open');
    document.body.classList.add('modal-open');
    productionChatMessages = [];
    productionPendingFiles = [];
    productionRenderPendingFiles();

    const subtitle = document.getElementById('production-chat-subtitle');
    if (subtitle) subtitle.textContent = 'Loading conversation...';

    const messagesContainer = document.getElementById('production-chat-messages');
    if (messagesContainer) messagesContainer.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">Loading messages...</div>';

    const input = document.getElementById('production-chat-input');
    if (input) {
        input.value = '';
        input.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendProductionMessage();
            }
        };
    }

    currentProductionOrderId = order.id || null;

    if (!currentProductionOrderId) {
        if (messagesContainer) messagesContainer.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">No production work linked to this order.</div>';
        if (subtitle) subtitle.textContent = 'No production work linked';
        return;
    }

    productionChatMessages = await fetchProductionCommunications(currentProductionOrderId);

    // Auto-mark unread incoming messages as read once the chat is open (like web panel)
    const myId = Auth.getCurrentUser() ? Auth.getCurrentUser().id : null;
    const pendingUnread = productionChatMessages.filter(m => !m.isRead && m.senderId !== myId);
    if (pendingUnread.length > 0 && typeof supabase !== 'undefined') {
        supabase
            .from('production_communications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', pendingUnread.map(m => m.id))
            .then(({ error }) => {
                if (!error) {
                    pendingUnread.forEach(m => { m.isRead = true; m.readAt = new Date().toISOString(); });
                    renderProductionChat(productionChatMessages);
                }
            });
    }
    loadProductionUnreadIds();

    renderProductionChat(productionChatMessages);

    if (productionChatChannel) {
        supabase.removeChannel(productionChatChannel);
    }

    if (productionChatPollInterval) {
        clearInterval(productionChatPollInterval);
    }

    if (typeof supabase !== 'undefined' && currentProductionOrderId) {
        productionChatChannel = supabase
            .channel(`production-communications-${currentProductionOrderId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'production_communications',
                filter: `production_order_id=eq.${currentProductionOrderId}`
            }, async (payload) => {
                const newComm = await fetchSingleProductionCommunication(payload.new.id);
                if (newComm) {
                    if (!productionChatMessages.find(m => m.id === newComm.id)) {
                        productionChatMessages.push(newComm);
                        renderProductionChat(productionChatMessages);
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Production realtime chat connected');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Production realtime channel error');
                }
            });

        productionChatPollInterval = setInterval(async () => {
            if (currentProductionOrderId) {
                const refreshed = await fetchProductionCommunications(currentProductionOrderId);
                const existingIds = new Set(productionChatMessages.map(m => m.id));
                const newMsgs = refreshed.filter(m => !existingIds.has(m.id));
                if (newMsgs.length > 0) {
                    productionChatMessages.push(...newMsgs);
                    productionChatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    renderProductionChat(productionChatMessages);
                }
            }
        }, 5000);
    }

    const currentUser = Auth.getCurrentUser();
    if (subtitle) {
        subtitle.textContent = currentUser ? `Chatting as ${currentUser.name || currentUser.email}` : 'Chat';
    }
}

function closeProductionChatModal(event) {
    if (event && event.target !== document.getElementById('production-chat-modal')) return;
    const modal = document.getElementById('production-chat-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    currentProductionOrderId = null;
    productionPendingFiles = [];
    productionRenderPendingFiles();

    if (productionChatChannel && typeof supabase !== 'undefined') {
        supabase.removeChannel(productionChatChannel);
        productionChatChannel = null;
    }
    if (productionChatPollInterval) {
        clearInterval(productionChatPollInterval);
        productionChatPollInterval = null;
    }
}

function productionOnFileSelect(input) {
    if (!input || !input.files) return;
    for (const file of input.files) {
        productionPendingFiles.push(file);
    }
    input.value = '';
    productionRenderPendingFiles();
}

function productionRemovePendingFile(index) {
    if (index < 0 || index >= productionPendingFiles.length) return;
    productionPendingFiles.splice(index, 1);
    productionRenderPendingFiles();
}

function productionRenderPendingFiles() {
    const container = document.getElementById('production-chat-pending-files');
    if (!container) return;
    if (productionPendingFiles.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }
    container.classList.remove('hidden');
    container.innerHTML = productionPendingFiles.map((file, index) => `
        <span class="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
            <i class="fa-solid ${productionFileTypeIcon(file.type || '')} text-emerald-400 text-[10px]"></i>
            <span class="max-w-[140px] truncate">${escapeHtml(file.name)}</span>
            <button onclick="productionRemovePendingFile(${index})" class="text-slate-400 hover:text-rose-400 transition-colors" title="Remove">
                <i class="fa-solid fa-xmark text-[10px]"></i>
            </button>
        </span>
    `).join('');
}

async function sendProductionMessage() {
    const input = document.getElementById('production-chat-input');
    if (!input || !currentProductionOrderId) return;

    const messageText = input.value.trim();
    if (!messageText && productionPendingFiles.length === 0) return;

    input.value = '';

    let attachedFileIds = [];
    if (typeof uploadFile === 'function' && productionPendingFiles.length > 0) {
        for (const file of productionPendingFiles) {
            const fileData = await uploadFile(file);
            if (fileData && fileData.id) {
                attachedFileIds.push(fileData.id);
            }
        }
        productionPendingFiles = [];
        productionRenderPendingFiles();
    }

    const sent = await sendProductionCommunication(currentProductionOrderId, messageText, attachedFileIds);
    if (sent) {
        const refreshed = await fetchProductionCommunications(currentProductionOrderId);
        if (refreshed && typeof renderProductionChat === 'function') {
            productionChatMessages = refreshed;
            renderProductionChat(productionChatMessages);
        }
    }
}

// =============================================
// PRODUCTION UNREAD INDICATOR (red dots on rows)
// =============================================
async function loadProductionUnreadIds() {
    if (typeof supabase === 'undefined') return;

    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('production_communications')
        .select('production_order_id')
        .eq('is_read', false)
        .neq('sender_id', currentUser.id);

    if (error) return;
    productionUnreadIds = new Set((data || []).map(row => row.production_order_id));
    refreshProductionUnreadDots();
}

function refreshProductionUnreadDots() {
    document.querySelectorAll('tr.order-row').forEach(row => {
        const index = row.getAttribute('data-index');
        const order = ordersData[index];
        const dot = row.querySelector('.prod-unread-dot');
        if (!dot) return;
        const hasUnread = order && productionUnreadIds.has(order.id);
        dot.style.display = hasUnread ? 'inline-block' : 'none';
    });

    document.querySelectorAll('tr.aw-order-row').forEach(row => {
        const id = row.getAttribute('data-id');
        const dot = row.querySelector('.prod-unread-dot');
        if (!dot) return;
        dot.style.display = id && productionUnreadIds.has(id) ? 'inline-block' : 'none';
    });

    const sidebarDot = document.getElementById('sidebar-prod-unread-dot');
    if (sidebarDot) {
        sidebarDot.style.display = productionUnreadIds.size > 0 ? 'inline-block' : 'none';
    }
    const sidebarDotAw = document.getElementById('sidebar-prod-unread-dot-aw');
    if (sidebarDotAw) {
        sidebarDotAw.style.display = productionUnreadIds.size > 0 ? 'inline-block' : 'none';
    }
    if (typeof awRefreshUnreadDots === 'function') {
        awRefreshUnreadDots();
    }
}

function startProductionUnreadPoll() {
    loadProductionUnreadIds();
    if (productionChatUnreadPollInterval) {
        clearInterval(productionChatUnreadPollInterval);
    }
    productionChatUnreadPollInterval = setInterval(loadProductionUnreadIds, 5000);
}